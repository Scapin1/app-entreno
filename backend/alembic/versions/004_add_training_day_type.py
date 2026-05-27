"""Add type column to training_days

Revision ID: 004
Revises: 003
Create Date: 2026-05-27 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('training_days', sa.Column('type', sa.String(length=50), nullable=True))


def downgrade() -> None:
    op.drop_column('training_days', 'type')
