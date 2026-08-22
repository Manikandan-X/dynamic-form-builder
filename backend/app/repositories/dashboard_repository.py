from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.form import Form
from app.models.form_response import FormResponse


class DashboardRepository:

    # =========================================================
    # TOTAL FORMS
    # =========================================================

    def get_total_forms(
        self,
        db: Session,
    ) -> int:
        query = select(
            func.count(Form.id)
        )

        return db.scalar(query) or 0

    # =========================================================
    # TOTAL RESPONSES
    # =========================================================

    def get_total_responses(
        self,
        db: Session,
    ) -> int:
        query = select(
            func.count(FormResponse.id)
        )

        return db.scalar(query) or 0

    # =========================================================
    # RESPONSE ANALYTICS
    # =========================================================

    def get_responses_between_dates(
        self,
        db: Session,
        from_date: datetime,
        to_date: datetime,
    ) -> int:
        query = select(
            func.count(FormResponse.id)
        ).where(
            FormResponse.submitted_at >= from_date,
            FormResponse.submitted_at <= to_date,
        )

        return db.scalar(query) or 0

    # =========================================================
    # MOST FREQUENTLY USED FORMS
    # =========================================================

    def get_most_used_forms(
        self,
        db: Session,
        limit: int = 5,
    ) -> list[tuple[int, str, int]]:

        query = (
            select(
                Form.id,
                Form.title,
                func.count(FormResponse.id),
            )
            .outerjoin(
                FormResponse,
                FormResponse.form_id == Form.id,
            )
            .group_by(
                Form.id,
                Form.title,
            )
            .order_by(
                func.count(FormResponse.id).desc()
            )
            .limit(limit)
        )

        return list(
            db.execute(query).tuples().all()
        )

    # =========================================================
    # SUBMISSION TRENDS
    # =========================================================

    def get_submission_trend(
        self,
        db: Session,
        from_date: datetime,
        to_date: datetime,
    ) -> list[tuple]:

        date_column = func.date(
            FormResponse.submitted_at
        )

        query = (
            select(
                date_column,
                func.count(FormResponse.id),
            )
            .where(
                FormResponse.submitted_at >= from_date,
                FormResponse.submitted_at <= to_date,
            )
            .group_by(
                date_column
            )
            .order_by(
                date_column
            )
        )

        return list(
            db.execute(query).tuples().all()
        )