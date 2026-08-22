from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin
if TYPE_CHECKING:
    from app.models.user import User
    from app.models.form_field import FormField


class Form(TimestampMixin, Base):
    __tablename__ = "forms"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    is_public: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    created_by: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
    )

    creator: Mapped["User"] = relationship(
        "User",
        back_populates="forms",
    )

    fields: Mapped[list["FormField"]] = relationship(
        "FormField",
        back_populates="form",
        cascade="all, delete-orphan",
        order_by="FormField.display_order",
    )
    
    responses = relationship(
        "FormResponse",
        back_populates="form",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )