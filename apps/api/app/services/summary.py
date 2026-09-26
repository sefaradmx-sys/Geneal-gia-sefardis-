from collections import defaultdict
from datetime import datetime, time, timedelta, timezone
from itertools import combinations

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.entities import DailyMetric, Mention, Study
from app.schemas.dto import (
    AlertView,
    EvidenceMention,
    Methodology,
    OutletCoverage,
    Preference,
    SeriesPoint,
    Slice,
    StudyCoverage,
    StudySummary,
    TargetSummary,
)
from app.services.scoring import (
    DISCLAIMER,
    KNOWN_BIASES,
    AggregateResult,
    ScoringConfig,
    aggregate,
    config_from_dict,
    gate_mention,
    reach_of,
    stability_half_width,
)


class ScoredLink:
    def __init__(self, mention: Mention, target_id, target_name, target_kind, comparable, included, review, weight, reach):
        self.mention = mention
        self.target_id = target_id
        self.target_name = target_name
        self.target_kind = target_kind
        self.comparable = comparable
        self.included = included
        self.review = review
        self.weight = weight
        self.reach = reach

    @property
    def sentiment(self) -> str:
        return self.mention.classification.sentiment if self.mention.classification else "neutral"

    @property
    def stance(self) -> str:
        return self.mention.classification.stance if self.mention.classification else "not_applicable"

    @property
    def theme(self) -> str:
        return self.mention.theme or "general"


def study_as_of(study: Study) -> datetime:
    now = datetime.now(timezone.utc)
    end = datetime.combine(study.window_end, time(23, 59, 59), tzinfo=timezone.utc)
    return min(now, end)


def _load_mentions(session: Session, study: Study, as_of: datetime) -> list[Mention]:
    start = datetime.combine(study.window_start, time.min, tzinfo=timezone.utc)
    stmt = (
        select(Mention)
        .where(Mention.study_id == study.id, Mention.published_at >= start, Mention.published_at <= as_of)
        .options(selectinload(Mention.classification), selectinload(Mention.links))
    )
    return list(session.scalars(stmt).unique().all())


def collect(session: Session, study: Study) -> tuple[list[ScoredLink], datetime, ScoringConfig]:
    config = config_from_dict(study.scoring_config)
    as_of = study_as_of(study)
    targets = {target.id: target for target in study.targets}
    scored: list[ScoredLink] = []
    for mention in _load_mentions(session, study, as_of):
        classification = mention.classification
        confidence = classification.confidence if classification else 0.0
        irony = classification.irony if classification else 0.0
        for link in mention.links:
            target = targets.get(link.target_id)
            if target is None:
                continue
            included, review, weight = gate_mention(
                confidence=confidence,
                relevance=link.relevance,
                likes=mention.likes,
                replies=mention.replies,
                shares=mention.shares,
                views=mention.views,
                followers=mention.author_followers,
                is_bot=mention.is_bot,
                source_kind=mention.source_kind,
                published_at=mention.published_at,
                as_of=as_of,
                irony=irony,
                config=config,
            )
            scored.append(
                ScoredLink(
                    mention=mention,
                    target_id=target.id,
                    target_name=target.name,
                    target_kind=target.kind,
                    comparable=target.comparable,
                    included=included,
                    review=review,
                    weight=weight,
                    reach=reach_of(mention.views, mention.author_followers),
                )
            )
    return scored, as_of, config


def _aggregate(rows: list[ScoredLink], neutral_factor: float) -> AggregateResult:
    included = [(row.sentiment, row.weight, row.reach) for row in rows if row.included]
    review_count = sum(1 for row in rows if row.review)
    return aggregate(included, neutral_factor=neutral_factor, review_count=review_count)


def _series(rows: list[ScoredLink], neutral_factor: float) -> list[SeriesPoint]:
    by_day: dict = defaultdict(list)
    for row in rows:
        if row.included:
            by_day[row.mention.published_at.date()].append(row)
    points = []
    for day in sorted(by_day):
        result = _aggregate(by_day[day], neutral_factor)
        points.append(
            SeriesPoint(
                day=day,
                favorability_index=None if result.favorability_index is None else round(result.favorability_index, 1),
                pct_negative=result.pct_negative,
                volume=result.volume,
            )
        )
    return points


def _slices(rows: list[ScoredLink], neutral_factor: float, key_fn) -> list[Slice]:
    grouped: dict[str, list[ScoredLink]] = defaultdict(list)
    for row in rows:
        grouped[key_fn(row) or "sin_dato"].append(row)
    slices = []
    for key, bucket in grouped.items():
        result = _aggregate(bucket, neutral_factor)
        slices.append(
            Slice(
                key=key,
                volume=result.volume,
                pct_positive=result.pct_positive,
                pct_negative=result.pct_negative,
                pct_neutral=result.pct_neutral,
                favorability_index=None if result.favorability_index is None else round(result.favorability_index, 1),
            )
        )
    return sorted(slices, key=lambda item: item.volume, reverse=True)


def _theme_reasons(left: list[ScoredLink], right: list[ScoredLink]) -> list[str]:
    def nets(rows: list[ScoredLink]) -> dict[str, float]:
        acc: dict[str, float] = defaultdict(float)
        for row in rows:
            if not row.included:
                continue
            sign = 1 if row.sentiment == "positive" else -1 if row.sentiment == "negative" else 0
            acc[row.theme] += sign * row.weight
        return acc

    left_net = nets(left)
    right_net = nets(right)
    themes = set(left_net) | set(right_net)
    ranked = sorted(themes, key=lambda theme: left_net[theme] - right_net[theme], reverse=True)
    return [theme for theme in ranked if left_net[theme] - right_net[theme] > 0][:2]


def _headline(left_name: str, right_name: str, delta: float, interval: float, reasons: list[str]) -> tuple[str | None, str]:
    if delta < interval:
        text = (
            f"La diferencia entre {left_name} y {right_name} ({delta:.0f} puntos) "
            f"cabe en el intervalo de estabilidad (±{interval:.0f}). No es una encuesta."
        )
        return left_name if delta > 0 else None, text
    reason_text = " y ".join(reasons) if reasons else "el peso de las menciones"
    text = f"El índice prefiere a {left_name} por {delta:.0f} puntos; razones: {reason_text}."
    return left_name, text


def _alerts(grouped: dict, as_of: datetime, neutral_factor: float) -> list[AlertView]:
    alerts = []
    last_start = as_of - timedelta(hours=24)
    prev_start = as_of - timedelta(hours=48)
    for target_id, rows in grouped.items():
        last_rows = [row for row in rows if last_start < row.mention.published_at <= as_of]
        prev_rows = [row for row in rows if prev_start < row.mention.published_at <= last_start]
        last = _aggregate(last_rows, neutral_factor)
        prev = _aggregate(prev_rows, neutral_factor)
        if last.volume < 15 or prev.volume < 15:
            continue
        delta = last.pct_negative - prev.pct_negative
        if delta < 15:
            continue
        name = rows[0].target_name
        alerts.append(
            AlertView(
                target_id=target_id,
                target_name=name,
                rule="negativity_spike_24h",
                delta_points=round(delta, 1),
                message=(
                    f"La negatividad de {name} subió {delta:.0f} puntos en 24 horas "
                    f"(de {prev.pct_negative:.0f}% a {last.pct_negative:.0f}%). "
                    "Sentimiento digital observado, no es una encuesta."
                ),
            )
        )
    return alerts


def _evidence(rows: list[ScoredLink], index: float | None) -> list[EvidenceMention]:
    included = [row for row in rows if row.included]
    if index is not None and index < 0:
        pool = [row for row in included if row.sentiment == "negative"] or included
    elif index is not None and index > 0:
        pool = [row for row in included if row.sentiment == "positive"] or included
    else:
        pool = included
    pool = sorted(pool, key=lambda row: row.weight, reverse=True)[:20]
    evidence = []
    for row in pool:
        mention = row.mention
        evidence.append(
            EvidenceMention(
                id=mention.id,
                text=mention.text_original,
                source=mention.source_kind,
                published_at=mention.published_at,
                sentiment=row.sentiment,
                stance=row.stance,
                weight=round(row.weight, 3),
                url=mention.url,
                author_handle=mention.author_handle,
                theme=mention.theme,
                municipality=mention.geo_municipality,
            )
        )
    return evidence


def build_summary(session: Session, study: Study) -> StudySummary:
    scored, _as_of, config = collect(session, study)
    grouped: dict = defaultdict(list)
    for row in scored:
        grouped[row.target_id].append(row)
    weight_totals = {
        target_id: sum(row.weight for row in rows if row.included) for target_id, rows in grouped.items()
    }
    total_weight = sum(weight_totals.values()) or 1.0
    targets: list[TargetSummary] = []
    order = {target.id: index for index, target in enumerate(study.targets)}
    for target_id, rows in sorted(grouped.items(), key=lambda item: order.get(item[0], 0)):
        result = _aggregate(rows, config.neutral_factor)
        index = None if result.favorability_index is None else round(result.favorability_index, 1)
        targets.append(
            TargetSummary(
                id=target_id,
                name=rows[0].target_name,
                kind=rows[0].target_kind,
                comparable=rows[0].comparable,
                pct_positive=result.pct_positive,
                pct_negative=result.pct_negative,
                pct_neutral=result.pct_neutral,
                favorability_index=index,
                volume=result.volume,
                reach=round(result.reach, 0),
                share_of_voice=round(100 * weight_totals[target_id] / total_weight, 1),
                review_count=result.review_count,
                series=_series(rows, config.neutral_factor),
                by_source=_slices(rows, config.neutral_factor, lambda row: row.mention.source_kind),
                by_geo=_slices(rows, config.neutral_factor, lambda row: row.mention.geo_municipality),
            )
        )

    preferences: list[Preference] = []
    comparable = [item for item in targets if item.comparable and item.favorability_index is not None]
    for left, right in combinations(comparable, 2):
        if left.favorability_index >= right.favorability_index:
            winner, loser = left, right
        else:
            winner, loser = right, left
        delta = round(winner.favorability_index - loser.favorability_index, 1)
        interval = round(stability_half_width(winner.volume + loser.volume), 1)
        reasons = _theme_reasons(grouped[winner.id], grouped[loser.id])
        preferred, headline = _headline(winner.name, loser.name, delta, interval, reasons)
        preferences.append(
            Preference(
                left_id=winner.id,
                left_name=winner.name,
                right_id=loser.id,
                right_name=loser.name,
                delta=delta,
                interval=interval,
                n=winner.volume + loser.volume,
                preferred_name=preferred,
                reasons=reasons,
                headline=headline,
            )
        )

    hero = next((item for item in targets if item.kind == "government"), targets[0] if targets else None)
    evidence = _evidence(grouped[hero.id], hero.favorability_index) if hero else []
    sources = sorted({row.mention.source_kind for row in scored})
    return StudySummary(
        study_id=study.id,
        name=study.name,
        description=study.description,
        window_start=study.window_start,
        window_end=study.window_end,
        disclaimer=DISCLAIMER,
        known_biases=_declared_biases(study.scoring_config),
        is_demo=study.is_demo,
        coverage=_coverage_from_config(study.scoring_config),
        targets=targets,
        preferences=preferences,
        alerts=_alerts(grouped, _as_of, config.neutral_factor),
        evidence=evidence,
        methodology=Methodology(
            n=sum(item.volume for item in targets),
            sources=sources,
            half_life_days=config.half_life_days,
            neutral_factor=config.neutral_factor,
            min_confidence=config.min_confidence,
            source_weights=config.source_weights,
            formula="100 * (Wpos - Wneg) / (Wpos + Wneg + Wneu * factor_neutro)",
        ),
    )


def _outlet_list(raw: object) -> list[OutletCoverage]:
    if not isinstance(raw, list):
        return []
    outlets: list[OutletCoverage] = []
    for item in raw:
        if not isinstance(item, dict) or not item.get("name"):
            continue
        outlets.append(
            OutletCoverage(
                name=str(item["name"]),
                url=item.get("url"),
                kind=str(item.get("kind") or "otro"),
                status=str(item.get("status") or "desconocido"),
                civic_items=int(item.get("civic_items") or 0),
                note=str(item.get("note") or ""),
            )
        )
    return outlets


def _coverage_from_config(data: dict | None) -> StudyCoverage:
    raw = data.get("coverage") if isinstance(data, dict) else None
    if not isinstance(raw, dict):
        return StudyCoverage()
    return StudyCoverage(
        own_outlets=_outlet_list(raw.get("own_outlets")),
        excluded_outlets=_outlet_list(raw.get("excluded_outlets")),
        missing_platforms=_outlet_list(raw.get("missing_platforms")),
    )


def _declared_biases(data: dict | None) -> list[str]:
    declared: list[str] = []
    if isinstance(data, dict) and isinstance(data.get("declared_biases"), list):
        declared = [str(item) for item in data["declared_biases"] if item]
    merged = [*declared]
    for bias in KNOWN_BIASES:
        if bias not in merged:
            merged.append(bias)
    return merged


def snapshot_study(session: Session, study: Study) -> None:
    scored, _as_of, config = collect(session, study)
    session.query(DailyMetric).filter(DailyMetric.study_id == study.id).delete()
    grouped: dict = defaultdict(list)
    for row in scored:
        if row.included:
            grouped[(row.target_id, row.mention.published_at.date())].append(row)
    for (target_id, day), rows in grouped.items():
        result = _aggregate(rows, config.neutral_factor)
        session.add(
            DailyMetric(
                study_id=study.id,
                target_id=target_id,
                day=day,
                source_kind="",
                w_pos=result.w_pos,
                w_neg=result.w_neg,
                w_neu=result.w_neu,
                pct_positive=result.pct_positive,
                pct_negative=result.pct_negative,
                pct_neutral=result.pct_neutral,
                favorability_index=result.favorability_index,
                volume=result.volume,
                reach=result.reach,
                review_count=result.review_count,
            )
        )
