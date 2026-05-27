from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload
from typing import List

from app.database import get_db
from app.schemas.routine import RoutineCreate, RoutineUpdate, RoutineResponse
from app.models import Routine, Profile, TrainingDay
from app.dependencies import get_current_user
from app.schemas.user import UserResponse

router = APIRouter()


def _get_profile_or_404(profile_id: int, current_user: UserResponse, db: Session) -> Profile:
    """Verify profile ownership and return profile or 404."""
    profile = db.query(Profile).filter(
        Profile.id == profile_id,
        Profile.user_id == current_user.id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    return profile


def _get_routine_or_404(routine_id: int, profile_id: int, db: Session) -> Routine:
    """Fetch routine by id and profile_id, or 404."""
    routine = db.query(Routine).filter(
        Routine.id == routine_id,
        Routine.profile_id == profile_id
    ).first()

    if not routine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Routine not found"
        )
    return routine


@router.get("/{profile_id}/routines/", response_model=List[RoutineResponse])
def list_routines(
    profile_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all active routines for a profile, ordered by creation date desc.
    """
    _get_profile_or_404(profile_id, current_user, db)

    routines = db.query(Routine).filter(
        Routine.profile_id == profile_id,
        Routine.is_active == 1
    ).order_by(Routine.created_at.desc()).all()

    return routines


@router.post("/{profile_id}/routines/", response_model=RoutineResponse, status_code=status.HTTP_201_CREATED)
def create_routine(
    profile_id: int,
    routine_data: RoutineCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new routine for a profile.
    New routines start as inactive (not selected) by default.
    """
    _get_profile_or_404(profile_id, current_user, db)

    routine = Routine(
        profile_id=profile_id,
        name=routine_data.name,
        is_active=1,
        is_selected=0
    )
    db.add(routine)
    db.commit()
    db.refresh(routine)
    return routine


@router.get("/{profile_id}/routines/{routine_id}", response_model=RoutineResponse)
def get_routine(
    profile_id: int,
    routine_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific routine with its training days.
    """
    _get_profile_or_404(profile_id, current_user, db)

    routine = db.query(Routine).options(
        selectinload(Routine.training_days)
    ).filter(
        Routine.id == routine_id,
        Routine.profile_id == profile_id,
        Routine.is_active == 1
    ).first()

    if not routine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Routine not found"
        )

    return routine


@router.put("/{profile_id}/routines/{routine_id}", response_model=RoutineResponse)
def update_routine(
    profile_id: int,
    routine_id: int,
    routine_data: RoutineUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a routine's name.
    """
    _get_profile_or_404(profile_id, current_user, db)
    routine = _get_routine_or_404(routine_id, profile_id, db)

    if routine_data.name is not None:
        routine.name = routine_data.name

    db.commit()
    db.refresh(routine)
    return routine


@router.delete("/{profile_id}/routines/{routine_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_routine(
    profile_id: int,
    routine_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Soft-delete a routine (is_active=0).

    Prevents deletion if this is the only active routine for the profile,
    to avoid leaving the profile without any routine.
    """
    _get_profile_or_404(profile_id, current_user, db)
    routine = _get_routine_or_404(routine_id, profile_id, db)

    # Guard: cannot delete the last active routine
    active_count = db.query(Routine).filter(
        Routine.profile_id == profile_id,
        Routine.is_active == 1
    ).count()

    if active_count <= 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete the last active routine. Create another routine first."
        )

    routine.is_active = 0
    routine.is_selected = 0

    # Soft-delete all training days associated with this routine
    db.query(TrainingDay).filter(
        TrainingDay.routine_id == routine_id,
        TrainingDay.is_active == 1
    ).update({"is_active": 0})

    db.commit()
    return None


@router.post("/{profile_id}/routines/{routine_id}/select", response_model=RoutineResponse)
def select_routine(
    profile_id: int,
    routine_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Select a routine as the active one for the profile.
    Deselects (is_selected=0) all other routines first.
    """
    _get_profile_or_404(profile_id, current_user, db)
    routine = _get_routine_or_404(routine_id, profile_id, db)

    if routine.is_active != 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot select an inactive routine"
        )

    # Deselect all routines for this profile
    db.query(Routine).filter(
        Routine.profile_id == profile_id,
        Routine.is_selected == 1
    ).update({"is_selected": 0})

    # Select the target routine
    routine.is_selected = 1
    db.commit()
    db.refresh(routine)
    return routine
