from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.user import UserCreate, UserResponse, Token, UserLogin, UserUpdate
from app.services import auth_service
from app.dependencies import get_current_user
from app.models import User

router = APIRouter()


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user.
    
    Returns access token and user data.
    """
    user = auth_service.register_user(db, user_data)
    return auth_service.create_token_response(user)


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Login with email and password.
    
    Returns access token and user data.
    """
    user = auth_service.authenticate_user(db, credentials.email, credentials.password)
    return auth_service.create_token_response(user)


@router.put("/me", response_model=UserResponse)
def update_me(
    updates: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update current authenticated user.
    """
    if updates.email is not None:
        existing = db.query(User).filter(User.email == updates.email, User.id != current_user.id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        current_user.email = updates.email

    db.commit()
    db.refresh(current_user)
    return current_user
