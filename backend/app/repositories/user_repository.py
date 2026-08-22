from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User


class UserRepository:

    def get_by_id(
        self,
        db: Session,
        user_id: int,
    ) -> User | None:
        return db.get(User, user_id)

    def get_by_email(
        self,
        db: Session,
        email: str,
    ) -> User | None:
        statement = select(User).where(User.email == email)

        return db.scalar(statement)

    def get_all(
        self,
        db: Session,
    ) -> list[User]:
        statement = select(User).order_by(User.id)

        return list(db.scalars(statement).all())

    def create(
        self,
        db: Session,
        user: User,
    ) -> User:
        db.add(user)
        db.commit()
        db.refresh(user)

        return user

    def update(
        self,
        db: Session,
        user: User,
    ) -> User:
        db.commit()
        db.refresh(user)

        return user

    def delete(
        self,
        db: Session,
        user: User,
    ) -> None:
        db.delete(user)
        db.commit()