from sqlalchemy.orm import Session

from app.models.activity_log import ActivityLog


class ActivityLogRepository:

    # =========================================================
    # CREATE
    # =========================================================

    def create(
        self,
        db: Session,
        activity_log: ActivityLog,
    ) -> ActivityLog:

        db.add(activity_log)
        db.flush()
        db.refresh(activity_log)

        return activity_log

    # =========================================================
    # GET BY ID
    # =========================================================

    def get_by_id(
        self,
        db: Session,
        activity_log_id: int,
    ) -> ActivityLog | None:

        return (
            db.query(ActivityLog)
            .filter(
                ActivityLog.id == activity_log_id
            )
            .first()
        )

    # =========================================================
    # GET ALL
    # =========================================================

    def get_all(
        self,
        db: Session,
    ) -> list[ActivityLog]:

        return (
            db.query(ActivityLog)
            .order_by(
                ActivityLog.created_at.desc()
            )
            .all()
        )

    # =========================================================
    # GET BY USER
    # =========================================================

    def get_by_user_id(
        self,
        db: Session,
        user_id: int,
    ) -> list[ActivityLog]:

        return (
            db.query(ActivityLog)
            .filter(
                ActivityLog.user_id == user_id
            )
            .order_by(
                ActivityLog.created_at.desc()
            )
            .all()
        )

    # =========================================================
    # GET BY RESPONSE
    # =========================================================

    def get_by_response_id(
        self,
        db: Session,
        response_id: int,
    ) -> list[ActivityLog]:

        return (
            db.query(ActivityLog)
            .filter(
                ActivityLog.response_id == response_id
            )
            .order_by(
                ActivityLog.created_at.desc()
            )
            .all()
        )