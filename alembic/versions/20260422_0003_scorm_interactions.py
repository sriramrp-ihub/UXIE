"""add scorm interactions table

Revision ID: 20260422_0003
Revises: 20260417_0002
Create Date: 2026-04-22
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "20260422_0003"
down_revision: Union[str, Sequence[str], None] = "20260417_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "scorm_interactions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("registration_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("course_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("interaction_id", sa.String(length=255), nullable=False),
        sa.Column("question_id", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("response", sa.String(length=4096), nullable=True),
        sa.Column("correct_answer", sa.String(length=4096), nullable=True),
        sa.Column("result", sa.String(length=64), nullable=True),
        sa.Column("latency", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["registration_id"], ["scorm_registrations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_scorm_interactions_registration_id",
        "scorm_interactions",
        ["registration_id"],
        unique=False,
    )
    op.create_index(
        "ix_scorm_interactions_course_id",
        "scorm_interactions",
        ["course_id"],
        unique=False,
    )
    op.create_index(
        "ix_scorm_interactions_user_id",
        "scorm_interactions",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "ix_scorm_interactions_question_id",
        "scorm_interactions",
        ["question_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_scorm_interactions_question_id", table_name="scorm_interactions")
    op.drop_index("ix_scorm_interactions_user_id", table_name="scorm_interactions")
    op.drop_index("ix_scorm_interactions_course_id", table_name="scorm_interactions")
    op.drop_index("ix_scorm_interactions_registration_id", table_name="scorm_interactions")
    op.drop_table("scorm_interactions")
