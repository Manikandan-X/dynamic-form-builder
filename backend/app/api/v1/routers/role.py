from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import require_admin
from app.db.session import get_db
from app.models.user import User
from app.schemas.role import (
    RoleCreate,
    RoleResponse,
    RoleUpdate,
)
from app.services.role_service import RoleService


router = APIRouter(
    prefix="/roles",
    tags=["Role Management"],
)

role_service = RoleService()


@router.get(
    "",
    response_model=list[RoleResponse],
)
def get_roles(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return role_service.get_roles(db)


@router.get(
    "/{role_id}",
    response_model=RoleResponse,
)
def get_role(
    role_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return role_service.get_role(
        db,
        role_id,
    )


@router.post(
    "",
    response_model=RoleResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_role(
    data: RoleCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return role_service.create_role(
        db,
        data,
    )


@router.put(
    "/{role_id}",
    response_model=RoleResponse,
)
def update_role(
    role_id: int,
    data: RoleUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return role_service.update_role(
        db,
        role_id,
        data,
    )


@router.delete(
    "/{role_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_role(
    role_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    role_service.delete_role(
        db,
        role_id,
    )

    return None