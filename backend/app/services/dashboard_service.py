from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db import models
from app.schemas import schemas


class DashboardService:
    @staticmethod
    def get_summary(
        db: Session,
        user: models.User,
        is_admin: bool = False,
        global_view: bool = False,
    ) -> schemas.DashboardSummaryOut:
        """
        Build an aggregated dashboard summary.

        Scope rules:
        - Viewer / Analyst → always personal data only.
        - Admin + global_view=True → aggregate across all users.
        - Admin + global_view=False → personal data (same as others).
        """
        # ── Base query (excludes soft-deleted records) ────────────────────────
        base_query = db.query(models.FinancialRecord).filter(
            models.FinancialRecord.is_deleted == False  # noqa: E712
        )

        if not (is_admin and global_view):
            base_query = base_query.filter(
                models.FinancialRecord.owner_id == user.id
            )

        # ── 1. Income / Expense aggregates ────────────────────────────────────
        total_income = (
            base_query.filter(
                models.FinancialRecord.type == models.TransactionType.income
            )
            .with_entities(func.sum(models.FinancialRecord.amount))
            .scalar()
            or 0.0
        )

        total_expenses = (
            base_query.filter(
                models.FinancialRecord.type == models.TransactionType.expense
            )
            .with_entities(func.sum(models.FinancialRecord.amount))
            .scalar()
            or 0.0
        )

        # ── 2. Category-wise totals ───────────────────────────────────────────
        category_rows = (
            base_query.with_entities(
                models.FinancialRecord.category,
                func.sum(models.FinancialRecord.amount).label("total"),
            )
            .group_by(models.FinancialRecord.category)
            .all()
        )
        category_totals = [
            {"category": row.category, "total": row.total}
            for row in category_rows
        ]

        # ── 3. Monthly trends (Python-side aggregation — DB-agnostic) ─────────
        #
        # We deliberately fetch (date, type, amount) tuples and group in Python
        # instead of using DB-specific functions like PostgreSQL's to_char().
        # This makes the service compatible with both PostgreSQL (production)
        # and SQLite (test environment).
        trend_rows = (
            base_query.filter(models.FinancialRecord.date.isnot(None))
            .with_entities(
                models.FinancialRecord.date,
                models.FinancialRecord.type,
                models.FinancialRecord.amount,
            )
            .all()
        )

        trends_map: dict = {}
        for row in trend_rows:
            month_key = row.date.strftime("%Y-%m")
            if month_key not in trends_map:
                trends_map[month_key] = {
                    "month": month_key,
                    "income": 0.0,
                    "expense": 0.0,
                }
            if row.type == models.TransactionType.income:
                trends_map[month_key]["income"] += row.amount
            else:
                trends_map[month_key]["expense"] += row.amount

        monthly_trends = sorted(trends_map.values(), key=lambda x: x["month"])

        # ── 4. Recent activity ────────────────────────────────────────────────
        recent = (
            base_query.order_by(
                models.FinancialRecord.date.desc(),
                models.FinancialRecord.id.desc(),
            )
            .limit(10)
            .all()
        )

        return schemas.DashboardSummaryOut(
            total_income=total_income,
            total_expenses=total_expenses,
            net_balance=total_income - total_expenses,
            category_totals=category_totals,
            recent_activity=recent,
            monthly_trends=monthly_trends,
        )
