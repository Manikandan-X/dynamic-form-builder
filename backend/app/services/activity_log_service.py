from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.activity_log import ActivityLog
from app.repositories.activity_log_repository import (
    ActivityLogRepository,
)


class ActivityLogService:

    def __init__(self) -> None:
        self.activity_log_repository = ActivityLogRepository()

    # =========================================================
    # CREATE ACTIVITY LOG
    # =========================================================

    def create_log(
        self,
        db: Session,
        action: str,
        description: str | None = None,
        user_id: int | None = None,
        response_id: int | None = None,
    ) -> ActivityLog:

        activity_log = ActivityLog(
            user_id=user_id,
            response_id=response_id,
            action=action,
            description=description,
            created_at=datetime.now(timezone.utc),
        )

        return self.activity_log_repository.create(
            db,
            activity_log,
        )

    # =========================================================
    # GET ALL ACTIVITY LOGS
    # =========================================================

    def get_all_logs(
        self,
        db: Session,
    ) -> list[ActivityLog]:

        return self.activity_log_repository.get_all(db)

    # =========================================================
    # GET LOG BY ID
    # =========================================================

    def get_log(
        self,
        db: Session,
        activity_log_id: int,
    ) -> ActivityLog:

        log = self.activity_log_repository.get_by_id(
            db,
            activity_log_id,
        )

        if log is None:
            from app.exceptions.common import NotFoundException

            raise NotFoundException(
                "Activity log not found."
            )

        return log

    # =========================================================
    # GET LOGS BY USER
    # =========================================================

    def get_user_logs(
        self,
        db: Session,
        user_id: int,
    ) -> list[ActivityLog]:

        return self.activity_log_repository.get_by_user_id(
            db,
            user_id,
        )

    # =========================================================
    # GET LOGS BY RESPONSE
    # =========================================================

    def get_response_logs(
        self,
        db: Session,
        response_id: int,
    ) -> list[ActivityLog]:

        return self.activity_log_repository.get_by_response_id(
            db,
            response_id,
        )