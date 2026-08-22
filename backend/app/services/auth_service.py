from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories.role_repository import RoleRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest

from app.exceptions.auth import (
    InactiveUserException,
    InvalidCredentialsException,
)

from app.exceptions.common import (
    AlreadyExistsException,
)

from app.exceptions.messages import (
    DEFAULT_USER_ROLE_NOT_CONFIGURED,
    USER_ALREADY_EXISTS,
)

class AuthService:

    def __init__(self) -> None:
        self.user_repository = UserRepository()
        self.role_repository = RoleRepository()

    def register(
        self,
        db: Session,
        data: RegisterRequest,
    ) -> User:

        existing_user = self.user_repository.get_by_email(
            db,
            str(data.email).lower(),
        )

        if existing_user:
            raise AlreadyExistsException(
                USER_ALREADY_EXISTS
            )

        user_role = self.role_repository.get_by_name(
            db,
            "USER",
        )

        if user_role is None:
            raise RuntimeError(
                DEFAULT_USER_ROLE_NOT_CONFIGURED
            )

        password_hash = hash_password(data.password)

        user = User(
            first_name=data.first_name.strip(),
            last_name=data.last_name.strip(),
            email=str(data.email).lower(),
            password_hash=password_hash,
            role_id=user_role.id,
            is_active=True,
        )

        return self.user_repository.create(
            db,
            user,
        )

    def login(
        self,
        db: Session,
        data: LoginRequest,
    ) -> str:

        user = self.user_repository.get_by_email(
            db,
            str(data.email).lower(),
        )

        if user is None:
             raise InvalidCredentialsException()

        if not verify_password(
            data.password,
            user.password_hash,
        ):
            raise InvalidCredentialsException()

        if not user.is_active:
            raise InactiveUserException()

        return create_access_token(
            user_id=user.id,
            role_id=user.role_id,
        )