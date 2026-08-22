from datetime import datetime

from pydantic import BaseModel, Field


# =========================================================
# DASHBOARD SUMMARY
# =========================================================


class DashboardSummaryResponse(BaseModel):
    total_forms: int
    total_responses: int


# =========================================================
# RESPONSE ANALYTICS
# =========================================================


class DashboardResponseAnalytics(BaseModel):
    responses_today: int
    responses_this_week: int
    responses_this_month: int


# =========================================================
# MOST FREQUENTLY USED FORMS
# =========================================================


class FrequentlyUsedForm(BaseModel):
    form_id: int
    form_title: str
    response_count: int


class FrequentlyUsedFormsResponse(BaseModel):
    forms: list[FrequentlyUsedForm] = Field(
        default_factory=list
    )


# =========================================================
# SUBMISSION TRENDS
# =========================================================


class SubmissionTrendItem(BaseModel):
    date: str
    count: int


class SubmissionTrendsResponse(BaseModel):
    from_date: datetime | None = None
    to_date: datetime | None = None

    data: list[SubmissionTrendItem] = Field(
        default_factory=list
    )


# =========================================================
# COMPLETE DASHBOARD RESPONSE
# =========================================================


class DashboardResponse(BaseModel):
    total_forms: int
    total_responses: int

    response_analytics: DashboardResponseAnalytics

    most_frequently_used_forms: list[
        FrequentlyUsedForm
    ] = Field(
        default_factory=list
    )

    submission_trends: list[
        SubmissionTrendItem
    ] = Field(
        default_factory=list
    )