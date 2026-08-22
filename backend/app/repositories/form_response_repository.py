from datetime import datetime

from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.models.form_response import FormResponse
from app.models.response_detail import ResponseDetail


class FormResponseRepository:

    # =========================================================
    # CREATE
    # =========================================================

    def create(
        self,
        db: Session,
        response: FormResponse,
    ) -> FormResponse:
        db.add(response)
        db.flush()
        db.refresh(response)
        return response

    # =========================================================
    # GET BY ID
    # =========================================================

    def get_by_id(
        self,
        db: Session,
        response_id: int,
    ) -> FormResponse | None:
        return (
            db.query(FormResponse)
            .filter(
                FormResponse.id == response_id
            )
            .first()
        )

    # =========================================================
    # GET BY ID WITH DETAILS
    # =========================================================

    def get_by_id_with_details(
        self,
        db: Session,
        response_id: int,
    ) -> FormResponse | None:
        return (
            db.query(FormResponse)
            .options(
                joinedload(FormResponse.details)
            )
            .filter(
                FormResponse.id == response_id
            )
            .first()
        )

    # =========================================================
    # GET RESPONSES BY FORM
    # =========================================================

    def get_by_form_id(
        self,
        db: Session,
        form_id: int,
    ) -> list[FormResponse]:
        return (
            db.query(FormResponse)
            .filter(
                FormResponse.form_id == form_id
            )
            .order_by(
                FormResponse.submitted_at.desc()
            )
            .all()
        )

    # =========================================================
    # GET RESPONSES BY USER
    # =========================================================

    def get_by_user_id(
        self,
        db: Session,
        user_id: int,
    ) -> list[FormResponse]:
        return (
            db.query(FormResponse)
            .filter(
                FormResponse.user_id == user_id
            )
            .order_by(
                FormResponse.submitted_at.desc()
            )
            .all()
        )

    
    # =========================================================
    # GET USER RESPONSE FOR FORM
    # =========================================================

    def get_by_form_and_user(
        self,
        db: Session,
        form_id: int,
        user_id: int,
    ) -> list[FormResponse]:
        return (
            db.query(FormResponse)
            .filter(
                FormResponse.form_id == form_id,
                FormResponse.user_id == user_id,
            )
            .order_by(
                FormResponse.submitted_at.desc()
            )
            .all()
        )

    # =========================================================
    # SEARCH AND FILTER RESPONSES
    # =========================================================

    def search_and_filter(
        self,
        db: Session,
        search: str | None = None,
        form_id: int | None = None,
        user_id: int | None = None,
        from_date: datetime | None = None,
        to_date: datetime | None = None,
    ) -> list[FormResponse]:

        query = (
            db.query(FormResponse)
            .options(
                joinedload(FormResponse.details)
            )
        )

        # -----------------------------------------------------
        # FORM FILTER
        # -----------------------------------------------------

        if form_id is not None:
            query = query.filter(
                FormResponse.form_id == form_id
            )

        # -----------------------------------------------------
        # USER FILTER
        # -----------------------------------------------------

        if user_id is not None:
            query = query.filter(
                FormResponse.user_id == user_id
            )

        # -----------------------------------------------------
        # FROM DATE
        # -----------------------------------------------------

        if from_date is not None:
            query = query.filter(
                FormResponse.submitted_at >= from_date
            )

        # -----------------------------------------------------
        # TO DATE
        # -----------------------------------------------------

        if to_date is not None:
            query = query.filter(
                FormResponse.submitted_at <= to_date
            )

        # -----------------------------------------------------
        # SEARCH
        # -----------------------------------------------------

        if search is not None:
            search_pattern = f"%{search}%"

            query = query.join(
                FormResponse.details
            ).filter(
                ResponseDetail.value.ilike(
                    search_pattern
                )
            ).distinct()

        # -----------------------------------------------------
        # ORDER
        # -----------------------------------------------------

        query = query.order_by(
            FormResponse.submitted_at.desc()
        )

        return query.all()

    # =========================================================
    # UPDATE
    # =========================================================

    def update(
        self,
        db: Session,
        response: FormResponse,
    ) -> FormResponse:
        db.add(response)
        db.flush()
        db.refresh(response)
        return response

    # =========================================================
    # DELETE
    # =========================================================

    def delete(
        self,
        db: Session,
        response: FormResponse,
    ) -> None:
        db.delete(response)
        db.flush()