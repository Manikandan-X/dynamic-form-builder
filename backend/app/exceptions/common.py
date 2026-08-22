from app.exceptions.base import AppException


class AlreadyExistsException(AppException):
    def __init__(
        self,
        message: str = "Resource already exists.",
    ):
        super().__init__(
            message=message,
            status_code=409,
        )


class NotFoundException(AppException):
    def __init__(
        self,
        message: str = "Resource not found.",
    ):
        super().__init__(
            message=message,
            status_code=404,
        )


class ForbiddenException(AppException):
    def __init__(
        self,
        message: str = "You do not have permission to perform this action.",
    ):
        super().__init__(
            message=message,
            status_code=403,
        )
        
class BadRequestException(AppException):
    status_code = 400