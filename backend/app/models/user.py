from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin


if TYPE_CHECKING:
    from app.models.role import Role
    from app.models.form import Form


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    first_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    last_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    role_id: Mapped[int] = mapped_column(
        ForeignKey("roles.id"),
        nullable=False,
        index=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    role: Mapped["Role"] = relationship(
        "Role",
        back_populates="users",
    )
    
    forms: Mapped[list["Form"]] = relationship(
        "Form",
        back_populates="creator",
    )
    
    form_responses = relationship(
        "FormResponse",
        back_populates="user",
    )
    
    activity_logs = relationship(
        "ActivityLog",
        back_populates="user",
    )