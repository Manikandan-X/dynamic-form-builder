from fastapi import APIRouter, Depends, status

from sqlalchemy.orm import Session

from app.db.session import get_db

from app.api.dependencies import (
    get_current_user,
    require_admin,
)

from app.models.user import User

from app.schemas.form import (
    FormCreate,
    FormResponse,
    FormUpdate,
    FormFieldCreate,
    FormFieldResponse,
    FormFieldUpdate,
)

from app.services.form_service import FormService


router = APIRouter(
    prefix="/forms",
    tags=["Forms"],
)

form_service = FormService()


# =========================================================
# FORM ENDPOINTS
# =========================================================


@router.post(
    "",
    response_model=FormResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_form(
    data: FormCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return form_service.create_form(
        db=db,
        data=data,
        current_user_id=current_user.id,
    )


@router.get(
    "",
    response_model=list[FormResponse],
)
def get_forms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return form_service.get_forms(db)


@router.get(
    "/my",
    response_model=list[FormResponse],
)
def get_my_forms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return form_service.get_forms_by_creator(
        db=db,
        user_id=current_user.id,
    )


@router.get(
    "/{form_id}",
    response_model=FormResponse,
)
def get_form(
    form_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return form_service.get_form(
        db=db,
        form_id=form_id,
    )


@router.put(
    "/{form_id}",
    response_model=FormResponse,
)
def update_form(
    form_id: int,
    data: FormUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return form_service.update_form(
        db=db,
        form_id=form_id,
        data=data,
        current_user_id=current_user.id,
    )


@router.delete(
    "/{form_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_form(
    form_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    form_service.delete_form(
        db=db,
        form_id=form_id,
        current_user_id=current_user.id,
    )


@router.patch(
    "/{form_id}/status",
    response_model=FormResponse,
)
def update_form_status(
    form_id: int,
    is_active: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return form_service.update_form_status(
        db=db,
        form_id=form_id,
        is_active=is_active,
        current_user_id=current_user.id,
    )


# =========================================================
# FIELD ENDPOINTS
# =========================================================


@router.post(
    "/{form_id}/fields",
    response_model=FormFieldResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_field(
    form_id: int,
    data: FormFieldCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return form_service.add_field(
        db=db,
        form_id=form_id,
        data=data,
        current_user_id=current_user.id,
    )


@router.put(
    "/{form_id}/fields/{field_id}",
    response_model=FormFieldResponse,
)
def update_field(
    form_id: int,
    field_id: int,
    data: FormFieldUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return form_service.update_field(
        db=db,
        form_id=form_id,
        field_id=field_id,
        data=data,
        current_user_id=current_user.id,
    )


@router.delete(
    "/{form_id}/fields/{field_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_field(
    form_id: int,
    field_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    form_service.delete_field(
        db=db,
        form_id=form_id,
        field_id=field_id,
        current_user_id=current_user.id,
    )