from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext
from app.exceptions.auth import InvalidTokenException
from app.exceptions.messages import PASSWORD_TOO_LONG

from app.core.config import settings


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


def validate_password_length(password: str) -> None:
    """
    Validate password length for bcrypt compatibility.
    """

    if len(password.encode("utf-8")) > 72:
        raise ValueError(PASSWORD_TOO_LONG)


def hash_password(password: str) -> str:
    """
    Hash a plain-text password using bcrypt.
    """

    validate_password_length(password)

    return pwd_context.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    """
    Verify a plain-text password against its bcrypt hash.
    """

    validate_password_length(plain_password)

    return pwd_context.verify(
        plain_password,
        hashed_password,
    )


def create_access_token(
    user_id: int,
    role_id: int,
) -> str:
    """
    Create a JWT access token.
    """

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )

    payload = {
        "sub": str(user_id),
        "role_id": role_id,
        "type": "access",
        "exp": expire,
    }

    return jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def decode_access_token(token: str) -> dict:
    """
    Decode and validate a JWT access token.
    """

    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )

        if payload.get("type") != "access":
            raise InvalidTokenException()

        return payload

    except JWTError as exc:
        raise InvalidTokenException() from exc