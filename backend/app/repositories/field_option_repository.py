from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.field_option import FieldOption


class FieldOptionRepository:

    def get_by_id(
        self,
        db: Session,
        option_id: int,
    ) -> FieldOption | None:

        statement = (
            select(FieldOption)
            .where(
                FieldOption.id == option_id
            )
        )

        return db.execute(
            statement
        ).scalar_one_or_none()

    def get_by_field_id(
        self,
        db: Session,
        field_id: int,
    ) -> list[FieldOption]:

        statement = (
            select(FieldOption)
            .where(
                FieldOption.field_id == field_id
            )
            .order_by(
                FieldOption.display_order
            )
        )

        return list(
            db.execute(
                statement
            ).scalars().all()
        )

    def create(
        self,
        db: Session,
        option: FieldOption,
    ) -> FieldOption:

        db.add(option)
        db.flush()

        return option

    def update(
        self,
        db: Session,
        option: FieldOption,
    ) -> FieldOption:

        db.flush()

        return option

    def delete(
        self,
        db: Session,
        option: FieldOption,
    ) -> None:

        db.delete(option)
        db.flush()

    def delete_by_field_id(
        self,
        db: Session,
        field_id: int,
    ) -> None:

        options = self.get_by_field_id(
            db,
            field_id,
        )

        for option in options:
            db.delete(option)

        db.flush()