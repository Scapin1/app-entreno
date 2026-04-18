from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import time

from app.database import get_db
from app.schemas.session import (
    SessionCreate, SessionUpdate, SessionResponse,
    ExerciseResultCreate, ExerciseResultResponse, SessionWithResults
)
from app.models import WorkoutSession, ExerciseResult, Profile
from app.dependencies import get_current_user
from app.schemas.user import UserResponse

router = APIRouter()


# ===== SESSIONS =====

@router.post("/{profile_id}/sessions", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
def create_session(
    profile_id: int,
    session_data: SessionCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new workout session."""
    # Verify profile belongs to user
    profile = db.query(Profile).filter(
        Profile.id == profile_id,
        Profile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    session = WorkoutSession(
        profile_id=profile_id,
        day_id=session_data.day_id,
        date=session_data.date,
        timestamp=int(time.time()),
        is_completed=0
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/{profile_id}/sessions", response_model=List[SessionResponse])
def list_sessions(
    profile_id: int,
    limit: int = 20,
    offset: int = 0,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List workout sessions for a profile."""
    # Verify profile belongs to user
    profile = db.query(Profile).filter(
        Profile.id == profile_id,
        Profile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    sessions = db.query(WorkoutSession).filter(
        WorkoutSession.profile_id == profile_id
    ).order_by(WorkoutSession.timestamp.desc()).offset(offset).limit(limit).all()
    
    return sessions


@router.get("/{profile_id}/sessions/{session_id}", response_model=SessionWithResults)
def get_session(
    profile_id: int,
    session_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a session with all exercise results."""
    # Verify profile belongs to user
    profile = db.query(Profile).filter(
        Profile.id == profile_id,
        Profile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    session = db.query(WorkoutSession).filter(
        WorkoutSession.id == session_id,
        WorkoutSession.profile_id == profile_id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Get exercise results
    results = db.query(ExerciseResult).filter(
        ExerciseResult.session_id == session_id
    ).order_by(ExerciseResult.timestamp).all()
    
    return SessionWithResults(
        id=session.id,
        profile_id=session.profile_id,
        day_id=session.day_id,
        date=session.date,
        timestamp=session.timestamp,
        total_duration=session.total_duration,
        is_completed=session.is_completed,
        created_at=session.created_at,
        exercise_results=results
    )


@router.put("/{profile_id}/sessions/{session_id}", response_model=SessionResponse)
def update_session(
    profile_id: int,
    session_id: int,
    session_data: SessionUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a workout session (e.g., mark as completed)."""
    # Verify profile belongs to user
    profile = db.query(Profile).filter(
        Profile.id == profile_id,
        Profile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    session = db.query(WorkoutSession).filter(
        WorkoutSession.id == session_id,
        WorkoutSession.profile_id == profile_id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    if session_data.total_duration is not None:
        session.total_duration = session_data.total_duration
    if session_data.is_completed is not None:
        session.is_completed = session_data.is_completed
    
    db.commit()
    db.refresh(session)
    return session


@router.delete("/{profile_id}/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(
    profile_id: int,
    session_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a workout session."""
    # Verify profile belongs to user
    profile = db.query(Profile).filter(
        Profile.id == profile_id,
        Profile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    session = db.query(WorkoutSession).filter(
        WorkoutSession.id == session_id,
        WorkoutSession.profile_id == profile_id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    db.delete(session)
    db.commit()
    return None


# ===== EXERCISE RESULTS =====

@router.post("/{profile_id}/sessions/{session_id}/exercises", response_model=ExerciseResultResponse, status_code=status.HTTP_201_CREATED)
def add_exercise_result(
    profile_id: int,
    session_id: int,
    result_data: ExerciseResultCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add an exercise result to a session."""
    # Verify profile belongs to user
    profile = db.query(Profile).filter(
        Profile.id == profile_id,
        Profile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Verify session belongs to profile
    session = db.query(WorkoutSession).filter(
        WorkoutSession.id == session_id,
        WorkoutSession.profile_id == profile_id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    result = ExerciseResult(
        session_id=session_id,
        exercise_name=result_data.exercise_name,
        set_number=result_data.set_number,
        actual_reps=result_data.actual_reps,
        actual_weight=result_data.actual_weight,
        feeling=result_data.feeling,
        duration=result_data.duration,
        timestamp=int(time.time())
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    return result


@router.get("/{profile_id}/sessions/{session_id}/exercises", response_model=List[ExerciseResultResponse])
def list_exercise_results(
    profile_id: int,
    session_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all exercise results for a session."""
    # Verify profile belongs to user
    profile = db.query(Profile).filter(
        Profile.id == profile_id,
        Profile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Verify session belongs to profile
    session = db.query(WorkoutSession).filter(
        WorkoutSession.id == session_id,
        WorkoutSession.profile_id == profile_id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    results = db.query(ExerciseResult).filter(
        ExerciseResult.session_id == session_id
    ).order_by(ExerciseResult.timestamp).all()
    
    return results