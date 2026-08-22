from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import FormFieldType, ConditionalOperator


# ============================================================
# FIELD OPTION SCHEMAS
# ============================================================

class FieldOptionBase(BaseModel):
    label: str = Field(
        ...,
        min_length=1,
        max_length=255,
    )

    value: str = Field(
        ...,
        min_length=1,
        max_length=255,
    )

    display_order: int = Field(
        ...,
        ge=1,
    )


class FieldOptionCreate(FieldOptionBase):
    pass


class FieldOptionUpdate(BaseModel):
    label: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )

    value: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )

    display_order: int | None = Field(
        default=None,
        ge=1,
    )


class FieldOptionResponse(FieldOptionBase):
    id: int

    model_config = ConfigDict(
        from_attributes=True,
    )


# ============================================================
# FORM FIELD SCHEMAS
# ============================================================

class FormFieldBase(BaseModel):
    client_key: str = Field(
        ...,
        min_length=1,
        max_length=100,
        pattern=r"^[a-zA-Z][a-zA-Z0-9_]*$",
    )

    label: str = Field(
        ...,
        min_length=1,
        max_length=255,
    )

    field_type: FormFieldType

    placeholder: str | None = Field(
        default=None,
        max_length=255,
    )

    help_text: str | None = None

    is_required: bool = False

    display_order: int = Field(
        ...,
        ge=1,
    )

    min_length: int | None = Field(
        default=None,
        ge=0,
    )

    max_length: int | None = Field(
        default=None,
        ge=0,
    )

    min_value: float | None = None

    max_value: float | None = None

    is_conditional: bool = False

    conditional_field_key: str | None = Field(
        default=None,
        max_length=100,
    )

    conditional_operator: ConditionalOperator | None = None

    conditional_value: str | None = Field(
        default=None,
        max_length=255,
    )


class FormFieldCreate(FormFieldBase):
    options: list[FieldOptionCreate] = Field(
        default_factory=list,
    )


class FormFieldUpdate(BaseModel):
    label: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )

    field_type: FormFieldType | None = None

    placeholder: str | None = Field(
        default=None,
        max_length=255,
    )

    help_text: str | None = None

    is_required: bool | None = None

    display_order: int | None = Field(
        default=None,
        ge=1,
    )

    min_length: int | None = Field(
        default=None,
        ge=0,
    )

    max_length: int | None = Field(
        default=None,
        ge=0,
    )

    min_value: float | None = None

    max_value: float | None = None

    is_conditional: bool | None = None

    conditional_field_key: str | None = Field(
        default=None,
        max_length=100,
    )

    conditional_operator: ConditionalOperator | None = None

    conditional_value: str | None = Field(
        default=None,
        max_length=255,
    )


class FormFieldResponse(FormFieldBase):
    id: int
    options: list[FieldOptionResponse] = Field(
        default_factory=list,
    )

    model_config = ConfigDict(
        from_attributes=True,
    )


# ============================================================
# FORM SCHEMAS
# ============================================================

class FormBase(BaseModel):
    title: str = Field(
        ...,
        min_length=1,
        max_length=255,
    )

    description: str | None = None

    is_active: bool = True

    is_public: bool = False


class FormCreate(FormBase):
    fields: list[FormFieldCreate] = Field(
        default_factory=list,
    )


class FormUpdate(BaseModel):
    title: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )

    description: str | None = None

    is_active: bool | None = None

    is_public: bool | None = None


class FormResponse(FormBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: datetime
    fields: list[FormFieldResponse] = Field(
        default_factory=list,
    )

    model_config = ConfigDict(
        from_attributes=True,
    )


class FormListResponse(FormBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )