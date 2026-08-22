from datetime import datetime

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import (
    get_current_user,
    require_admin,
)
from app.db.session import get_db
from app.exceptions.common import ForbiddenException
from app.models.user import User
from app.schemas.response import (
    FormResponseCreate,
    FormResponseResponse,
    FormResponseUpdate,
)
from app.services.response_service import ResponseService


router = APIRouter(
    prefix="/responses",
    tags=["Responses"],
)

response_service = ResponseService()


# =========================================================
# PUBLIC FORM SUBMISSION
# =========================================================

@router.post(
    "/public/forms/{form_id}",
    response_model=FormResponseResponse,
    status_code=status.HTTP_201_CREATED,
)
def submit_public_response(
    form_id: int,
    data: FormResponseCreate,
    db: Session = Depends(get_db),
):
    return response_service.submit_response(
        db=db,
        form_id=form_id,
        data=data,
        current_user_id=None,
    )


# =========================================================
# AUTHENTICATED FORM SUBMISSION
# =========================================================

@router.post(
    "/forms/{form_id}",
    response_model=FormResponseResponse,
    status_code=status.HTTP_201_CREATED,
)
def submit_authenticated_response(
    form_id: int,
    data: FormResponseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return response_service.submit_response(
        db=db,
        form_id=form_id,
        data=data,
        current_user_id=current_user.id,
    )


# =========================================================
# GET MY RESPONSES
# =========================================================

@router.get(
    "/my",
    response_model=list[FormResponseResponse],
)
def get_my_responses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return response_service.get_user_responses(
        db=db,
        user_id=current_user.id,
    )


# =========================================================
# ADMIN - SEARCH AND FILTER RESPONSES
# =========================================================

@router.get(
    "/admin/all",
    response_model=list[FormResponseResponse],
)
def get_all_responses(
    search: str | None = Query(
        default=None,
        min_length=1,
    ),
    form_id: int | None = Query(
        default=None,
        gt=0,
    ),
    user_id: int | None = Query(
        default=None,
        gt=0,
    ),
    from_date: datetime | None = None,
    to_date: datetime | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return response_service.search_and_filter_responses(
        db=db,
        search=search,
        form_id=form_id,
        user_id=user_id,
        from_date=from_date,
        to_date=to_date,
    )


# =========================================================
# GET RESPONSES FOR A FORM
# =========================================================

@router.get(
    "/forms/{form_id}",
    response_model=list[FormResponseResponse],
)
def get_form_responses(
    form_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Admin can view all responses for the form
    if current_user.role.name == "Admin":
        return response_service.get_form_responses(
            db=db,
            form_id=form_id,
        )

    # Normal users can view only their own responses
    responses = response_service.get_form_responses(
        db=db,
        form_id=form_id,
    )

    return [
        response
        for response in responses
        if response.user_id == current_user.id
    ]


# =========================================================
# GET SINGLE RESPONSE
# =========================================================

@router.get(
    "/{response_id}",
    response_model=FormResponseResponse,
)
def get_response(
    response_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    response = response_service.get_response(
        db=db,
        response_id=response_id,
    )

    # Admin can view any response
    if current_user.role.name == "Admin":
        return response

    # Normal user can view only their own response
    if response.user_id != current_user.id:
        raise ForbiddenException(
            "You do not have permission to view this response."
        )

    return response


# =========================================================
# UPDATE RESPONSE
# =========================================================

@router.put(
    "/{response_id}",
    response_model=FormResponseResponse,
)
def update_response(
    response_id: int,
    data: FormResponseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_admin = current_user.role.name == "Admin"

    return response_service.update_response(
        db=db,
        response_id=response_id,
        data=data,
        current_user_id=current_user.id,
        is_admin=is_admin,
    )


# =========================================================
# DELETE RESPONSE
# =========================================================

@router.delete(
    "/{response_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_response(
    response_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    is_admin = current_user.role.name == "Admin"

    response_service.delete_response(
        db=db,
        response_id=response_id,
        current_user_id=current_user.id,
        is_admin=is_admin,
    )

    return None