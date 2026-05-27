"""Add created_at to body_weight, add note to exercise_results

Revision ID: 002
Revises: 001
Create Date: 2024-06-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('body_weight', sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True))
    op.add_column('exercise_results', sa.Column('note', sa.String(length=100), nullable=True))


def downgrade() -> None:
    op.drop_column('exercise_results', 'note')
    op.drop_column('body_weight', 'created_at')
