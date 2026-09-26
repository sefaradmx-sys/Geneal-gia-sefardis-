from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str


class LoginRequest(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: UUID
    organization_id: UUID
    email: str
    username: str
    role: str
    is_active: bool

    model_config = {"from_attributes": True}


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=80)
    email: str = Field(min_length=3, max_length=200)
    password: str = Field(min_length=8, max_length=200)
    role: str
    organization_id: UUID | None = None


class UserPatch(BaseModel):
    role: str | None = None
    is_active: bool | None = None
    password: str | None = Field(default=None, min_length=8, max_length=200)


class OrganizationOut(BaseModel):
    id: UUID
    name: str
    slug: str

    model_config = {"from_attributes": True}


class OrganizationCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    slug: str = Field(min_length=2, max_length=80)


class OrganizationPatch(BaseModel):
    name: str | None = None


class AliasOut(BaseModel):
    id: UUID
    phrase: str
    kind: str

    model_config = {"from_attributes": True}


class AliasCreate(BaseModel):
    phrase: str = Field(min_length=1, max_length=200)
    kind: str


class TargetOut(BaseModel):
    id: UUID
    name: str
    kind: str
    comparable: bool
    description: str
    aliases: list[AliasOut] = []

    model_config = {"from_attributes": True}


class TargetCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    kind: str
    comparable: bool = False
    description: str = ""


class TargetPatch(BaseModel):
    name: str | None = None
    comparable: bool | None = None
    description: str | None = None


class StudyCreate(BaseModel):
    name: str = Field(min_length=3, max_length=200)
    description: str = ""
    window_start: date
    window_end: date
    scoring_config: dict | None = None


class StudyPatch(BaseModel):
    name: str | None = None
    description: str | None = None
    window_start: date | None = None
    window_end: date | None = None
    scoring_config: dict | None = None


class StudyOut(BaseModel):
    id: UUID
    name: str
    slug: str
    description: str
    window_start: date
    window_end: date
    is_demo: bool
    scoring_config: dict
    targets: list[TargetOut] = []

    model_config = {"from_attributes": True}


class StudyListItem(BaseModel):
    id: UUID
    name: str
    slug: str
    description: str
    window_start: date
    window_end: date
    is_demo: bool
    target_count: int


class SeriesPoint(BaseModel):
    day: date
    favorability_index: float | None
    pct_negative: float
    volume: int


class Slice(BaseModel):
    key: str
    volume: int
    pct_positive: float
    pct_negative: float
    pct_neutral: float
    favorability_index: float | None


class TargetSummary(BaseModel):
    id: UUID
    name: str
    kind: str
    comparable: bool
    pct_positive: float
    pct_negative: float
    pct_neutral: float
    favorability_index: float | None
    volume: int
    reach: float
    share_of_voice: float
    review_count: int
    series: list[SeriesPoint]
    by_source: list[Slice]
    by_geo: list[Slice]


class Preference(BaseModel):
    left_id: UUID
    left_name: str
    right_id: UUID
    right_name: str
    delta: float
    interval: float
    n: int
    preferred_name: str | None
    reasons: list[str]
    headline: str


class EvidenceMention(BaseModel):
    id: UUID
    text: str
    source: str
    published_at: datetime
    sentiment: str
    stance: str
    weight: float
    url: str | None
    author_handle: str | None
    theme: str | None
    municipality: str | None


class AlertView(BaseModel):
    target_id: UUID
    target_name: str
    rule: str
    message: str
    delta_points: float


class Methodology(BaseModel):
    n: int
    sources: list[str]
    half_life_days: float
    neutral_factor: float
    min_confidence: float
    source_weights: dict[str, float]
    formula: str


class StudySummary(BaseModel):
    study_id: UUID
    name: str
    description: str
    window_start: date
    window_end: date
    disclaimer: str
    known_biases: list[str]
    is_demo: bool
    targets: list[TargetSummary]
    preferences: list[Preference]
    alerts: list[AlertView]
    evidence: list[EvidenceMention]
    methodology: Methodology


class MentionOut(BaseModel):
    id: UUID
    text_original: str
    source_kind: str
    published_at: datetime
    url: str | None
    author_handle: str | None
    sentiment: str | None
    stance: str | None
    theme: str | None
    geo_state: str | None
    geo_municipality: str | None
    is_synthetic: bool
    confidence: float | None
    likes: int = 0
    replies: int = 0
    shares: int = 0
    views: int = 0


class MentionPage(BaseModel):
    items: list[MentionOut]
    total: int


class AskRequest(BaseModel):
    question: str = Field(min_length=3, max_length=500)


class AskResponse(BaseModel):
    mode: str
    answer: str
    evidence: list[EvidenceMention]
    disclaimer: str


class UploadResult(BaseModel):
    created: int
    skipped: int
    review: int


class AlertRecord(BaseModel):
    id: UUID
    target_name: str
    rule: str
    message: str
    delta_points: float
    triggered_at: datetime
    acknowledged_at: datetime | None
