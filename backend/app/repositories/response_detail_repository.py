from sqlalchemy.orm import Session
from sqlalchemy import delete
from app.models.response_detail import ResponseDetail


class ResponseDetailRepository:

    # =========================================================
    # CREATE
    # =========================================================

    def create(
        self,
        db: Session,
        detail: ResponseDetail,
    ) -> ResponseDetail:

        db.add(detail)
        db.flush()
        db.refresh(detail)

        return detail

    # =========================================================
    # GET BY ID
    # =========================================================

    def get_by_id(
        self,
        db: Session,
        detail_id: int,
    ) -> ResponseDetail | None:

        return (
            db.query(ResponseDetail)
            .filter(
                ResponseDetail.id == detail_id
            )
            .first()
        )

    # =========================================================
    # GET DETAILS BY RESPONSE
    # =========================================================

    def get_by_response_id(
        self,
        db: Session,
        response_id: int,
    ) -> list[ResponseDetail]:

        return (
            db.query(ResponseDetail)
            .filter(
                ResponseDetail.response_id == response_id
            )
            .order_by(
                ResponseDetail.id.asc()
            )
            .all()
        )

    # =========================================================
    # GET DETAIL FOR SPECIFIC FIELD
    # =========================================================

    def get_by_response_and_field(
        self,
        db: Session,
        response_id: int,
        field_id: int,
    ) -> ResponseDetail | None:

        return (
            db.query(ResponseDetail)
            .filter(
                ResponseDetail.response_id == response_id,
                ResponseDetail.field_id == field_id,
            )
            .first()
        )

    # =========================================================
    # UPDATE
    # =========================================================

    def update(
        self,
        db: Session,
        detail: ResponseDetail,
    ) -> ResponseDetail:

        db.add(detail)
        db.flush()
        db.refresh(detail)

        return detail

    # =========================================================
    # DELETE
    # =========================================================

    def delete(
        self,
        db: Session,
        detail: ResponseDetail,
    ) -> None:

        db.delete(detail)
        db.flush()

    # =========================================================
    # DELETE ALL DETAILS FOR RESPONSE
    # =========================================================

    def delete_by_response_id(
        self,
        db: Session,
        response_id: int,
    ) -> None:

        details = (
            db.query(ResponseDetail)
            .filter(
                ResponseDetail.response_id == response_id
            )
            .all()
        )

        for detail in details:
            db.delete(detail)

        db.flush()