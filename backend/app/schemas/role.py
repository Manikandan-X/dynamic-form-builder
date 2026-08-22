from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class RoleBase(BaseModel):
    name: str = Field(
        ...,
        min_length=2,
        max_length=50,
    )


class RoleCreate(RoleBase):
    pass


class RoleUpdate(RoleBase):
    pass


class RoleResponse(RoleBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)