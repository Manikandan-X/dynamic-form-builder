from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.role import Role


class RoleRepository:

    def get_by_id(
        self,
        db: Session,
        role_id: int,
    ) -> Role | None:
        return db.get(Role, role_id)

    def get_by_name(
        self,
        db: Session,
        name: str,
    ) -> Role | None:
        statement = select(Role).where(Role.name == name)

        return db.scalar(statement)

    def get_all(
        self,
        db: Session,
    ) -> list[Role]:
        statement = select(Role).order_by(Role.id)

        return list(db.scalars(statement).all())

    def create(
        self,
        db: Session,
        role: Role,
    ) -> Role:
        db.add(role)
        db.commit()
        db.refresh(role)

        return role

    def update(
        self,
        db: Session,
        role: Role,
    ) -> Role:
        db.commit()
        db.refresh(role)

        return role

    def delete(
        self,
        db: Session,
        role: Role,
    ) -> None:
        db.delete(role)
        db.commit()