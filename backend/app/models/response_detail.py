from sqlalchemy import ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class ResponseDetail(Base):
    __tablename__ = "response_details"

    __table_args__ = (
        UniqueConstraint(
            "response_id",
            "field_id",
            name="uq_response_field",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    response_id: Mapped[int] = mapped_column(
        ForeignKey(
            "form_responses.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    field_id: Mapped[int] = mapped_column(
        ForeignKey(
            "form_fields.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    value: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # =========================================================
    # RELATIONSHIPS
    # =========================================================

    response = relationship(
        "FormResponse",
        back_populates="details",
    )

    field = relationship(
        "FormField",
        back_populates="response_details",
    )