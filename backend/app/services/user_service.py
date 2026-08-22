from sqlalchemy.orm import Session

from app.exceptions.common import (
    AlreadyExistsException,
    NotFoundException,
    ForbiddenException,
)
from app.exceptions.messages import (
    USER_ALREADY_EXISTS,
    USER_NOT_FOUND,
    ROLE_NOT_FOUND,
)
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.repositories.role_repository import RoleRepository
from app.schemas.user import UserCreate, UserUpdate


class UserService:

    def __init__(self) -> None:
        self.repository = UserRepository()
        self.role_repository = RoleRepository()

    def get_user(
        self,
        db: Session,
        user_id: int,
    ) -> User:

        user = self.repository.get_by_id(
            db,
            user_id,
        )

        if user is None:
            raise NotFoundException(
                USER_NOT_FOUND
            )

        return user

    def get_user_by_email(
        self,
        db: Session,
        email: str,
    ) -> User | None:

        return self.repository.get_by_email(
            db,
            email.lower(),
        )

    def get_users(
        self,
        db: Session,
    ) -> list[User]:

        return self.repository.get_all(db)

    def create_user(
        self,
        db: Session,
        data: UserCreate,
        password_hash: str,
        role_id: int,
    ) -> User:

        email = str(data.email).lower()

        existing_user = self.repository.get_by_email(
            db,
            email,
        )

        if existing_user:
            raise AlreadyExistsException(
                USER_ALREADY_EXISTS
            )

        user = User(
            first_name=data.first_name.strip(),
            last_name=data.last_name.strip(),
            email=email,
            password_hash=password_hash,
            role_id=role_id,
            is_active=True,
        )

        return self.repository.create(
            db,
            user,
        )

    def update_user(
        self,
        db: Session,
        user_id: int,
        data: UserUpdate,
        current_admin_id: int,
    ) -> User:

        user = self.get_user(
            db,
            user_id,
        )

        # Prevent admin from locking themselves out
        if user_id == current_admin_id:

            if data.role_id is not None:
                raise ForbiddenException(
                    "You cannot change your own role."
                )

            if data.is_active is False:
                raise ForbiddenException(
                    "You cannot deactivate your own account."
                )

        # Validate email uniqueness
        if data.email is not None:

            email = str(data.email).lower()

            existing_user = self.repository.get_by_email(
                db,
                email,
            )

            if (
                existing_user
                and existing_user.id != user.id
            ):
                raise AlreadyExistsException(
                    USER_ALREADY_EXISTS
                )

            user.email = email

        # Update basic information
        if data.first_name is not None:
            user.first_name = data.first_name.strip()

        if data.last_name is not None:
            user.last_name = data.last_name.strip()

        # Validate role before assigning
        if data.role_id is not None:

            role = self.role_repository.get_by_id(
                db,
                data.role_id,
            )

            if role is None:
                raise NotFoundException(
                    ROLE_NOT_FOUND
                )

            user.role_id = role.id

        # Update account status
        if data.is_active is not None:
            user.is_active = data.is_active

        return self.repository.update(
            db,
            user,
        )

    def update_status(
        self,
        db: Session,
        user_id: int,
        is_active: bool,
    ) -> User:

        user = self.get_user(
            db,
            user_id,
        )

        user.is_active = is_active

        return self.repository.update(
            db,
            user,
        )

    def delete_user(
        self,
        db: Session,
        user_id: int,
        current_admin_id: int,
    ) -> None:

        if user_id == current_admin_id:
            raise ForbiddenException(
                "You cannot delete your own account."
            )

        user = self.get_user(
            db,
            user_id,
        )

        self.repository.delete(
            db,
            user,
        )