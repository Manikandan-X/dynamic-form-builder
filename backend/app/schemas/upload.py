from pydantic import BaseModel


class FileUploadResponse(BaseModel):
    """
    Returned after a file is uploaded. `file_url` is a relative
    path (served via the static /uploads mount) that should be
    stored as the value for a FILE-type form field.
    """

    file_url: str
    file_name: str
    content_type: str | None
    size_bytes: int
