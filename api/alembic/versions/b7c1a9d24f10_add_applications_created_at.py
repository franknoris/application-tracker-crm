"""add applications.created_at

Revision ID: b7c1a9d24f10
Revises: e0b2e750729e
Create Date: 2026-10-14 18:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b7c1a9d24f10"
down_revision: Union[str, Sequence[str], None] = "e0b2e750729e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table("applications") as batch:
        batch.add_column(
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                nullable=False,
                server_default=sa.text("CURRENT_TIMESTAMP"),
            )
        )
    op.create_index(op.f("ix_applications_created_at"), "applications", ["created_at"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_applications_created_at"), table_name="applications")
    with op.batch_alter_table("applications") as batch:
        batch.drop_column("created_at")
