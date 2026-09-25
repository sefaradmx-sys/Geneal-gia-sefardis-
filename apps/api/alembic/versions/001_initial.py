"""esquema inicial

Revision ID: 001_initial
Revises:
Create Date: 2026-09-25
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        DO $$
        BEGIN
            CREATE EXTENSION IF NOT EXISTS vector;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END $$;
        """
    )
    op.create_table(
        "organizations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("slug", sa.String(80), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("email", sa.String(200), nullable=False, unique=True),
        sa.Column("username", sa.String(80), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(300), nullable=False),
        sa.Column("role", sa.String(40), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "studies",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("slug", sa.String(80), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("window_start", sa.Date(), nullable=False),
        sa.Column("window_end", sa.Date(), nullable=False),
        sa.Column("scoring_config", postgresql.JSONB(), nullable=False),
        sa.Column("is_demo", sa.Boolean(), nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("organization_id", "slug"),
    )
    op.create_table(
        "monitoring_targets",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("study_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("studies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("key", sa.String(40), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("kind", sa.String(40), nullable=False),
        sa.Column("comparable", sa.Boolean(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
    )
    op.create_table(
        "aliases",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("target_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("monitoring_targets.id", ondelete="CASCADE"), nullable=False),
        sa.Column("phrase", sa.String(200), nullable=False),
        sa.Column("kind", sa.String(40), nullable=False),
    )
    op.create_table(
        "sources",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("study_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("studies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("kind", sa.String(40), nullable=False),
        sa.Column("status", sa.String(40), nullable=False),
        sa.Column("config", postgresql.JSONB(), nullable=False),
    )
    op.create_table(
        "mentions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("study_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("studies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("source_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("source_kind", sa.String(40), nullable=False),
        sa.Column("external_id", sa.String(120), nullable=False),
        sa.Column("text_original", sa.Text(), nullable=False),
        sa.Column("text_clean", sa.Text(), nullable=False),
        sa.Column("language", sa.String(12), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("collected_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("url", sa.Text(), nullable=True),
        sa.Column("author_handle", sa.String(120), nullable=True),
        sa.Column("author_followers", sa.Integer(), nullable=False),
        sa.Column("likes", sa.Integer(), nullable=False),
        sa.Column("replies", sa.Integer(), nullable=False),
        sa.Column("shares", sa.Integer(), nullable=False),
        sa.Column("views", sa.Integer(), nullable=False),
        sa.Column("geo_state", sa.String(80), nullable=True),
        sa.Column("geo_municipality", sa.String(80), nullable=True),
        sa.Column("theme", sa.String(80), nullable=True),
        sa.Column("raw_payload_id", sa.String(120), nullable=True),
        sa.Column("license_note", sa.Text(), nullable=False),
        sa.Column("normalized_hash", sa.String(64), nullable=False),
        sa.Column("is_synthetic", sa.Boolean(), nullable=False),
        sa.Column("is_bot", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("study_id", "source_kind", "external_id"),
    )
    op.create_index("ix_mentions_normalized_hash", "mentions", ["normalized_hash"])
    op.create_table(
        "mention_targets",
        sa.Column("mention_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("mentions.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("target_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("monitoring_targets.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("relevance", sa.Float(), nullable=False),
    )
    op.create_table(
        "classifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("mention_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("mentions.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("sentiment", sa.String(20), nullable=False),
        sa.Column("stance", sa.String(30), nullable=False),
        sa.Column("emotion", sa.String(40), nullable=False),
        sa.Column("toxicity", sa.Float(), nullable=False),
        sa.Column("irony", sa.Float(), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("model_name", sa.String(80), nullable=False),
        sa.Column("needs_review", sa.Boolean(), nullable=False),
    )
    op.create_table(
        "daily_metrics",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("study_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("studies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("target_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("monitoring_targets.id", ondelete="CASCADE"), nullable=False),
        sa.Column("day", sa.Date(), nullable=False),
        sa.Column("source_kind", sa.String(40), nullable=False),
        sa.Column("w_pos", sa.Float(), nullable=False),
        sa.Column("w_neg", sa.Float(), nullable=False),
        sa.Column("w_neu", sa.Float(), nullable=False),
        sa.Column("pct_positive", sa.Float(), nullable=False),
        sa.Column("pct_negative", sa.Float(), nullable=False),
        sa.Column("pct_neutral", sa.Float(), nullable=False),
        sa.Column("favorability_index", sa.Float(), nullable=True),
        sa.Column("volume", sa.Integer(), nullable=False),
        sa.Column("reach", sa.Float(), nullable=False),
        sa.Column("review_count", sa.Integer(), nullable=False),
        sa.UniqueConstraint("study_id", "target_id", "day", "source_kind"),
    )
    op.create_table(
        "insights",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("study_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("studies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("target_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "alerts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("study_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("studies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("target_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("monitoring_targets.id", ondelete="CASCADE"), nullable=False),
        sa.Column("rule", sa.String(80), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("delta_points", sa.Float(), nullable=False),
        sa.Column("triggered_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("acknowledged_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_table(
        "reports",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("study_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("studies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("format", sa.String(16), nullable=False),
        sa.Column("storage_key", sa.String(300), nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "audit_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("action", sa.String(80), nullable=False),
        sa.Column("resource", sa.String(200), nullable=False),
        sa.Column("detail", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    for name in (
        "audit_logs",
        "reports",
        "alerts",
        "insights",
        "daily_metrics",
        "classifications",
        "mention_targets",
        "mentions",
        "sources",
        "aliases",
        "monitoring_targets",
        "studies",
        "users",
        "organizations",
    ):
        op.drop_table(name)
