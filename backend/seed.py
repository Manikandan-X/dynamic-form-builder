from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.role import Role


DEFAULT_ROLES = [
    "ADMIN",
    "USER",
]


def seed_roles() -> None:
    db = SessionLocal()

    try:
        for role_name in DEFAULT_ROLES:
            existing_role = db.scalar(
                select(Role).where(Role.name == role_name)
            )

            if existing_role:
                continue

            db.add(Role(name=role_name))

        db.commit()

        print("Roles seeded successfully.")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_roles()