from datetime import datetime

from pydantic import BaseModel, Field


# =========================================================
# REPORT FILTERS
# =========================================================


class ReportFilter(BaseModel):
    form_id: int | None = None
    user_id: int | None = None
    from_date: datetime | None = None
    to_date: datetime | None = None


# =========================================================
# RESPONSE STATISTICS
# =========================================================


class ResponseStatisticsResponse(BaseModel):
    total_responses: int
    responses_today: int
    responses_this_week: int
    responses_this_month: int


# =========================================================
# FORM RESPONSE STATISTICS
# =========================================================


class FormResponseStatistics(BaseModel):
    form_id: int
    form_title: str
    total_responses: int


# =========================================================
# FORM-WISE ANALYTICS
# =========================================================


class FieldOptionAnalytics(BaseModel):
    option: str
    count: int


class FieldAnalytics(BaseModel):
    field_id: int
    field_label: str
    field_type: str
    total_responses: int
    options: list[FieldOptionAnalytics] = Field(
        default_factory=list
    )


class FormAnalyticsResponse(BaseModel):
    form_id: int
    form_title: str
    total_responses: int
    fields: list[FieldAnalytics] = Field(
        default_factory=list
    )


# =========================================================
# RESPONSE TREND
# =========================================================


class ResponseTrendItem(BaseModel):
    date: str
    count: int


class ResponseTrendResponse(BaseModel):
    form_id: int | None = None
    from_date: datetime | None = None
    to_date: datetime | None = None
    data: list[ResponseTrendItem] = Field(
        default_factory=list
    )


# =========================================================
# EXPORT FILTER
# =========================================================


class ExportFilter(BaseModel):
    form_id: int | None = None
    user_id: int | None = None
    from_date: datetime | None = None
    to_date: datetime | None = None