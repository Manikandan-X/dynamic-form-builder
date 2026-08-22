from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    AuthUserResponse,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
)
from app.services.auth_service import AuthService


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)

auth_service = AuthService()


@router.post(
    "/register",
    response_model=AuthUserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db),
):
    user = auth_service.register(
        db,
        data,
    )

    return AuthUserResponse(
        id=user.id,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        role=user.role.name,
        is_active=user.is_active,
    )


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    access_token = auth_service.login(
        db,
        data,
    )

    return TokenResponse(
        access_token=access_token,
    )


@router.get(
    "/me",
    response_model=AuthUserResponse,
)
def get_me(
    current_user: User = Depends(get_current_user),
):
    return AuthUserResponse(
        id=current_user.id,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        email=current_user.email,
        role=current_user.role.name,
        is_active=current_user.is_active,
    )