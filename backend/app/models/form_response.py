from datetime import datetime

from sqlalchemy import DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class FormResponse(Base):
    __tablename__ = "form_responses"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True,
    )

    form_id: Mapped[int] = mapped_column(
        ForeignKey(
            "forms.id",
            ondelete="CASCADE",
        ),
        nullable=False,
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

    submitted_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )

    # =========================================================
    # RELATIONSHIPS
    # =========================================================

    form = relationship(
        "Form",
        back_populates="responses",
    )

    user = relationship(
        "User",
        back_populates="form_responses",
    )

    details = relationship(
        "ResponseDetail",
        back_populates="response",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    
    activity_logs = relationship(
        "ActivityLog",
        back_populates="response",
    )