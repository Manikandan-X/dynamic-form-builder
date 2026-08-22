from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import require_admin
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import (
    UserManagementResponse,
    UserUpdate,
)
from app.services.user_service import UserService


router = APIRouter(
    prefix="/users",
    tags=["User Management"],
)

user_service = UserService()


@router.get(
    "",
    response_model=list[UserManagementResponse],
)
def get_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    users = user_service.get_users(
        db,
    )

    return [
        UserManagementResponse(
            id=user.id,
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            role_id=user.role_id,
            role=user.role.name,
            is_active=user.is_active,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )
        for user in users
    ]


@router.get(
    "/{user_id}",
    response_model=UserManagementResponse,
)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):

    user = user_service.get_user(
        db,
        user_id,
    )

    return UserManagementResponse(
        id=user.id,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        role_id=user.role_id,
        role=user.role.name,
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


@router.put(
    "/{user_id}",
    response_model=UserManagementResponse,
)
def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    user = user_service.update_user(
        db,
        user_id,
        data,
        current_admin.id,
    )

    return UserManagementResponse(
        id=user.id,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        role_id=user.role_id,
        role=user.role.name,
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


@router.patch(
    "/{user_id}/status",
    response_model=UserManagementResponse,
)
def update_user_status(
    user_id: int,
    is_active: bool,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):

    user = user_service.update_status(
        db,
        user_id,
        is_active,
    )

    return UserManagementResponse(
        id=user.id,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        role_id=user.role_id,
        role=user.role.name,
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    user_service.delete_user(
        db,
        user_id,
        current_admin.id,
    )

    return None