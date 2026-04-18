from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.dependencies import get_current_user
from app.schemas.user import UserResponse
from app.services import analytics_service

router = APIRouter()


@router.get("/{profile_id}/analytics/stats")
def get_workout_stats(
    profile_id: int,
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get workout statistics for a profile.
    """
    from app.models import Profile
    
    profile = db.query(Profile).filter(
        Profile.id == profile_id,
        Profile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    return analytics_service.get_workout_stats(db, profile_id, start_date, end_date)


@router.get("/{profile_id}/analytics/frequency")
def get_exercise_frequency(
    profile_id: int,
    limit: int = Query(10, ge=1, le=50),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get most frequently performed exercises.
    """
    from app.models import Profile
    
    profile = db.query(Profile).filter(
        Profile.id == profile_id,
        Profile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    return analytics_service.get_exercise_frequency(db, profile_id, limit)


@router.get("/{profile_id}/analytics/weekly")
def get_weekly_workouts(
    profile_id: int,
    weeks: int = Query(4, ge=1, le=52),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get workout count per week for the last N weeks.
    """
    from app.models import Profile
    
    profile = db.query(Profile).filter(
        Profile.id == profile_id,
        Profile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    return analytics_service.get_weekly_workouts(db, profile_id, weeks)


@router.get("/{profile_id}/analytics/weight")
def get_body_weight_progress(
    profile_id: int,
    limit: int = Query(30, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get body weight history.
    """
    from app.models import Profile
    
    profile = db.query(Profile).filter(
        Profile.id == profile_id,
        Profile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    return analytics_service.get_body_weight_progress(db, profile_id, limit)


@router.get("/{profile_id}/analytics/calendar")
def get_workout_calendar(
    profile_id: int,
    month: int = Query(None, ge=1, le=12),
    year: int = Query(None, ge=2020, le=2030),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get workout days for a specific month.
    """
    from app.models import Profile
    
    profile = db.query(Profile).filter(
        Profile.id == profile_id,
        Profile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    return analytics_service.get_workout_calendar(db, profile_id, month, year)


@router.get("/{profile_id}/analytics/summary")
def get_progression_summary(
    profile_id: int,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get overall progression summary.
    """
    from app.models import Profile
    
    profile = db.query(Profile).filter(
        Profile.id == profile_id,
        Profile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    return analytics_service.get_progression_summary(db, profile_id)


@router.get("/{profile_id}/analytics/adherence")
def get_adherence_heatmap(
    profile_id: int,
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get daily adherence data for GitHub-style heatmap.
    """
    from app.models import Profile

    profile = db.query(Profile).filter(
        Profile.id == profile_id,
        Profile.user_id == current_user.id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )

    return analytics_service.get_adherence_heatmap(db, profile_id, start_date, end_date)


@router.post("/{profile_id}/analytics/seed-demo")
def seed_demo_analytics(
    profile_id: int,
    months: int = Query(12, ge=1, le=12),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Seed demo analytics data (sessions, results, weights) for UI validation.
    """
    from app.models import Profile

    profile = db.query(Profile).filter(
        Profile.id == profile_id,
        Profile.user_id == current_user.id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )

    return analytics_service.seed_demo_analytics_data(db, profile_id, months)


@router.get("/{profile_id}/analytics/exercise-progress")
def get_exercise_actual_progress(
    profile_id: int,
    exercise_name: str = Query(..., min_length=2),
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
    limit: int = Query(180, ge=10, le=500),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get real exercise progression (actual reps/weight) from logged set results.
    """
    from app.models import Profile

    profile = db.query(Profile).filter(
        Profile.id == profile_id,
        Profile.user_id == current_user.id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )

    return analytics_service.get_exercise_actual_progress(
        db,
        profile_id,
        exercise_name,
        start_date,
        end_date,
        limit,
    )
