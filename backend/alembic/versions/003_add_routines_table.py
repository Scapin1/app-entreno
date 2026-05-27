"""Add routines table and routine_id to training_days

Revision ID: 003
Revises: 002
Create Date: 2026-05-27 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create routines table
    op.create_table(
        'routines',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('profile_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False, server_default='Mi rutina'),
        sa.Column('is_active', sa.Integer(), nullable=False, server_default=sa.text('1')),
        sa.Column('is_selected', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['profile_id'], ['profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_routines_id'), 'routines', ['id'], unique=False)

    # Add routine_id to training_days
    op.add_column('training_days', sa.Column('routine_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_training_days_routine_id',
        'training_days', 'routines',
        ['routine_id'], ['id']
    )

    # Backfill: for each profile with active training_days, create a default routine
    conn = op.get_bind()
    profiles = conn.execute(
        sa.text(
            "SELECT DISTINCT td.profile_id "
            "FROM training_days td "
            "WHERE td.is_active = 1 "
            "AND td.routine_id IS NULL"
        )
    ).fetchall()

    for (profile_id,) in profiles:
        result = conn.execute(
            sa.text(
                "INSERT INTO routines (profile_id, name, is_active, is_selected) "
                "VALUES (:pid, 'Mi rutina', 1, 1) "
                "RETURNING id"
            ),
            {"pid": profile_id}
        )
        routine_id = result.scalar()
        conn.execute(
            sa.text(
                "UPDATE training_days SET routine_id = :rid "
                "WHERE profile_id = :pid"
            ),
            {"rid": routine_id, "pid": profile_id}
        )


def downgrade() -> None:
    op.drop_constraint('fk_training_days_routine_id', 'training_days', type_='foreignkey')
    op.drop_column('training_days', 'routine_id')
    op.drop_index(op.f('ix_routines_id'), table_name='routines')
    op.drop_table('routines')
