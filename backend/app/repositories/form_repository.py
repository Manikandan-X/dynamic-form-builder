from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.form import Form
from app.models.form_field import FormField


class FormRepository:

    def get_by_id(
        self,
        db: Session,
        form_id: int,
    ) -> Form | None:

        statement = (
            select(Form)
            .where(Form.id == form_id)
            .options(
                selectinload(Form.fields),
            )
        )

        return db.execute(statement).scalar_one_or_none()

    def get_by_id_with_details(
        self,
        db: Session,
        form_id: int,
    ) -> Form | None:

        statement = (
            select(Form)
            .where(Form.id == form_id)
            .options(
                selectinload(Form.fields)
                .selectinload(FormField.options),
            )
        )

        return db.execute(
            statement
        ).scalar_one_or_none()

    def get_all(
        self,
        db: Session,
    ) -> list[Form]:

        statement = (
            select(Form)
            .order_by(Form.created_at.desc())
        )

        return list(
            db.execute(statement).scalars().all()
        )

    def get_by_creator(
        self,
        db: Session,
        user_id: int,
    ) -> list[Form]:

        statement = (
            select(Form)
            .where(Form.created_by == user_id)
            .order_by(Form.created_at.desc())
        )

        return list(
            db.execute(statement).scalars().all()
        )

    def create(
        self,
        db: Session,
        form: Form,
    ) -> Form:

        db.add(form)
        db.flush()

        return form

    def update(
        self,
        db: Session,
        form: Form,
    ) -> Form:

        db.flush()

        return form

    def delete(
        self,
        db: Session,
        form: Form,
    ) -> None:

        db.delete(form)
        db.flush()