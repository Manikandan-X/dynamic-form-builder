from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base

if TYPE_CHECKING:
    from app.models.form_field import FormField


class FieldOption(Base):
    __tablename__ = "field_options"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    field_id: Mapped[int] = mapped_column(
        ForeignKey(
            "form_fields.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    label: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    value: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    display_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    field: Mapped["FormField"] = relationship(
        "FormField",
        back_populates="options",
    )