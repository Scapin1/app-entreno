from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import json

from app.database import get_db
from app.schemas.training_day import DayCreate, DayUpdate, DayResponse
from app.models import TrainingDay, Profile
from app.dependencies import get_current_user
from app.schemas.user import UserResponse

router = APIRouter()


def parse_json_field(val):
    """Parse JSON string to list/dict."""
    if val is None:
        return None
    if isinstance(val, (list, dict)):
        return val
    try:
        return json.loads(val)
    except:
        return None


@router.get("/{profile_id}/days/", response_model=List[DayResponse])
def list_training_days(
    profile_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all training days for a specific profile.
    """
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
    
    days = db.query(TrainingDay).filter(
        TrainingDay.profile_id == profile_id,
        TrainingDay.is_active == 1
    ).order_by(TrainingDay.day_number).all()
    
    return days


@router.post("/{profile_id}/days/", response_model=DayResponse, status_code=status.HTTP_201_CREATED)
def create_training_day(
    profile_id: int,
    day_data: DayCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new training day for a profile.
    """
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
    
    # Convert lists to JSON strings
    implements_json = json.dumps(day_data.implements) if day_data.implements else None
    blocks_json = json.dumps(day_data.blocks) if day_data.blocks else None
    
    day = TrainingDay(
        profile_id=profile_id,
        day_number=day_data.day_number,
        title=day_data.title,
        focus=day_data.focus,
        implements=implements_json,
        blocks=blocks_json,
        is_active=1
    )
    db.add(day)
    db.commit()
    db.refresh(day)
    return day


@router.get("/{profile_id}/days/{day_id}", response_model=DayResponse)
def get_training_day(
    profile_id: int,
    day_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific training day.
    """
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
    
    day = db.query(TrainingDay).filter(
        TrainingDay.id == day_id,
        TrainingDay.profile_id == profile_id
    ).first()
    
    if not day:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training day not found"
        )
    
    return day


@router.put("/{profile_id}/days/{day_id}", response_model=DayResponse)
def update_training_day(
    profile_id: int,
    day_id: int,
    day_data: DayUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a training day.
    """
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
    
    day = db.query(TrainingDay).filter(
        TrainingDay.id == day_id,
        TrainingDay.profile_id == profile_id
    ).first()
    
    if not day:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training day not found"
        )
    
    if day_data.title is not None:
        day.title = day_data.title
    if day_data.focus is not None:
        day.focus = day_data.focus
    if day_data.implements is not None:
        day.implements = json.dumps(day_data.implements)
    if day_data.blocks is not None:
        day.blocks = json.dumps(day_data.blocks)
    if day_data.is_active is not None:
        day.is_active = day_data.is_active
    
    db.commit()
    db.refresh(day)
    return day


@router.delete("/{profile_id}/days/{day_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_training_day(
    profile_id: int,
    day_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete (deactivate) a training day.
    """
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
    
    day = db.query(TrainingDay).filter(
        TrainingDay.id == day_id,
        TrainingDay.profile_id == profile_id
    ).first()
    
    if not day:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training day not found"
        )
    
    day.is_active = 0
    db.commit()
    return None