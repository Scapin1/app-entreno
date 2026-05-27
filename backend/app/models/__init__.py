from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    profiles = relationship("Profile", back_populates="user", cascade="all, delete-orphan")


class Profile(Base):
    __tablename__ = "profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    image = Column(String(500), nullable=True)
    days = Column(String, default="[0,1,2,3,4,5,6]")  # Stored as JSON string: days of week
    is_active = Column(Integer, default=1)  # 1 = active, 0 = inactive
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="profiles")
    training_days = relationship("TrainingDay", back_populates="profile", cascade="all, delete-orphan")
    routines = relationship("Routine", back_populates="profile", cascade="all, delete-orphan")
    sessions = relationship("WorkoutSession", back_populates="profile", cascade="all, delete-orphan")
    body_weights = relationship("BodyWeight", back_populates="profile", cascade="all, delete-orphan")
    recovery_state = relationship("RecoveryState", back_populates="profile", uselist=False, cascade="all, delete-orphan")


class TrainingDay(Base):
    __tablename__ = "training_days"
    
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    routine_id = Column(Integer, ForeignKey("routines.id"), nullable=True)
    day_number = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    focus = Column(String(255), nullable=True)
    implements = Column(String, nullable=True)  # Stored as JSON string
    blocks = Column(String, nullable=True)  # Stored as JSON string
    is_active = Column(Integer, default=1)
    
    # Relationships
    profile = relationship("Profile", back_populates="training_days")
    routine = relationship("Routine", back_populates="training_days")
    sessions = relationship("WorkoutSession", back_populates="training_day")


class Routine(Base):
    __tablename__ = "routines"

    id = Column(Integer, primary_key=True)
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False, default="Mi rutina")
    is_active = Column(Integer, default=1)
    is_selected = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    # Relationships
    profile = relationship("Profile", back_populates="routines")
    training_days = relationship("TrainingDay", back_populates="routine", cascade="all, delete-orphan")


class WorkoutSession(Base):
    __tablename__ = "workout_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    day_id = Column(Integer, ForeignKey("training_days.id", ondelete="SET NULL"), nullable=True)
    date = Column(String(10), nullable=False)  # YYYY-MM-DD
    timestamp = Column(Integer, nullable=False)
    total_duration = Column(Integer, default=0)
    is_completed = Column(Integer, default=0)  # 0 = in progress, 1 = completed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    profile = relationship("Profile", back_populates="sessions")
    training_day = relationship("TrainingDay", back_populates="sessions")
    exercise_results = relationship("ExerciseResult", back_populates="session", cascade="all, delete-orphan")


class ExerciseResult(Base):
    __tablename__ = "exercise_results"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("workout_sessions.id", ondelete="CASCADE"), nullable=False)
    exercise_name = Column(String(255), nullable=False)
    set_number = Column(Integer, nullable=False)
    actual_reps = Column(Integer, nullable=True)
    actual_weight = Column(String(20), nullable=True)  # Stored as string to handle decimals
    feeling = Column(String(20), nullable=True)  # easy, good, hard, failed
    duration = Column(Integer, nullable=True)  # seconds
    timestamp = Column(Integer, nullable=False)
    note = Column(String(100), nullable=True)
    
    # Relationships
    session = relationship("WorkoutSession", back_populates="exercise_results")


class BodyWeight(Base):
    __tablename__ = "body_weight"
    
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    weight = Column(String(20), nullable=False)  # Stored as string to handle decimals
    date = Column(String(10), nullable=False)  # YYYY-MM-DD
    timestamp = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    profile = relationship("Profile", back_populates="body_weights")


class RecoveryState(Base):
    __tablename__ = "recovery_state"
    
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, unique=True)
    block_index = Column(Integer, default=0)
    exercise_index = Column(Integer, default=0)
    current_set = Column(Integer, default=1)
    is_resting = Column(Integer, default=0)
    rest_seconds = Column(Integer, default=0)
    timestamp = Column(Integer, nullable=False)
    
    # Relationships
    profile = relationship("Profile", back_populates="recovery_state")
