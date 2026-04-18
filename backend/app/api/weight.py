from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import time

from app.database import get_db
from app.schemas.weight import WeightCreate, WeightResponse
from app.models import BodyWeight
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


@router.get("/{profile_id}/weight", response_model=List[WeightResponse])
def list_weights(
    profile_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all weight entries for a specific profile.
    """
    verify_profile_access(profile_id, current_user.id, db)
    
    weights = db.query(BodyWeight).filter(
        BodyWeight.profile_id == profile_id
    ).order_by(BodyWeight.date.desc()).all()
    
    return weights


@router.post("/{profile_id}/weight", response_model=WeightResponse, status_code=status.HTTP_201_CREATED)
def add_weight(
    profile_id: int,
    weight_data: WeightCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add a new weight entry for a specific profile.
    """
    verify_profile_access(profile_id, current_user.id, db)
    
    weight = BodyWeight(
        profile_id=profile_id,
        weight=weight_data.weight,
        date=weight_data.date,
        timestamp=int(time.time())
    )
    db.add(weight)
    db.commit()
    db.refresh(weight)
    return weight


@router.get("/{profile_id}/weight/{weight_id}", response_model=WeightResponse)
def get_weight(
    profile_id: int,
    weight_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific weight entry by ID.
    """
    verify_profile_access(profile_id, current_user.id, db)
    
    weight = db.query(BodyWeight).filter(
        BodyWeight.id == weight_id,
        BodyWeight.profile_id == profile_id
    ).first()
    
    if not weight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Weight entry not found"
        )
    
    return weight


@router.delete("/{profile_id}/weight/{weight_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_weight(
    profile_id: int,
    weight_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a weight entry.
    """
    verify_profile_access(profile_id, current_user.id, db)
    
    weight = db.query(BodyWeight).filter(
        BodyWeight.id == weight_id,
        BodyWeight.profile_id == profile_id
    ).first()
    
    if not weight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Weight entry not found"
        )
    
    db.delete(weight)
    db.commit()
    return None