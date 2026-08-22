from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session

from app.api.dependencies import require_admin
from app.db.session import get_db
from app.models.user import User
from app.schemas.activity_log import ActivityLogResponse
from app.services.activity_log_service import ActivityLogService


router = APIRouter(
    prefix="/activity-logs",
    tags=["Activity Logs"],
)

activity_log_service = ActivityLogService()


# =========================================================
# ADMIN - GET ALL ACTIVITY LOGS
# =========================================================

@router.get(
    "",
    response_model=list[ActivityLogResponse],
)
def get_all_activity_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return activity_log_service.get_all_logs(
        db=db,
    )


# =========================================================
# ADMIN - GET ACTIVITY LOG BY ID
# =========================================================

@router.get(
    "/{activity_log_id}",
    response_model=ActivityLogResponse,
)
def get_activity_log(
    activity_log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return activity_log_service.get_log(
        db=db,
        activity_log_id=activity_log_id,
    )


# =========================================================
# ADMIN - GET LOGS BY USER
# =========================================================

@router.get(
    "/users/{user_id}",
    response_model=list[ActivityLogResponse],
)
def get_user_activity_logs(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return activity_log_service.get_user_logs(
        db=db,
        user_id=user_id,
    )


# =========================================================
# ADMIN - GET LOGS BY RESPONSE
# =========================================================

@router.get(
    "/responses/{response_id}",
    response_model=list[ActivityLogResponse],
)
def get_response_activity_logs(
    response_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return activity_log_service.get_response_logs(
        db=db,
        response_id=response_id,
    )