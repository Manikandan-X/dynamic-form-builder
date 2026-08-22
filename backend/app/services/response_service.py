from datetime import datetime, timezone
import json
import re

from sqlalchemy.orm import Session
from sqlalchemy import delete

from app.exceptions.common import (
    AlreadyExistsException,
    BadRequestException,
    ForbiddenException,
    NotFoundException,
)

from app.exceptions.messages import (
    FORM_NOT_FOUND,
    FIELD_NOT_FOUND,
)

from app.models.enums import FormFieldType
from app.models.form import Form
from app.models.form_field import FormField
from app.models.form_response import FormResponse
from app.models.response_detail import ResponseDetail

from app.repositories.form_repository import FormRepository
from app.repositories.form_field_repository import (
    FormFieldRepository,
)
from app.repositories.form_response_repository import (
    FormResponseRepository,
)
from app.repositories.response_detail_repository import (
    ResponseDetailRepository,
)

from app.schemas.response import (
    FormResponseCreate,
    FormResponseUpdate,
)
from app.services.activity_log_service import ActivityLogService

class ResponseService:

    def __init__(self) -> None:
        self.form_repository = FormRepository()
        self.form_field_repository = FormFieldRepository()
        self.form_response_repository = FormResponseRepository()
        self.response_detail_repository = (
            ResponseDetailRepository()
        )
        self.activity_log_service = ActivityLogService()

    # =========================================================
    # SUBMIT RESPONSE
    # =========================================================

    def submit_response(
        self,
        db: Session,
        form_id: int,
        data: FormResponseCreate,
        current_user_id: int | None = None,
    ) -> FormResponse:

        form = self._get_form(
            db,
            form_id,
        )

        # -----------------------------------------------------
        # Form must be active
        # -----------------------------------------------------

        if not form.is_active:
            raise BadRequestException(
                "This form is currently disabled."
            )

        # -----------------------------------------------------
        # Public / authenticated access
        # -----------------------------------------------------

        if not form.is_public and current_user_id is None:
            raise ForbiddenException(
                "Authentication is required to submit this form."
            )

        # -----------------------------------------------------
        # Get fields belonging to this form
        # -----------------------------------------------------

        fields = (
            self.form_field_repository.get_by_form_id(
                db,
                form.id,
            )
        )

        if not fields:
            raise BadRequestException(
                "This form does not contain any fields."
            )

        # -----------------------------------------------------
        # Validate submitted values
        # -----------------------------------------------------

        validated_values = self._validate_submission(
            fields=fields,
            values=data.values,
        )

        now = datetime.now(timezone.utc)

        response = FormResponse(
            form_id=form.id,
            user_id=current_user_id,
            submitted_at=now,
            updated_at=now,
        )

        try:
            response = (
                self.form_response_repository.create(
                    db,
                    response,
                )
            )

            for field, value in validated_values:
                detail = ResponseDetail(
                    response_id=response.id,
                    field_id=field.id,
                    value=self._serialize_value(value),
                )

                self.response_detail_repository.create(
                    db,
                    detail,
                )

            # ---------------------------------------------------------
            # Activity log
            # ---------------------------------------------------------
            self.activity_log_service.create_log(
                db=db,
                user_id=current_user_id,
                response_id=response.id,
                action="SUBMITTED",
                description="Form response submitted.",
            )

            db.commit()

        except Exception:
            db.rollback()
            raise

        created_response = (
            self.form_response_repository.get_by_id_with_details(
                db,
                response.id,
            )
        )

        if created_response is None:
            raise NotFoundException(
                "Response could not be created."
            )

        return created_response

    # =========================================================
    # GET RESPONSE
    # =========================================================

    def get_response(
        self,
        db: Session,
        response_id: int,
    ) -> FormResponse:

        response = (
            self.form_response_repository.get_by_id_with_details(
                db,
                response_id,
            )
        )

        if response is None:
            raise NotFoundException(
                "Response not found."
            )

        return response

    # =========================================================
    # GET RESPONSES FOR FORM
    # =========================================================

    def get_form_responses(
        self,
        db: Session,
        form_id: int,
    ) -> list[FormResponse]:

        form = self._get_form(
            db,
            form_id,
        )

        return (
            self.form_response_repository.get_by_form_id(
                db,
                form.id,
            )
        )

    # =========================================================
    # GET USER RESPONSES
    # =========================================================

    def get_user_responses(
        self,
        db: Session,
        user_id: int,
    ) -> list[FormResponse]:

        return (
            self.form_response_repository.get_by_user_id(
                db,
                user_id,
            )
        )

    # =========================================================
    # UPDATE RESPONSE
    # =========================================================

    def update_response(
        self,
        db: Session,
        response_id: int,
        data: FormResponseUpdate,
        current_user_id: int,
        is_admin: bool,
    ) -> FormResponse:

        # ---------------------------------------------------------
        # Get existing response
        # ---------------------------------------------------------

        response = self.get_response(
            db,
            response_id,
        )

        # ---------------------------------------------------------
        # Permission check
        # ---------------------------------------------------------

        if (
            not is_admin
            and response.user_id != current_user_id
        ):
            raise ForbiddenException(
                "You do not have permission to update this response."
            )

        # ---------------------------------------------------------
        # Get form with fields and options
        # ---------------------------------------------------------

        form = self.form_repository.get_by_id_with_details(
            db,
            response.form_id,
        )

        if form is None:
            raise NotFoundException(
                FORM_NOT_FOUND
            )

        # ---------------------------------------------------------
        # Get fields belonging to this form
        # ---------------------------------------------------------

        fields = (
            self.form_field_repository.get_by_form_id(
                db,
                form.id,
            )
        )

        if not fields:
            raise BadRequestException(
                "This form does not contain any fields."
            )

        # ---------------------------------------------------------
        # Validate submitted values
        #
        # IMPORTANT:
        # Reuse the same validation method used by
        # submit_response().
        # ---------------------------------------------------------

        validated_values = self._validate_submission(
            fields=fields,
            values=data.values,
        )

        try:
            # ---------------------------------------------------------
            # Delete existing response details
            # ---------------------------------------------------------
            self.response_detail_repository.delete_by_response_id(
                db,
                response.id,
            )

            # ---------------------------------------------------------
            # Create new response details
            # ---------------------------------------------------------
            for field, value in validated_values:
                detail = ResponseDetail(
                    response_id=response.id,
                    field_id=field.id,
                    value=self._serialize_value(value),
                )

                self.response_detail_repository.create(
                    db,
                    detail,
                )

            # ---------------------------------------------------------
            # Update timestamp
            # ---------------------------------------------------------
            response.updated_at = datetime.now(
                timezone.utc
            )

            # ---------------------------------------------------------
            # Activity log
            # ---------------------------------------------------------
            self.activity_log_service.create_log(
                db=db,
                user_id=current_user_id,
                response_id=response.id,
                action="UPDATED",
                description="Form response updated.",
            )

            # ---------------------------------------------------------
            # Commit
            # ---------------------------------------------------------
            db.commit()

        except Exception:
            db.rollback()
            raise

        # ---------------------------------------------------------
        # Return freshly loaded response
        # ---------------------------------------------------------

        return self.get_response(
            db,
            response_id,
        )

    # =========================================================
    # SEARCH AND FILTER RESPONSES
    # =========================================================

    def search_and_filter_responses(
        self,
        db: Session,
        search: str | None = None,
        form_id: int | None = None,
        user_id: int | None = None,
        from_date: datetime | None = None,
        to_date: datetime | None = None,
    ) -> list[FormResponse]:

        if (
            from_date is not None
            and to_date is not None
            and from_date > to_date
        ):
            raise BadRequestException(
                "from_date cannot be greater than to_date."
            )

        return self.form_response_repository.search_and_filter(
            db=db,
            search=search,
            form_id=form_id,
            user_id=user_id,
            from_date=from_date,
            to_date=to_date,
        )
        
    # =========================================================
    # DELETE RESPONSE
    # =========================================================

    def delete_response(
        self,
        db: Session,
        response_id: int,
        current_user_id: int,
        is_admin: bool = False,
    ) -> None:

        response = self.get_response(
            db,
            response_id,
        )

        if (
            not is_admin
            and response.user_id != current_user_id
        ):
            raise ForbiddenException(
                "You do not have permission to delete this response."
            )

        try:
            # -----------------------------------------------------
            # Create activity log BEFORE deleting response
            # -----------------------------------------------------
            self.activity_log_service.create_log(
                db=db,
                user_id=current_user_id,
                response_id=response.id,
                action="DELETED",
                description="Form response deleted.",
            )

            # -----------------------------------------------------
            # Delete response
            # -----------------------------------------------------
            self.form_response_repository.delete(
                db,
                response,
            )

            # -----------------------------------------------------
            # Commit
            # -----------------------------------------------------
            db.commit()

        except Exception:
            db.rollback()
            raise

    # =========================================================
    # PRIVATE - GET FORM
    # =========================================================

    def _get_form(
        self,
        db: Session,
        form_id: int,
    ) -> Form:

        form = self.form_repository.get_by_id_with_details(
            db,
            form_id,
        )

        if form is None:
            raise NotFoundException(
                FORM_NOT_FOUND
            )

        return form

    # =========================================================
    # PRIVATE - SUBMISSION VALIDATION
    # =========================================================

    def _validate_submission(
        self,
        fields: list[FormField],
        values: list,
    ) -> list[tuple[FormField, object]]:

        # -----------------------------------------------------
        # Build field lookup
        # -----------------------------------------------------

        field_map = {
            field.id: field
            for field in fields
        }

        # -----------------------------------------------------
        # Prevent duplicate field IDs
        # -----------------------------------------------------

        submitted_field_ids = [
            item.field_id
            for item in values
        ]

        if len(submitted_field_ids) != len(
            set(submitted_field_ids)
        ):
            raise AlreadyExistsException(
                "A field cannot be submitted more than once."
            )

        submitted_map = {
            item.field_id: item.value
            for item in values
        }

        # -----------------------------------------------------
        # Check unknown fields
        # -----------------------------------------------------

        for field_id in submitted_map:

            if field_id not in field_map:
                raise BadRequestException(
                    f"Field {field_id} does not belong to this form."
                )

        # -----------------------------------------------------
        # Check required fields
        # -----------------------------------------------------

        for field in fields:

            if not field.is_required:
                continue

            # Conditional required fields are checked later
            # based on visibility.
            if field.is_conditional:
                continue

            if field.id not in submitted_map:
                raise BadRequestException(
                    f"Required field '{field.label}' is missing."
                )

            if self._is_empty_value(
                submitted_map[field.id]
            ):
                raise BadRequestException(
                    f"Required field '{field.label}' cannot be empty."
                )

        # -----------------------------------------------------
        # Validate conditional visibility
        # -----------------------------------------------------

        for field in fields:

            if not field.is_conditional:
                continue

            is_visible = self._is_conditional_field_visible(
                field=field,
                fields=fields,
                submitted_values=submitted_map,
            )

            if is_visible:

                if field.is_required:

                    if field.id not in submitted_map:
                        raise BadRequestException(
                            f"Required conditional field "
                            f"'{field.label}' is missing."
                        )

                    if self._is_empty_value(
                        submitted_map[field.id]
                    ):
                        raise BadRequestException(
                            f"Required conditional field "
                            f"'{field.label}' cannot be empty."
                        )

            else:

                # A hidden field must not be submitted
                if field.id in submitted_map:
                    raise BadRequestException(
                        f"Field '{field.label}' "
                        f"is not currently visible."
                    )

        # -----------------------------------------------------
        # Validate field values
        # -----------------------------------------------------

        validated_values = []

        for field in fields:

            if field.id not in submitted_map:
                continue

            value = submitted_map[field.id]

            self._validate_field_value(
                field=field,
                value=value,
            )

            validated_values.append(
                (field, value)
            )

        return validated_values

    # =========================================================
    # PRIVATE - FIELD VALUE VALIDATION
    # =========================================================

    def _validate_field_value(
        self,
        field: FormField,
        value: object,
    ) -> None:

        if self._is_empty_value(value):

            if field.is_required:
                raise BadRequestException(
                    f"Field '{field.label}' cannot be empty."
                )

            return

        field_type = FormFieldType(
            field.field_type
        )

        # =====================================================
        # TEXT
        # =====================================================

        if field_type == FormFieldType.TEXT:

            if not isinstance(value, str):
                raise BadRequestException(
                    f"Field '{field.label}' must be text."
                )

            self._validate_length(
                field,
                value,
            )

        # =====================================================
        # EMAIL
        # =====================================================

        elif field_type == FormFieldType.EMAIL:

            if not isinstance(value, str):
                raise BadRequestException(
                    f"Field '{field.label}' must be a valid email."
                )

            email_pattern = (
                r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
            )

            if not re.match(
                email_pattern,
                value,
            ):
                raise BadRequestException(
                    f"Field '{field.label}' must contain a valid email."
                )

            self._validate_length(
                field,
                value,
            )

        # =====================================================
        # NUMBER
        # =====================================================

        elif field_type == FormFieldType.NUMBER:

            if (
                isinstance(value, bool)
                or not isinstance(
                    value,
                    (int, float),
                )
            ):
                raise BadRequestException(
                    f"Field '{field.label}' must be a number."
                )

            self._validate_numeric_range(
                field,
                float(value),
            )

        # =====================================================
        # DATE
        # =====================================================

        elif field_type == FormFieldType.DATE:

            if not isinstance(value, str):
                raise BadRequestException(
                    f"Field '{field.label}' must be a date."
                )

            try:
                datetime.strptime(
                    value,
                    "%Y-%m-%d",
                )
            except ValueError:
                raise BadRequestException(
                    f"Field '{field.label}' must use YYYY-MM-DD format."
                )

        # =====================================================
        # DROPDOWN
        # =====================================================

        elif field_type == FormFieldType.DROPDOWN:

            if not isinstance(value, str):
                raise BadRequestException(
                    f"Field '{field.label}' must contain a valid option."
                )

            self._validate_option_value(
                field,
                value,
            )

        # =====================================================
        # RADIO
        # =====================================================

        elif field_type == FormFieldType.RADIO:

            if not isinstance(value, str):
                raise BadRequestException(
                    f"Field '{field.label}' must contain a valid option."
                )

            self._validate_option_value(
                field,
                value,
            )

        # =====================================================
        # CHECKBOX
        # =====================================================

        elif field_type == FormFieldType.CHECKBOX:

            if not isinstance(value, list):
                raise BadRequestException(
                    f"Field '{field.label}' must contain a list of options."
                )

            for selected_value in value:

                if not isinstance(
                    selected_value,
                    str,
                ):
                    raise BadRequestException(
                        f"Field '{field.label}' contains an invalid option."
                    )

                self._validate_option_value(
                    field,
                    selected_value,
                )

        # =====================================================
        # FILE
        # =====================================================

        elif field_type == FormFieldType.FILE:

            if not isinstance(value, str):
                raise BadRequestException(
                    f"Field '{field.label}' must contain a file reference."
                )

        # =====================================================
        # RATING
        # =====================================================

        elif field_type == FormFieldType.RATING:

            if (
                isinstance(value, bool)
                or not isinstance(
                    value,
                    (int, float),
                )
            ):
                raise BadRequestException(
                    f"Field '{field.label}' must contain a numeric rating."
                )

            self._validate_numeric_range(
                field,
                float(value),
            )

    # =========================================================
    # PRIVATE - TEXT LENGTH
    # =========================================================

    def _validate_length(
        self,
        field: FormField,
        value: str,
    ) -> None:

        value_length = len(value)

        if (
            field.min_length is not None
            and value_length < field.min_length
        ):
            raise BadRequestException(
                f"Field '{field.label}' must contain at least "
                f"{field.min_length} characters."
            )

        if (
            field.max_length is not None
            and value_length > field.max_length
        ):
            raise BadRequestException(
                f"Field '{field.label}' must contain at most "
                f"{field.max_length} characters."
            )

    # =========================================================
    # PRIVATE - NUMERIC RANGE
    # =========================================================

    def _validate_numeric_range(
        self,
        field: FormField,
        value: float,
    ) -> None:

        if (
            field.min_value is not None
            and value < field.min_value
        ):
            raise BadRequestException(
                f"Field '{field.label}' must be at least "
                f"{field.min_value}."
            )

        if (
            field.max_value is not None
            and value > field.max_value
        ):
            raise BadRequestException(
                f"Field '{field.label}' must be at most "
                f"{field.max_value}."
            )

    # =========================================================
    # PRIVATE - OPTION VALIDATION
    # =========================================================

    def _validate_option_value(
        self,
        field: FormField,
        value: str,
    ) -> None:

        valid_values = {
            option.value
            for option in field.options
        }

        if value not in valid_values:
            raise BadRequestException(
                f"Invalid option '{value}' for field "
                f"'{field.label}'."
            )

    # =========================================================
    # PRIVATE - CONDITIONAL LOGIC
    # =========================================================

    def _is_conditional_field_visible(
        self,
        field: FormField,
        fields: list[FormField],
        submitted_values: dict[int, object],
    ) -> bool:

        if not field.is_conditional:
            return True

        if field.conditional_field_id is None:
            return False

        controlling_field = next(
            (
                item
                for item in fields
                if item.id
                == field.conditional_field_id
            ),
            None,
        )

        if controlling_field is None:
            return False

        if (
            controlling_field.id
            not in submitted_values
        ):
            return False

        actual_value = submitted_values[
            controlling_field.id
        ]

        expected_value = field.conditional_value

        operator = field.conditional_operator

        if operator == "EQUALS":
            return self._compare_equals(
                actual_value,
                expected_value,
            )

        if operator == "NOT_EQUALS":
            return not self._compare_equals(
                actual_value,
                expected_value,
            )

        if operator == "CONTAINS":
            return self._compare_contains(
                actual_value,
                expected_value,
            )

        return False

    # =========================================================
    # PRIVATE - CONDITIONAL COMPARISON
    # =========================================================

    def _compare_equals(
        self,
        actual_value: object,
        expected_value: str | None,
    ) -> bool:

        if isinstance(
            actual_value,
            list,
        ):
            return (
                expected_value in actual_value
            )

        return str(actual_value) == str(
            expected_value
        )

    def _compare_contains(
        self,
        actual_value: object,
        expected_value: str | None,
    ) -> bool:

        if expected_value is None:
            return False

        if isinstance(
            actual_value,
            list,
        ):
            return expected_value in actual_value

        return expected_value in str(
            actual_value
        )

    # =========================================================
    # PRIVATE - EMPTY VALUE
    # =========================================================

    def _is_empty_value(
        self,
        value: object,
    ) -> bool:

        if value is None:
            return True

        if isinstance(
            value,
            str,
        ):
            return not value.strip()

        if isinstance(
            value,
            list,
        ):
            return len(value) == 0

        return False

    # =========================================================
    # PRIVATE - SERIALIZATION
    # =========================================================

    def _serialize_value(
        self,
        value: object,
    ) -> str:

        if isinstance(
            value,
            (list, dict),
        ):
            return json.dumps(
                value,
                ensure_ascii=False,
            )

        if isinstance(
            value,
            bool,
        ):
            return str(value).lower()

        return str(value)