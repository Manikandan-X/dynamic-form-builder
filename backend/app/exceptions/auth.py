from app.exceptions.base import AppException


class InvalidCredentialsException(AppException):
    def __init__(
        self,
        message: str = "Invalid email or password.",
    ):
        super().__init__(
            message=message,
            status_code=401,
        )


class InactiveUserException(AppException):
    def __init__(
        self,
        message: str = "User account is inactive.",
    ):
        super().__init__(
            message=message,
            status_code=403,
        )


class InvalidTokenException(AppException):
    def __init__(
        self,
        message: str = "Invalid or expired authentication token.",
    ):
        super().__init__(
            message=message,
            status_code=401,
        )