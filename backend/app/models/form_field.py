from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base
from app.models.enums import FormFieldType

if TYPE_CHECKING:
    from app.models.form import Form
    from app.models.field_option import FieldOption


class FormField(Base):
    __tablename__ = "form_fields"

    __table_args__ = (
        UniqueConstraint(
            "form_id",
            "client_key",
            name="uq_form_field_client_key",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    form_id: Mapped[int] = mapped_column(
        ForeignKey("forms.id", ondelete="CASCADE"),
        nullable=False,
    )

    label: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    field_type: Mapped[FormFieldType] = mapped_column(
        String(50),
        nullable=False,
    )

    placeholder: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    help_text: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    is_required: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    display_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    # Validation configuration
    min_length: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    max_length: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    min_value: Mapped[float | None] = mapped_column(
        nullable=True,
    )

    max_value: Mapped[float | None] = mapped_column(
        nullable=True,
    )

    # Conditional visibility
    is_conditional: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    client_key: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    conditional_field_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "form_fields.id",
            ondelete="SET NULL",
        ),
        nullable=True,
    )

    conditional_operator: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    conditional_value: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    form: Mapped["Form"] = relationship(
        "Form",
        back_populates="fields",
    )

    options: Mapped[list["FieldOption"]] = relationship(
        "FieldOption",
        back_populates="field",
        cascade="all, delete-orphan",
        order_by="FieldOption.display_order",
    )

    conditional_field: Mapped["FormField | None"] = relationship(
        "FormField",
        remote_side="FormField.id",
    )
    
    response_details = relationship(
        "ResponseDetail",
        back_populates="field",
    )