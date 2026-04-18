"""Initial migration - create all tables

Revision ID: 001
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)

    # Profiles table
    op.create_table(
        'profiles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('is_active', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_profiles_id'), 'profiles', ['id'], unique=False)

    # Training days table
    op.create_table(
        'training_days',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('profile_id', sa.Integer(), nullable=False),
        sa.Column('day_number', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('focus', sa.String(length=255), nullable=True),
        sa.Column('implements', sa.String(), nullable=True),
        sa.Column('blocks', sa.String(), nullable=True),
        sa.Column('is_active', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['profile_id'], ['profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_training_days_id'), 'training_days', ['id'], unique=False)

    # Workout sessions table
    op.create_table(
        'workout_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('profile_id', sa.Integer(), nullable=False),
        sa.Column('day_id', sa.Integer(), nullable=True),
        sa.Column('date', sa.String(length=10), nullable=False),
        sa.Column('timestamp', sa.Integer(), nullable=False),
        sa.Column('total_duration', sa.Integer(), nullable=True),
        sa.Column('is_completed', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['profile_id'], ['profiles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['day_id'], ['training_days.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_workout_sessions_id'), 'workout_sessions', ['id'], unique=False)

    # Exercise results table
    op.create_table(
        'exercise_results',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.Integer(), nullable=False),
        sa.Column('exercise_name', sa.String(length=255), nullable=False),
        sa.Column('set_number', sa.Integer(), nullable=False),
        sa.Column('actual_reps', sa.Integer(), nullable=True),
        sa.Column('actual_weight', sa.String(length=20), nullable=True),
        sa.Column('feeling', sa.String(length=20), nullable=True),
        sa.Column('duration', sa.Integer(), nullable=True),
        sa.Column('timestamp', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['session_id'], ['workout_sessions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_exercise_results_id'), 'exercise_results', ['id'], unique=False)

    # Body weight table
    op.create_table(
        'body_weight',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('profile_id', sa.Integer(), nullable=False),
        sa.Column('weight', sa.String(length=20), nullable=False),
        sa.Column('date', sa.String(length=10), nullable=False),
        sa.Column('timestamp', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['profile_id'], ['profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_body_weight_id'), 'body_weight', ['id'], unique=False)

    # Recovery state table
    op.create_table(
        'recovery_state',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('profile_id', sa.Integer(), nullable=False),
        sa.Column('block_index', sa.Integer(), nullable=True),
        sa.Column('exercise_index', sa.Integer(), nullable=True),
        sa.Column('current_set', sa.Integer(), nullable=True),
        sa.Column('is_resting', sa.Integer(), nullable=True),
        sa.Column('rest_seconds', sa.Integer(), nullable=True),
        sa.Column('timestamp', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['profile_id'], ['profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('profile_id')
    )
    op.create_index(op.f('ix_recovery_state_id'), 'recovery_state', ['id'], unique=False)


def downgrade() -> None:
    op.drop_table('recovery_state')
    op.drop_table('body_weight')
    op.drop_table('exercise_results')
    op.drop_table('workout_sessions')
    op.drop_table('training_days')
    op.drop_table('profiles')
    op.drop_table('users')