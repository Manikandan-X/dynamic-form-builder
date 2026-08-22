from sqlalchemy.orm import Session

from app.exceptions.common import (
    AlreadyExistsException,
    NotFoundException,
)
from app.exceptions.messages import (
    ROLE_ALREADY_EXISTS,
    ROLE_NOT_FOUND,
)
from app.models.role import Role
from app.repositories.role_repository import RoleRepository
from app.schemas.role import RoleCreate, RoleUpdate


class RoleService:

    def __init__(self) -> None:
        self.repository = RoleRepository()

    def get_role(
        self,
        db: Session,
        role_id: int,
    ) -> Role:

        role = self.repository.get_by_id(
            db,
            role_id,
        )

        if role is None:
            raise NotFoundException(
                ROLE_NOT_FOUND
            )

        return role

    def get_role_by_name(
        self,
        db: Session,
        name: str,
    ) -> Role | None:

        return self.repository.get_by_name(
            db,
            name.strip().upper(),
        )

    def get_roles(
        self,
        db: Session,
    ) -> list[Role]:

        return self.repository.get_all(db)

    def create_role(
        self,
        db: Session,
        data: RoleCreate,
    ) -> Role:

        role_name = data.name.strip().upper()

        existing_role = self.repository.get_by_name(
            db,
            role_name,
        )

        if existing_role:
            raise AlreadyExistsException(
                ROLE_ALREADY_EXISTS
            )

        role = Role(
            name=role_name,
        )

        return self.repository.create(
            db,
            role,
        )

    def update_role(
        self,
        db: Session,
        role_id: int,
        data: RoleUpdate,
    ) -> Role:

        role = self.get_role(
            db,
            role_id,
        )

        role_name = data.name.strip().upper()

        existing_role = self.repository.get_by_name(
            db,
            role_name,
        )

        if existing_role and existing_role.id != role.id:
            raise AlreadyExistsException(
                ROLE_ALREADY_EXISTS
            )

        role.name = role_name

        return self.repository.update(
            db,
            role,
        )

    def delete_role(
        self,
        db: Session,
        role_id: int,
    ) -> None:

        role = self.get_role(
            db,
            role_id,
        )

        self.repository.delete(
            db,
            role,
        )