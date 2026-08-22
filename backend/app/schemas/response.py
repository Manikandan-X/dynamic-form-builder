from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


# =========================================================
# RESPONSE SUBMISSION
# =========================================================


class ResponseValue(BaseModel):
    """
    Represents one field value submitted by the user.
    """

    field_id: int = Field(
        gt=0,
    )

    value: Any = None


class FormResponseCreate(BaseModel):
    """
    Request schema for submitting a form response.
    """

    values: list[ResponseValue] = Field(
        min_length=1,
    )
    
class FormResponseUpdate(BaseModel):
    """
    Request schema for updating an existing response.
    """

    values: list[ResponseValue] = Field(
        min_length=1,
    )


# =========================================================
# RESPONSE DETAIL
# =========================================================


class ResponseDetailResponse(BaseModel):
    id: int
    response_id: int
    field_id: int
    value: str | None

    model_config = ConfigDict(
        from_attributes=True,
    )


# =========================================================
# FORM RESPONSE RESPONSE
# =========================================================


class FormResponseResponse(BaseModel):
    id: int
    form_id: int
    user_id: int | None
    submitted_at: datetime
    updated_at: datetime

    details: list[ResponseDetailResponse] = Field(
        default_factory=list
    )

    model_config = ConfigDict(
        from_attributes=True,
    )
    
# =========================================================
# RESPONSE SEARCH & FILTER
# =========================================================

class ResponseSearchParams(BaseModel):
    search: str | None = Field(
        default=None,
        min_length=1,
    )

    form_id: int | None = None

    user_id: int | None = None

    from_date: datetime | None = None

    to_date: datetime | None = None