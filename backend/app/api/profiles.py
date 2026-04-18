from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import json

from app.database import get_db
from app.schemas.profile import ProfileCreate, ProfileUpdate, ProfileResponse, parse_days
from app.models import Profile
from app.dependencies import get_current_user
from app.schemas.user import UserResponse
from app.constants.profile_avatars import PROFILE_AVATAR_PRESETS

router = APIRouter()


@router.get("/", response_model=List[ProfileResponse])
def list_profiles(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all profiles for the current user.
    """
    profiles = db.query(Profile).filter(Profile.user_id == current_user.id).all()

    for profile in profiles:
        profile.email = current_user.email

    return profiles


@router.post("/", response_model=ProfileResponse, status_code=status.HTTP_201_CREATED)
def create_profile(
    profile_data: ProfileCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new profile for the current user.
    """
    # Convert days list to JSON string
    days_json = json.dumps(profile_data.days) if profile_data.days else "[0,1,2,3,4,5,6]"
    
    profile = Profile(
        user_id=current_user.id,
        name=profile_data.name,
        image=profile_data.image or PROFILE_AVATAR_PRESETS[0],
        days=days_json
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    profile.email = current_user.email
    return profile


@router.get("/avatars", response_model=List[str])
def list_profile_avatars(
    current_user: UserResponse = Depends(get_current_user),
):
    """
    List allowed profile avatar URLs.
    """
    return PROFILE_AVATAR_PRESETS


@router.get("/{profile_id}", response_model=ProfileResponse)
def get_profile(
    profile_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific profile by ID.
    """
    profile = db.query(Profile).filter(
        Profile.id == profile_id,
        Profile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )

    profile.email = current_user.email
    return profile


@router.put("/{profile_id}", response_model=ProfileResponse)
def update_profile(
    profile_id: int,
    profile_data: ProfileUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a profile.
    """
    profile = db.query(Profile).filter(
        Profile.id == profile_id,
        Profile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    if profile_data.name is not None:
        profile.name = profile_data.name
    if profile_data.image is not None:
        profile.image = profile_data.image
    if profile_data.days is not None:
        profile.days = json.dumps(profile_data.days)
    
    db.commit()
    db.refresh(profile)
    profile.email = current_user.email
    return profile


@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_profile(
    profile_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a profile.
    """
    profile = db.query(Profile).filter(
        Profile.id == profile_id,
        Profile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    db.delete(profile)
    db.commit()
    return None
