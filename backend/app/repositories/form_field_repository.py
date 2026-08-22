from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.form_field import FormField


class FormFieldRepository:

    def get_by_id(
        self,
        db: Session,
        field_id: int,
    ) -> FormField | None:

        statement = (
            select(FormField)
            .where(FormField.id == field_id)
            .options(
                selectinload(
                    FormField.options
                ),
            )
        )

        return db.execute(
            statement
        ).scalar_one_or_none()

    def get_by_form_id(
        self,
        db: Session,
        form_id: int,
    ) -> list[FormField]:

        statement = (
            select(FormField)
            .where(FormField.form_id == form_id)
            .options(
                selectinload(
                    FormField.options
                ),
            )
            .order_by(
                FormField.display_order
            )
        )

        return list(
            db.execute(
                statement
            ).scalars().all()
        )

    def get_by_client_key(
        self,
        db: Session,
        form_id: int,
        client_key: str,
    ) -> FormField | None:

        return (
            db.query(FormField)
            .filter(
                FormField.form_id == form_id,
                FormField.client_key == client_key,
            )
            .first()
        )
        
    def create(
        self,
        db: Session,
        field: FormField,
    ) -> FormField:

        db.add(field)
        db.flush()

        return field

    def update(
        self,
        db: Session,
        field: FormField,
    ) -> FormField:

        db.flush()

        return field

    def delete(
        self,
        db: Session,
        field: FormField,
    ) -> None:

        db.delete(field)
        db.flush()

    def delete_by_form_id(
        self,
        db: Session,
        form_id: int,
    ) -> None:

        fields = self.get_by_form_id(
            db,
            form_id,
        )

        for field in fields:
            db.delete(field)

        db.flush()