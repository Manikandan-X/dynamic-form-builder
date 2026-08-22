from datetime import datetime

from fastapi import (
    APIRouter,
    Depends,
    Query,
    status,
)
from fastapi.responses import StreamingResponse

from sqlalchemy.orm import Session

from app.api.dependencies import require_admin
from app.db.session import get_db
from app.models.user import User

from app.schemas.report import (
    ReportFilter,
    ResponseStatisticsResponse,
    FormResponseStatistics,
    FormAnalyticsResponse,
    ResponseTrendResponse,
)

from app.services.report_service import ReportService


router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)

report_service = ReportService()


# =========================================================
# RESPONSE STATISTICS
# =========================================================


@router.get(
    "/statistics",
    response_model=ResponseStatisticsResponse,
)
def get_response_statistics(
    form_id: int | None = Query(
        default=None,
    ),
    user_id: int | None = Query(
        default=None,
    ),
    from_date: datetime | None = Query(
        default=None,
    ),
    to_date: datetime | None = Query(
        default=None,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    filters = ReportFilter(
        form_id=form_id,
        user_id=user_id,
        from_date=from_date,
        to_date=to_date,
    )

    return report_service.get_response_statistics(
        db=db,
        filters=filters,
    )


# =========================================================
# FORM-WISE RESPONSE STATISTICS
# =========================================================


@router.get(
    "/forms",
    response_model=list[FormResponseStatistics],
)
def get_form_response_statistics(
    form_id: int | None = Query(
        default=None,
    ),
    from_date: datetime | None = Query(
        default=None,
    ),
    to_date: datetime | None = Query(
        default=None,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    filters = ReportFilter(
        form_id=form_id,
        from_date=from_date,
        to_date=to_date,
    )

    return report_service.get_form_response_statistics(
        db=db,
        filters=filters,
    )


# =========================================================
# FORM-WISE ANALYTICS
# =========================================================


@router.get(
    "/forms/{form_id}/analytics",
    response_model=FormAnalyticsResponse,
)
def get_form_analytics(
    form_id: int,
    user_id: int | None = Query(
        default=None,
    ),
    from_date: datetime | None = Query(
        default=None,
    ),
    to_date: datetime | None = Query(
        default=None,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return report_service.get_form_analytics(
        db=db,
        form_id=form_id,
        user_id=user_id,
        from_date=from_date,
        to_date=to_date,
    )


# =========================================================
# RESPONSE TREND
# =========================================================


@router.get(
    "/trend",
    response_model=ResponseTrendResponse,
)
def get_response_trend(
    from_date: datetime = Query(...),
    to_date: datetime = Query(...),
    form_id: int | None = Query(
        default=None,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return report_service.get_response_trend(
        db=db,
        from_date=from_date,
        to_date=to_date,
        form_id=form_id,
    )


# =========================================================
# EXPORT EXCEL
# =========================================================


@router.get(
    "/export/excel",
)
def export_excel(
    form_id: int | None = Query(
        default=None,
    ),
    user_id: int | None = Query(
        default=None,
    ),
    from_date: datetime | None = Query(
        default=None,
    ),
    to_date: datetime | None = Query(
        default=None,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    filters = ReportFilter(
        form_id=form_id,
        user_id=user_id,
        from_date=from_date,
        to_date=to_date,
    )

    file = report_service.generate_excel_report(
        db=db,
        filters=filters,
    )

    filename = "form_response_report.xlsx"

    return StreamingResponse(
        file,
        media_type=(
            "application/vnd.openxmlformats-officedocument."
            "spreadsheetml.sheet"
        ),
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            )
        },
    )


# =========================================================
# EXPORT PDF
# =========================================================


@router.get(
    "/export/pdf",
)
def export_pdf(
    form_id: int | None = Query(
        default=None,
    ),
    user_id: int | None = Query(
        default=None,
    ),
    from_date: datetime | None = Query(
        default=None,
    ),
    to_date: datetime | None = Query(
        default=None,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    filters = ReportFilter(
        form_id=form_id,
        user_id=user_id,
        from_date=from_date,
        to_date=to_date,
    )

    file = report_service.generate_pdf_report(
        db=db,
        filters=filters,
    )

    filename = "form_response_report.pdf"

    return StreamingResponse(
        file,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{filename}"'
            )
        },
    )