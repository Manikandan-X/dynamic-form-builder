from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    first_name: str = Field(
        ...,
        min_length=1,
        max_length=100,
    )

    last_name: str = Field(
        ...,
        min_length=1,
        max_length=100,
    )

    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
    )

    role_id: int | None = None


class UserUpdate(BaseModel):
    first_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    last_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    email: EmailStr | None = None

    role_id: int | None = None

    is_active: bool | None = None


class UserResponse(UserBase):
    id: int
    role_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class UserManagementResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: EmailStr
    role_id: int
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )