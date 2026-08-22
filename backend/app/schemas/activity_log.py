from datetime import datetime

from pydantic import BaseModel, ConfigDict


# =========================================================
# ACTIVITY LOG RESPONSE
# =========================================================


class ActivityLogResponse(BaseModel):
    id: int
    user_id: int | None
    response_id: int | None
    action: str
    description: str | None
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )