from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.form import Form
from app.models.form_field import FormField
from app.models.form_response import FormResponse
from app.models.response_detail import ResponseDetail
from app.models.user import User


class ReportRepository:

    # =========================================================
    # RESPONSE STATISTICS
    # =========================================================

    def get_total_responses(
        self,
        db: Session,
        form_id: int | None = None,
        user_id: int | None = None,
        from_date: datetime | None = None,
        to_date: datetime | None = None,
    ) -> int:

        query = select(
            func.count(FormResponse.id)
        )

        if form_id is not None:
            query = query.where(
                FormResponse.form_id == form_id
            )

        if user_id is not None:
            query = query.where(
                FormResponse.user_id == user_id
            )

        if from_date is not None:
            query = query.where(
                FormResponse.submitted_at >= from_date
            )

        if to_date is not None:
            query = query.where(
                FormResponse.submitted_at <= to_date
            )

        return db.scalar(query) or 0

    # =========================================================
    # RESPONSES BY DATE RANGE
    # =========================================================

    def get_responses_between_dates(
        self,
        db: Session,
        from_date: datetime,
        to_date: datetime,
        form_id: int | None = None,
        user_id: int | None = None,
    ) -> int:

        query = select(
            func.count(FormResponse.id)
        ).where(
            FormResponse.submitted_at >= from_date,
            FormResponse.submitted_at <= to_date,
        )

        if form_id is not None:
            query = query.where(
                FormResponse.form_id == form_id
            )

        if user_id is not None:
            query = query.where(
                FormResponse.user_id == user_id
            )

        return db.scalar(query) or 0

    # =========================================================
    # FORM-WISE RESPONSE STATISTICS
    # =========================================================

    def get_form_response_statistics(
        self,
        db: Session,
        form_id: int | None = None,
        from_date: datetime | None = None,
        to_date: datetime | None = None,
    ) -> list[tuple[int, str, int]]:

        join_conditions = [
            FormResponse.form_id == Form.id
        ]

        if from_date is not None:
            join_conditions.append(
                FormResponse.submitted_at >= from_date
            )

        if to_date is not None:
            join_conditions.append(
                FormResponse.submitted_at <= to_date
            )

        query = (
            select(
                Form.id,
                Form.title,
                func.count(FormResponse.id),
            )
            .outerjoin(
                FormResponse,
                *join_conditions,
            )
            .group_by(
                Form.id,
                Form.title,
            )
            .order_by(
                Form.id,
            )
        )

        if form_id is not None:
            query = query.where(
                Form.id == form_id
            )

        return list(
            db.execute(query).tuples().all()
        )

    # =========================================================
    # GET FORM
    # =========================================================

    def get_form_by_id(
        self,
        db: Session,
        form_id: int,
    ) -> Form | None:

        return db.scalar(
            select(Form).where(
                Form.id == form_id
            )
        )

    # =========================================================
    # GET FORM FIELDS
    # =========================================================

    def get_form_fields(
        self,
        db: Session,
        form_id: int,
    ) -> list[FormField]:

        query = (
            select(FormField)
            .where(
                FormField.form_id == form_id
            )
            .order_by(
                FormField.display_order
            )
        )

        return list(
            db.scalars(query).all()
        )

    # =========================================================
    # FIELD RESPONSE VALUES
    # =========================================================

    def get_field_response_values(
        self,
        db: Session,
        field_id: int,
        form_id: int | None = None,
        user_id: int | None = None,
        from_date: datetime | None = None,
        to_date: datetime | None = None,
    ) -> list[str]:

        query = (
            select(ResponseDetail.value)
            .join(
                FormResponse,
                FormResponse.id == ResponseDetail.response_id,
            )
            .where(
                ResponseDetail.field_id == field_id,
                ResponseDetail.value.is_not(None),
            )
        )

        if form_id is not None:
            query = query.where(
                FormResponse.form_id == form_id
            )

        if user_id is not None:
            query = query.where(
                FormResponse.user_id == user_id
            )

        if from_date is not None:
            query = query.where(
                FormResponse.submitted_at >= from_date
            )

        if to_date is not None:
            query = query.where(
                FormResponse.submitted_at <= to_date
            )

        return [
            value
            for value in db.scalars(query).all()
            if value is not None
        ]

    # =========================================================
    # RESPONSE TREND
    # =========================================================

    def get_response_trend(
        self,
        db: Session,
        from_date: datetime,
        to_date: datetime,
        form_id: int | None = None,
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

        if form_id is not None:
            query = query.where(
                FormResponse.form_id == form_id
            )

        return list(
            db.execute(query).tuples().all()
        )

    # =========================================================
    # RESPONSE DETAILS FOR EXPORT
    # =========================================================

    def get_responses_for_export(
        self,
        db: Session,
        form_id: int | None = None,
        user_id: int | None = None,
        from_date: datetime | None = None,
        to_date: datetime | None = None,
    ) -> list[FormResponse]:

        query = (
            select(FormResponse)
            .where()
            .order_by(
                FormResponse.submitted_at.desc()
            )
        )

        if form_id is not None:
            query = query.where(
                FormResponse.form_id == form_id
            )

        if user_id is not None:
            query = query.where(
                FormResponse.user_id == user_id
            )

        if from_date is not None:
            query = query.where(
                FormResponse.submitted_at >= from_date
            )

        if to_date is not None:
            query = query.where(
                FormResponse.submitted_at <= to_date
            )

        return list(
            db.scalars(query).all()
        )

    # =========================================================
    # RESPONSE DETAILS
    # =========================================================

    def get_response_details(
        self,
        db: Session,
        response_id: int,
    ) -> list[ResponseDetail]:

        query = (
            select(ResponseDetail)
            .where(
                ResponseDetail.response_id
                == response_id
            )
            .order_by(
                ResponseDetail.field_id
            )
        )

        return list(
            db.scalars(query).all()
        )

    # =========================================================
    # USER
    # =========================================================

    def get_user_by_id(
        self,
        db: Session,
        user_id: int,
    ) -> User | None:

        return db.scalar(
            select(User).where(
                User.id == user_id
            )
        )