from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import time

from app.database import get_db
from app.schemas.recovery import RecoveryCreate, RecoveryUpdate, RecoveryResponse
from app.models import RecoveryState
from app.dependencies import get_current_user
from app.schemas.user import UserResponse

router = APIRouter()


def verify_profile_access(profile_id: int, user_id: int, db: Session):
    """Verify profile belongs to user."""
    from app.models import Profile
    profile = db.query(Profile).filter(
        Profile.id == profile_id,
        Profile.user_id == user_id
    ).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    return profile


@router.get("/{profile_id}/recovery", response_model=RecoveryResponse)
def get_recovery(
    profile_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current recovery state for a profile.
    Creates a new one if it doesn't exist.
    """
    verify_profile_access(profile_id, current_user.id, db)
    
    recovery = db.query(RecoveryState).filter(
        RecoveryState.profile_id == profile_id
    ).first()
    
    if not recovery:
        # Create default recovery state
        recovery = RecoveryState(
            profile_id=profile_id,
            block_index=0,
            exercise_index=0,
            current_set=1,
            is_resting=0,
            rest_seconds=0,
            timestamp=int(time.time())
        )
        db.add(recovery)
        db.commit()
        db.refresh(recovery)
    
    return recovery


@router.post("/{profile_id}/recovery", response_model=RecoveryResponse, status_code=status.HTTP_201_CREATED)
def create_recovery(
    profile_id: int,
    recovery_data: RecoveryCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create or reset recovery state for a profile.
    """
    verify_profile_access(profile_id, current_user.id, db)
    
    # Check if exists and delete
    existing = db.query(RecoveryState).filter(
        RecoveryState.profile_id == profile_id
    ).first()
    
    if existing:
        db.delete(existing)
    
    recovery = RecoveryState(
        profile_id=profile_id,
        block_index=recovery_data.block_index or 0,
        exercise_index=recovery_data.exercise_index or 0,
        current_set=recovery_data.current_set or 1,
        is_resting=recovery_data.is_resting or 0,
        rest_seconds=recovery_data.rest_seconds or 0,
        timestamp=int(time.time())
    )
    db.add(recovery)
    db.commit()
    db.refresh(recovery)
    return recovery


@router.put("/{profile_id}/recovery", response_model=RecoveryResponse)
def update_recovery(
    profile_id: int,
    recovery_data: RecoveryUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update recovery state (e.g., advance to next exercise, start/end rest).
    """
    verify_profile_access(profile_id, current_user.id, db)
    
    recovery = db.query(RecoveryState).filter(
        RecoveryState.profile_id == profile_id
    ).first()
    
    if not recovery:
        # Create if doesn't exist
        recovery = RecoveryState(
            profile_id=profile_id,
            block_index=0,
            exercise_index=0,
            current_set=1,
            is_resting=0,
            rest_seconds=0,
            timestamp=int(time.time())
        )
        db.add(recovery)
    
    # Update fields if provided
    if recovery_data.block_index is not None:
        recovery.block_index = recovery_data.block_index
    if recovery_data.exercise_index is not None:
        recovery.exercise_index = recovery_data.exercise_index
    if recovery_data.current_set is not None:
        recovery.current_set = recovery_data.current_set
    if recovery_data.is_resting is not None:
        recovery.is_resting = recovery_data.is_resting
    if recovery_data.rest_seconds is not None:
        recovery.rest_seconds = recovery_data.rest_seconds
    
    recovery.timestamp = int(time.time())
    
    db.commit()
    db.refresh(recovery)
    return recovery


@router.delete("/{profile_id}/recovery", status_code=status.HTTP_204_NO_CONTENT)
def delete_recovery(
    profile_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Clear recovery state (reset to default).
    """
    verify_profile_access(profile_id, current_user.id, db)
    
    recovery = db.query(RecoveryState).filter(
        RecoveryState.profile_id == profile_id
    ).first()
    
    if recovery:
        db.delete(recovery)
        db.commit()
    
    return None