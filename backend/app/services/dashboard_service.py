from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session
from app.exceptions.common import BadRequestException

from app.repositories.dashboard_repository import DashboardRepository
from app.schemas.dashboard import (
    DashboardResponse,
    DashboardSummaryResponse,
    DashboardResponseAnalytics,
    FrequentlyUsedForm,
    FrequentlyUsedFormsResponse,
    SubmissionTrendItem,
    SubmissionTrendsResponse,
)


class DashboardService:

    def __init__(self) -> None:
        self.dashboard_repository = DashboardRepository()

    # =========================================================
    # DATE HELPERS
    # =========================================================

    def _get_current_periods(
        self,
    ) -> tuple[datetime, datetime, datetime, datetime]:

        now = datetime.now(timezone.utc)

        # -----------------------------------------------------
        # Start of today
        # -----------------------------------------------------

        start_of_today = datetime(
            now.year,
            now.month,
            now.day,
            tzinfo=timezone.utc,
        )

        # -----------------------------------------------------
        # Start of week
        #
        # Monday = start of week
        # -----------------------------------------------------

        start_of_week = (
            start_of_today
            - timedelta(
                days=start_of_today.weekday()
            )
        )

        # -----------------------------------------------------
        # Start of month
        # -----------------------------------------------------

        start_of_month = datetime(
            now.year,
            now.month,
            1,
            tzinfo=timezone.utc,
        )

        return (
            now,
            start_of_today,
            start_of_week,
            start_of_month,
        )

    # =========================================================
    # DASHBOARD SUMMARY
    # =========================================================

    def get_dashboard_summary(
        self,
        db: Session,
    ) -> DashboardSummaryResponse:

        total_forms = (
            self.dashboard_repository.get_total_forms(
                db,
            )
        )

        total_responses = (
            self.dashboard_repository.get_total_responses(
                db,
            )
        )

        return DashboardSummaryResponse(
            total_forms=total_forms,
            total_responses=total_responses,
        )

    # =========================================================
    # RESPONSE ANALYTICS
    # =========================================================

    def get_response_analytics(
        self,
        db: Session,
    ) -> DashboardResponseAnalytics:

        (
            now,
            start_of_today,
            start_of_week,
            start_of_month,
        ) = self._get_current_periods()

        # -----------------------------------------------------
        # Today
        # -----------------------------------------------------

        responses_today = (
            self.dashboard_repository
            .get_responses_between_dates(
                db,
                from_date=start_of_today,
                to_date=now,
            )
        )

        # -----------------------------------------------------
        # This week
        # -----------------------------------------------------

        responses_this_week = (
            self.dashboard_repository
            .get_responses_between_dates(
                db,
                from_date=start_of_week,
                to_date=now,
            )
        )

        # -----------------------------------------------------
        # This month
        # -----------------------------------------------------

        responses_this_month = (
            self.dashboard_repository
            .get_responses_between_dates(
                db,
                from_date=start_of_month,
                to_date=now,
            )
        )

        return DashboardResponseAnalytics(
            responses_today=responses_today,
            responses_this_week=responses_this_week,
            responses_this_month=responses_this_month,
        )

    # =========================================================
    # MOST FREQUENTLY USED FORMS
    # =========================================================

    def get_most_used_forms(
        self,
        db: Session,
        limit: int = 5,
    ) -> FrequentlyUsedFormsResponse:

        rows = (
            self.dashboard_repository.get_most_used_forms(
                db,
                limit=limit,
            )
        )

        forms = [
            FrequentlyUsedForm(
                form_id=form_id,
                form_title=form_title,
                response_count=response_count,
            )
            for (
                form_id,
                form_title,
                response_count,
            ) in rows
        ]

        return FrequentlyUsedFormsResponse(
            forms=forms,
        )

    # =========================================================
    # SUBMISSION TRENDS
    # =========================================================

    def get_submission_trends(
        self,
        db: Session,
        from_date: datetime | None = None,
        to_date: datetime | None = None,
    ) -> SubmissionTrendsResponse:

        # -----------------------------------------------------
        # Default date range
        #
        # If dates are not provided, use current month.
        # -----------------------------------------------------

        now = datetime.now(timezone.utc)

        if from_date is None:
            from_date = datetime(
                now.year,
                now.month,
                1,
                tzinfo=timezone.utc,
            )

        if to_date is None:
            to_date = now

        # -----------------------------------------------------
        # Validate date range
        # -----------------------------------------------------

        if from_date > to_date:
            raise BadRequestException(
                "from_date cannot be greater than to_date."
            )

        # -----------------------------------------------------
        # Get trend data
        # -----------------------------------------------------

        rows = (
            self.dashboard_repository
            .get_submission_trend(
                db,
                from_date=from_date,
                to_date=to_date,
            )
        )

        data = [
            SubmissionTrendItem(
                date=str(date),
                count=count,
            )
            for date, count in rows
        ]

        return SubmissionTrendsResponse(
            from_date=from_date,
            to_date=to_date,
            data=data,
        )

    # =========================================================
    # COMPLETE DASHBOARD
    # =========================================================

    def get_dashboard(
        self,
        db: Session,
    ) -> DashboardResponse:

        # -----------------------------------------------------
        # Summary
        # -----------------------------------------------------

        summary = self.get_dashboard_summary(
            db,
        )

        # -----------------------------------------------------
        # Response analytics
        # -----------------------------------------------------

        response_analytics = self.get_response_analytics(
            db,
        )

        # -----------------------------------------------------
        # Most frequently used forms
        # -----------------------------------------------------

        most_used = self.get_most_used_forms(
            db,
            limit=5,
        )

        # -----------------------------------------------------
        # Submission trends
        #
        # Default = current month
        # -----------------------------------------------------

        submission_trends_response = (
            self.get_submission_trends(
                db,
            )
        )

        # -----------------------------------------------------
        # Final response
        # -----------------------------------------------------

        return DashboardResponse(
            total_forms=summary.total_forms,
            total_responses=summary.total_responses,
            response_analytics=response_analytics,
            most_frequently_used_forms=(
                most_used.forms
            ),
            submission_trends=(
                submission_trends_response.data
            ),
        )