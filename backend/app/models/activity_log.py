from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
        index=True,
    )

    user_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    response_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "form_responses.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    action: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )

    # =========================================================
    # RELATIONSHIPS
    # =========================================================

    user = relationship(
        "User",
        back_populates="activity_logs",
    )

    response = relationship(
        "FormResponse",
        back_populates="activity_logs",
    )