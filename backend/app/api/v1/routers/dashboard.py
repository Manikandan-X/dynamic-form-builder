from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.dashboard import (
    DashboardResponse,
    DashboardSummaryResponse,
    DashboardResponseAnalytics,
    FrequentlyUsedFormsResponse,
    SubmissionTrendsResponse,
)
from app.services.dashboard_service import DashboardService


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)

dashboard_service = DashboardService()


# =========================================================
# COMPLETE DASHBOARD
# =========================================================

@router.get(
    "",
    response_model=DashboardResponse,
)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return dashboard_service.get_dashboard(
        db=db,
    )


# =========================================================
# DASHBOARD SUMMARY
# =========================================================

@router.get(
    "/summary",
    response_model=DashboardSummaryResponse,
)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return dashboard_service.get_dashboard_summary(
        db=db,
    )


# =========================================================
# RESPONSE ANALYTICS
# =========================================================

@router.get(
    "/analytics",
    response_model=DashboardResponseAnalytics,
)
def get_response_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return dashboard_service.get_response_analytics(
        db=db,
    )


# =========================================================
# MOST FREQUENTLY USED FORMS
# =========================================================

@router.get(
    "/most-used-forms",
    response_model=FrequentlyUsedFormsResponse,
)
def get_most_used_forms(
    limit: int = Query(
        default=5,
        ge=1,
        le=20,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return dashboard_service.get_most_used_forms(
        db=db,
        limit=limit,
    )


# =========================================================
# SUBMISSION TRENDS
# =========================================================

@router.get(
    "/submission-trends",
    response_model=SubmissionTrendsResponse,
)
def get_submission_trends(
    from_date: datetime | None = Query(
        default=None,
    ),
    to_date: datetime | None = Query(
        default=None,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return dashboard_service.get_submission_trends(
        db=db,
        from_date=from_date,
        to_date=to_date,
    )