from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.activity_log import ActivityLog
from app.repositories.activity_log_repository import ActivityLogRepository

from app.exceptions.common import (
    AlreadyExistsException,
    NotFoundException,
    BadRequestException,
)

from app.exceptions.messages import (
    FORM_NOT_FOUND,
    FIELD_NOT_FOUND,
    INVALID_FIELD_OPTIONS,
    INVALID_VALIDATION_RULE,
    INVALID_CONDITIONAL_FIELD,
)

from app.models.enums import FormFieldType
from app.models.field_option import FieldOption
from app.models.form import Form
from app.models.form_field import FormField

from app.repositories.field_option_repository import (
    FieldOptionRepository,
)
from app.repositories.form_field_repository import (
    FormFieldRepository,
)
from app.repositories.form_repository import (
    FormRepository,
)

from app.schemas.form import (
    FormCreate,
    FormFieldCreate,
    FormFieldUpdate,
    FormUpdate,
)


class FormService:

    def __init__(self) -> None:
        self.form_repository = FormRepository()
        self.form_field_repository = FormFieldRepository()
        self.field_option_repository = FieldOptionRepository()
        self.activity_log_repository = ActivityLogRepository()

    # =========================================================
    # FORM
    # =========================================================

    def get_form(
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

    def get_forms(
        self,
        db: Session,
    ) -> list[Form]:

        return self.form_repository.get_all(db)

    def get_forms_by_creator(
        self,
        db: Session,
        user_id: int,
    ) -> list[Form]:

        return self.form_repository.get_by_creator(
            db,
            user_id,
        )

    def create_form(
        self,
        db: Session,
        data: FormCreate,
        current_user_id: int,
    ) -> Form:

        # Validate complete form field configuration
        self._validate_fields(
            data.fields,
        )

        form = Form(
            title=data.title.strip(),
            description=data.description,
            is_active=data.is_active,
            is_public=data.is_public,
            created_by=current_user_id,
        )

        try:
            form = self.form_repository.create(
                db,
                form,
            )

            # -------------------------------------------------
            # Create all fields first
            # -------------------------------------------------

            field_map: dict[str, FormField] = {}

            for field_data in data.fields:

                field = self._create_field(
                    db,
                    form.id,
                    field_data,
                )

                field_map[field_data.client_key] = field

            # -------------------------------------------------
            # Resolve conditional fields
            #
            # conditional_field_key
            #          ↓
            # client_key
            #          ↓
            # FormField.id
            #          ↓
            # conditional_field_id
            # -------------------------------------------------

            for field_data in data.fields:

                if not field_data.is_conditional:
                    continue

                if not field_data.conditional_field_key:
                    raise BadRequestException(
                        INVALID_CONDITIONAL_FIELD
                    )

                conditional_field = field_map.get(
                    field_data.conditional_field_key
                )

                if conditional_field is None:
                    raise BadRequestException(
                        INVALID_CONDITIONAL_FIELD
                    )

                current_field = field_map.get(
                    field_data.client_key
                )

                if current_field is None:
                    raise BadRequestException(
                        INVALID_CONDITIONAL_FIELD
                    )

                # A field cannot depend on itself
                if (
                    current_field.id
                    == conditional_field.id
                ):
                    raise BadRequestException(
                        INVALID_CONDITIONAL_FIELD
                    )

                current_field.conditional_field_id = (
                    conditional_field.id
                )

            # -------------------------------------------------
            # Create field options
            # -------------------------------------------------

            for field_data in data.fields:
                field = field_map.get(
                    field_data.client_key
                )
                if field is None:
                    raise BadRequestException(
                        INVALID_CONDITIONAL_FIELD
                    )

                self._create_options(
                    db,
                    field.id,
                    field_data,
                )

            # -------------------------------------------------
            # ACTIVITY LOG
            # -------------------------------------------------

            self._create_log(
                db=db,
                action="CREATE_FORM",
                description=(
                    f"Form '{form.title}' "
                    f"(ID: {form.id}) was created."
                ),
                user_id=current_user_id,
            )

            db.commit()

        except Exception:
            db.rollback()
            raise

        return self.get_form(
            db,
            form.id,
        )

    def update_form(
        self,
        db: Session,
        form_id: int,
        data: FormUpdate,
        current_user_id: int,
    ) -> Form:

        form = self.get_form(
            db,
            form_id,
        )

        if data.title is not None:
            form.title = data.title.strip()

        if data.description is not None:
            form.description = data.description

        if data.is_active is not None:
            form.is_active = data.is_active

        if data.is_public is not None:
            form.is_public = data.is_public

        try:
            form = self.form_repository.update(
                db,
                form,
            )
            
            # -------------------------------------------------
            # ACTIVITY LOG
            # -------------------------------------------------

            self._create_log(
                db=db,
                action="UPDATE_FORM",
                description=(
                    f"Form '{form.title}' "
                    f"(ID: {form.id}) was updated."
                ),
                user_id=current_user_id,
            )

            db.commit()

        except Exception:
            db.rollback()
            raise

        return self.get_form(
            db,
            form.id,
        )

    def delete_form(
        self,
        db: Session,
        form_id: int,
        current_user_id: int,
    ) -> None:

        form = self.get_form(
            db,
            form_id,
        )

        form_title = form.title
        deleted_form_id = form.id

        try:
            self.form_repository.delete(
                db,
                form,
            )

            # -------------------------------------------------
            # ACTIVITY LOG
            # -------------------------------------------------

            self._create_log(
                db=db,
                action="DELETE_FORM",
                description=(
                    f"Form '{form_title}' "
                    f"(ID: {deleted_form_id}) was deleted."
                ),
                user_id=current_user_id,
            )

            db.commit()

        except Exception:
            db.rollback()
            raise

    def update_form_status(
        self,
        db: Session,
        form_id: int,
        is_active: bool,
        current_user_id: int,
    ) -> Form:

        form = self.get_form(
            db,
            form_id,
        )

        form.is_active = is_active

        try:
            self.form_repository.update(
                db,
                form,
            )

            # -------------------------------------------------
            # ACTIVITY LOG
            # -------------------------------------------------

            status = "activated" if is_active else "deactivated"

            self._create_log(
                db=db,
                action="UPDATE_FORM_STATUS",
                description=(
                    f"Form '{form.title}' "
                    f"(ID: {form.id}) was {status}."
                ),
                user_id=current_user_id,
            )

            db.commit()

        except Exception:
            db.rollback()
            raise

        return self.get_form(
            db,
            form.id,
        )

    # =========================================================
    # FIELD
    # =========================================================

    def add_field(
        self,
        db: Session,
        form_id: int,
        data: FormFieldCreate,
        current_user_id: int,
    ) -> FormField:

        form = self.get_form(
            db,
            form_id,
        )

        # Validate the field itself
        self._validate_field(
            data,
            existing_form=form,
        )

        # -----------------------------------------------------
        # Check client_key uniqueness inside this form
        # -----------------------------------------------------

        existing_fields = (
            self.form_field_repository.get_by_form_id(
                db,
                form.id,
            )
        )

        for existing_field in existing_fields:

            if (
                existing_field.client_key
                == data.client_key
            ):
                raise AlreadyExistsException(
                    "Field client_key already exists in this form."
                )

        try:

            field = self._create_field(
                db,
                form.id,
                data,
            )

            # -------------------------------------------------
            # Resolve conditional field key
            # -------------------------------------------------

            if data.is_conditional:

                if not data.conditional_field_key:
                    raise BadRequestException(
                        INVALID_CONDITIONAL_FIELD
                    )

                conditional_field = (
                    self.form_field_repository.get_by_client_key(
                        db,
                        form.id,
                        data.conditional_field_key,
                    )
                )

                if conditional_field is None:
                    raise NotFoundException(
                        FIELD_NOT_FOUND
                    )

                if conditional_field.id == field.id:
                    raise BadRequestException(
                        INVALID_CONDITIONAL_FIELD
                    )

                field.conditional_field_id = (
                    conditional_field.id
                )

            self._create_options(
                db,
                field.id,
                data,
            )
            self._create_log(
                db=db,
                action="CREATE_FORM_FIELD",
                description=(
                    f"Field '{field.label}' "
                    f"(ID: {field.id}) was added "
                    f"to form '{form.title}' (ID: {form.id})."
                ),
                user_id=current_user_id,
            )

            db.commit()

        except Exception:
            db.rollback()
            raise

        created_field = (
            self.form_field_repository.get_by_id(
                db,
                field.id,
            )
        )

        if created_field is None:
            raise NotFoundException(
                FIELD_NOT_FOUND
            )

        return created_field

    def update_field(
        self,
        db: Session,
        form_id: int,
        field_id: int,
        data: FormFieldUpdate,
        current_user_id: int,
    ) -> FormField:

        form = self.get_form(
            db,
            form_id,
        )

        field = self.form_field_repository.get_by_id(
            db,
            field_id,
        )

        if field is None:
            raise NotFoundException(
                FIELD_NOT_FOUND
            )

        if field.form_id != form.id:
            raise NotFoundException(
                FIELD_NOT_FOUND
            )

        # =====================================================
        # Resolve final values before validation
        # =====================================================

        field_type = (
            data.field_type
            if data.field_type is not None
            else field.field_type
        )

        is_conditional = (
            data.is_conditional
            if data.is_conditional is not None
            else field.is_conditional
        )

        conditional_field_key = (
            data.conditional_field_key
            if data.conditional_field_key is not None
            else None
        )

        min_length = (
            data.min_length
            if data.min_length is not None
            else field.min_length
        )

        max_length = (
            data.max_length
            if data.max_length is not None
            else field.max_length
        )

        min_value = (
            data.min_value
            if data.min_value is not None
            else field.min_value
        )

        max_value = (
            data.max_value
            if data.max_value is not None
            else field.max_value
        )

        # =====================================================
        # Validate validation rules
        # =====================================================

        self._validate_validation_rules(
            field_type=field_type,
            min_length=min_length,
            max_length=max_length,
            min_value=min_value,
            max_value=max_value,
        )

        # =====================================================
        # Validate conditional field
        # =====================================================

        conditional_field = None

        if is_conditional:

            if not conditional_field_key:
                raise BadRequestException(
                    INVALID_CONDITIONAL_FIELD
                )

            conditional_field = (
                self.form_field_repository.get_by_client_key(
                    db,
                    form.id,
                    conditional_field_key,
                )
            )

            if conditional_field is None:
                raise NotFoundException(
                    FIELD_NOT_FOUND
                )

            if conditional_field.id == field.id:
                raise BadRequestException(
                    INVALID_CONDITIONAL_FIELD
                )

        # =====================================================
        # Validate client_key uniqueness
        # =====================================================

        # client_key is not updateable through FormFieldUpdate.
        # It remains stable after field creation.

        # =====================================================
        # Apply updates
        # =====================================================

        if data.label is not None:
            field.label = data.label.strip()

        if data.field_type is not None:
            field.field_type = data.field_type

        if data.placeholder is not None:
            field.placeholder = data.placeholder

        if data.help_text is not None:
            field.help_text = data.help_text

        if data.is_required is not None:
            field.is_required = data.is_required

        if data.display_order is not None:
            field.display_order = data.display_order

        if data.min_length is not None:
            field.min_length = data.min_length

        if data.max_length is not None:
            field.max_length = data.max_length

        if data.min_value is not None:
            field.min_value = data.min_value

        if data.max_value is not None:
            field.max_value = data.max_value

        if data.is_conditional is not None:
            field.is_conditional = data.is_conditional

        if is_conditional:

            if conditional_field is None:
                raise BadRequestException(
                    INVALID_CONDITIONAL_FIELD
                )

            field.conditional_field_id = (
                conditional_field.id
            )

        else:
            # If conditional logic is disabled,
            # remove the old relationship.
            field.conditional_field_id = None
            field.conditional_operator = None
            field.conditional_value = None

        if data.conditional_operator is not None:
            field.conditional_operator = (
                data.conditional_operator.value
            )

        if data.conditional_value is not None:
            field.conditional_value = (
                data.conditional_value
            )

        try:

            self.form_field_repository.update(
                db,
                field,
            )
            self._create_log(
                db=db,
                action="UPDATE_FORM_FIELD",
                description=(
                    f"Field '{field.label}' "
                    f"(ID: {field.id}) in form "
                    f"'{form.title}' (ID: {form.id}) was updated."
                ),
                user_id=current_user_id,
            )

            db.commit()

        except Exception:
            db.rollback()
            raise

        updated_field = (
            self.form_field_repository.get_by_id(
                db,
                field.id,
            )
        )

        if updated_field is None:
            raise NotFoundException(
                FIELD_NOT_FOUND
            )

        return updated_field

    def delete_field(
        self,
        db: Session,
        form_id: int,
        field_id: int,
        current_user_id: int,
    ) -> None:

        form = self.get_form(
            db,
            form_id,
        )

        field = self.form_field_repository.get_by_id(
            db,
            field_id,
        )

        if field is None or field.form_id != form.id:
            raise NotFoundException(
                FIELD_NOT_FOUND
            )

        # -----------------------------------------------------
        # Capture values before deleting the field
        # -----------------------------------------------------

        field_label = field.label
        deleted_field_id = field.id

        try:
            self.form_field_repository.delete(
                db,
                field,
            )

            # -------------------------------------------------
            # ACTIVITY LOG
            # -------------------------------------------------

            self._create_log(
                db=db,
                action="DELETE_FORM_FIELD",
                description=(
                    f"Field '{field_label}' "
                    f"(ID: {deleted_field_id}) was deleted "
                    f"from form '{form.title}' (ID: {form.id})."
                ),
                user_id=current_user_id,
            )

            db.commit()

        except Exception:
            db.rollback()
            raise

    # =========================================================
    # PRIVATE FIELD CREATION
    # =========================================================

    def _create_field(
        self,
        db: Session,
        form_id: int,
        data: FormFieldCreate,
    ) -> FormField:

        field = FormField(
            form_id=form_id,
            client_key=data.client_key.strip(),
            label=data.label.strip(),
            field_type=data.field_type,
            placeholder=data.placeholder,
            help_text=data.help_text,
            is_required=data.is_required,
            display_order=data.display_order,
            min_length=data.min_length,
            max_length=data.max_length,
            min_value=data.min_value,
            max_value=data.max_value,
            is_conditional=data.is_conditional,
            conditional_operator=(
                data.conditional_operator.value
                if data.conditional_operator
                else None
            ),
            conditional_value=data.conditional_value,
        )

        return self.form_field_repository.create(
            db,
            field,
        )

    def _create_options(
        self,
        db: Session,
        field_id: int,
        data: FormFieldCreate,
    ) -> None:

        for option_data in data.options:

            option = FieldOption(
                field_id=field_id,
                label=option_data.label.strip(),
                value=option_data.value.strip(),
                display_order=option_data.display_order,
            )

            self.field_option_repository.create(
                db,
                option,
            )

    # =========================================================
    # VALIDATION
    # =========================================================

    def _validate_fields(
        self,
        fields: list[FormFieldCreate],
    ) -> None:

        # -----------------------------------------------------
        # client_key must be unique inside one form
        # -----------------------------------------------------

        client_keys = [
            field.client_key.strip()
            for field in fields
        ]

        if len(client_keys) != len(set(client_keys)):
            raise AlreadyExistsException(
                "Field client_key must be unique."
            )

        # -----------------------------------------------------
        # display_order must be unique
        # -----------------------------------------------------

        display_orders = [
            field.display_order
            for field in fields
        ]

        if len(display_orders) != len(
            set(display_orders)
        ):
            raise AlreadyExistsException(
                "Field display order must be unique."
            )

        # -----------------------------------------------------
        # Validate each field
        # -----------------------------------------------------

        for field in fields:
            self._validate_field(
                field,
            )

        # -----------------------------------------------------
        # Validate conditional references
        # -----------------------------------------------------

        available_keys = set(client_keys)

        for field in fields:

            if not field.is_conditional:
                continue

            if not field.conditional_field_key:
                raise BadRequestException(
                    INVALID_CONDITIONAL_FIELD
                )

            if (
                field.conditional_field_key
                not in available_keys
            ):
                raise BadRequestException(
                    INVALID_CONDITIONAL_FIELD
                )

            # A field cannot depend on itself
            if (
                field.conditional_field_key
                == field.client_key
            ):
                raise BadRequestException(
                    INVALID_CONDITIONAL_FIELD
                )

    def _validate_field(
        self,
        field: FormFieldCreate,
        existing_form: Form | None = None,
    ) -> None:

        option_types = {
            FormFieldType.DROPDOWN,
            FormFieldType.RADIO,
            FormFieldType.CHECKBOX,
        }

        if field.field_type in option_types:

            if not field.options:
                raise BadRequestException(
                    INVALID_FIELD_OPTIONS
                )

        else:

            if field.options:
                raise BadRequestException(
                    INVALID_FIELD_OPTIONS
                )

        # -----------------------------------------------------
        # Validation rules
        # -----------------------------------------------------

        self._validate_validation_rules(
            field_type=field.field_type,
            min_length=field.min_length,
            max_length=field.max_length,
            min_value=field.min_value,
            max_value=field.max_value,
        )

        # -----------------------------------------------------
        # Conditional validation
        # -----------------------------------------------------

        if field.is_conditional:

            if not field.conditional_field_key:
                raise BadRequestException(
                    INVALID_CONDITIONAL_FIELD
                )

            if (
                field.conditional_field_key
                == field.client_key
            ):
                raise BadRequestException(
                    INVALID_CONDITIONAL_FIELD
                )

    def _validate_validation_rules(
        self,
        field_type: FormFieldType,
        min_length: int | None,
        max_length: int | None,
        min_value: float | None,
        max_value: float | None,
    ) -> None:

        # -----------------------------------------------------
        # Length range
        # -----------------------------------------------------

        if (
            min_length is not None
            and max_length is not None
            and min_length > max_length
        ):
            raise BadRequestException(
                INVALID_VALIDATION_RULE
            )

        # -----------------------------------------------------
        # Numeric range
        # -----------------------------------------------------

        if (
            min_value is not None
            and max_value is not None
            and min_value > max_value
        ):
            raise BadRequestException(
                INVALID_VALIDATION_RULE
            )

        # -----------------------------------------------------
        # Length rules are only allowed for text/email
        # -----------------------------------------------------

        length_types = {
            FormFieldType.TEXT,
            FormFieldType.EMAIL,
        }

        if field_type not in length_types:

            if (
                min_length is not None
                or max_length is not None
            ):
                raise BadRequestException(
                    INVALID_VALIDATION_RULE
                )

        # -----------------------------------------------------
        # Numeric rules are only allowed for number/rating
        # -----------------------------------------------------

        numeric_types = {
            FormFieldType.NUMBER,
            FormFieldType.RATING,
        }

        if field_type not in numeric_types:

            if (
                min_value is not None
                or max_value is not None
            ):
                raise BadRequestException(
                    INVALID_VALIDATION_RULE
                )

    def _validate_conditional_field(
        self,
        db: Session,
        form_id: int,
        field_id: int,
        conditional_field_id: int | None,
    ) -> None:

        if conditional_field_id is None:
            raise BadRequestException(
                INVALID_CONDITIONAL_FIELD
            )

        if field_id == conditional_field_id:
            raise BadRequestException(
                INVALID_CONDITIONAL_FIELD
            )

        conditional_field = (
            self.form_field_repository.get_by_id(
                db,
                conditional_field_id,
            )
        )

        if conditional_field is None:
            raise NotFoundException(
                FIELD_NOT_FOUND
            )

        if conditional_field.form_id != form_id:
            raise BadRequestException(
                INVALID_CONDITIONAL_FIELD
            )
    # =========================================================
    # PRIVATE - ACTIVITY LOG
    # =========================================================

    def _create_log(
        self,
        db: Session,
        action: str,
        description: str | None = None,
        user_id: int | None = None,
    ) -> ActivityLog:

        activity_log = ActivityLog(
            user_id=user_id,
            response_id=None,
            action=action,
            description=description,
            created_at=datetime.now(timezone.utc),
        )

        return self.activity_log_repository.create(
            db,
            activity_log,
        )