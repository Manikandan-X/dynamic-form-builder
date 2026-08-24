import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.exceptions.common import BadRequestException
from app.models.user import User
from app.schemas.upload import FileUploadResponse
from app.services.activity_log_service import ActivityLogService


router = APIRouter(
    prefix="/uploads",
    tags=["Uploads"],
)

activity_log_service = ActivityLogService()


def _get_extension(filename: str) -> str:
    return Path(filename).suffix.lstrip(".").lower()


@router.post(
    "",
    response_model=FileUploadResponse,
)
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.filename:
        raise BadRequestException(
            "A file name is required."
        )

    extension = _get_extension(file.filename)

    if extension not in settings.allowed_upload_extensions_list:
        raise BadRequestException(
            f"File type '.{extension}' is not allowed. "
            f"Allowed types: {', '.join(settings.allowed_upload_extensions_list)}."
        )

    # -----------------------------------------------------
    # Read in chunks, enforcing the max size limit without
    # loading an arbitrarily large file fully into memory.
    # -----------------------------------------------------

    max_size = settings.max_upload_size_bytes
    chunk_size = 1024 * 1024  # 1 MB
    total_size = 0
    chunks: list[bytes] = []

    while True:
        chunk = await file.read(chunk_size)

        if not chunk:
            break

        total_size += len(chunk)

        if total_size > max_size:
            raise BadRequestException(
                f"File exceeds the maximum allowed size of "
                f"{settings.max_upload_size_mb} MB."
            )

        chunks.append(chunk)

    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    stored_name = f"{uuid.uuid4().hex}.{extension}" if extension else uuid.uuid4().hex
    destination = upload_dir / stored_name

    with open(destination, "wb") as out_file:
        for chunk in chunks:
            out_file.write(chunk)

    activity_log_service.create_log(
        db=db,
        action="UPLOAD_FILE",
        description=(
            f"File '{file.filename}' "
            f"({total_size} bytes) was uploaded."
        ),
        user_id=current_user.id,
    )
    db.commit()

    return FileUploadResponse(
        file_url=f"/uploads/{stored_name}",
        file_name=file.filename,
        content_type=file.content_type,
        size_bytes=total_size,
    )
