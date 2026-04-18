"""add scorm runtime entities

Revision ID: 20260417_0002
Revises: 20260413_0001
Create Date: 2026-04-17
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "20260417_0002"
down_revision: Union[str, Sequence[str], None] = "20260413_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("scorm_packages", sa.Column("lesson_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column(
        "scorm_packages",
        sa.Column(
            "title",
            sa.String(length=255),
            nullable=False,
            server_default="Untitled SCORM Package",
        ),
    )
    op.add_column(
        "scorm_packages",
        sa.Column("version", sa.String(length=32), nullable=False, server_default="SCORM_1_2"),
    )
    op.add_column(
        "scorm_packages",
        sa.Column("launch_file", sa.String(length=1024), nullable=False, server_default="index.html"),
    )
    op.add_column(
        "scorm_packages",
        sa.Column("extracted_path", sa.String(length=2048), nullable=False, server_default=""),
    )
    op.create_foreign_key(
        "fk_scorm_packages_lesson_id",
        "scorm_packages",
        "lessons",
        ["lesson_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.create_table(
        "scorm_activities",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("package_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("identifier", sa.String(length=255), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("launch_url", sa.String(length=2048), nullable=False),
        sa.ForeignKeyConstraint(["package_id"], ["scorm_packages.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "scorm_registrations",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("package_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="NOT_STARTED"),
        sa.ForeignKeyConstraint(["package_id"], ["scorm_packages.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "scorm_runtime_data",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("registration_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("key", sa.String(length=255), nullable=False),
        sa.Column("value", sa.String(length=4096), nullable=False, server_default=""),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["registration_id"], ["scorm_registrations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("registration_id", "key", name="uq_scorm_runtime_registration_key"),
    )

    op.create_index("ix_scorm_activities_package_id", "scorm_activities", ["package_id"], unique=False)
    op.create_index("ix_scorm_registrations_user_id", "scorm_registrations", ["user_id"], unique=False)
    op.create_index(
        "ix_scorm_registrations_package_id", "scorm_registrations", ["package_id"], unique=False
    )
    op.create_index(
        "ix_scorm_runtime_data_registration_id",
        "scorm_runtime_data",
        ["registration_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_scorm_runtime_data_registration_id", table_name="scorm_runtime_data")
    op.drop_index("ix_scorm_registrations_package_id", table_name="scorm_registrations")
    op.drop_index("ix_scorm_registrations_user_id", table_name="scorm_registrations")
    op.drop_index("ix_scorm_activities_package_id", table_name="scorm_activities")

    op.drop_table("scorm_runtime_data")
    op.drop_table("scorm_registrations")
    op.drop_table("scorm_activities")

    op.drop_constraint("fk_scorm_packages_lesson_id", "scorm_packages", type_="foreignkey")
    op.drop_column("scorm_packages", "extracted_path")
    op.drop_column("scorm_packages", "launch_file")
    op.drop_column("scorm_packages", "version")
    op.drop_column("scorm_packages", "title")
    op.drop_column("scorm_packages", "lesson_id")
