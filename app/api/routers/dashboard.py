from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.db import models
from app.schemas import schemas
from app.api import dependencies
from app.db.database import get_db

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/summary", response_model=schemas.DashboardSummaryOut, dependencies=[Depends(dependencies.has_viewer_access)])
def get_dashboard_summary(db: Session = Depends(get_db)):
    # Calculate Total Income
    total_income = db.query(func.sum(models.FinancialRecord.amount)).filter(models.FinancialRecord.type == "income").scalar() or 0.0
    
    # Calculate Total Expense
    total_expenses = db.query(func.sum(models.FinancialRecord.amount)).filter(models.FinancialRecord.type == "expense").scalar() or 0.0
    
    # Net Balance
    net_balance = total_income - total_expenses
    
    # Category-wise totals
    category_totals_query = db.query(
        models.FinancialRecord.category, 
        func.sum(models.FinancialRecord.amount).label("total")
    ).group_by(models.FinancialRecord.category).all()
    
    category_totals = [{"category": row.category, "total": row.total} for row in category_totals_query]
    
    # Recent activity - last 5 records
    recent_activity = db.query(models.FinancialRecord).order_by(models.FinancialRecord.date.desc(), models.FinancialRecord.id.desc()).limit(5).all()
    
    # Monthly Trends (grouped by Year-Month)
    # Using SQLAlchemy extract to safely group by year and month cross-database
    year_col = func.extract('year', models.FinancialRecord.date)
    month_col = func.extract('month', models.FinancialRecord.date)
    
    monthly_query = db.query(
        year_col.label('year'),
        month_col.label('month'),
        models.FinancialRecord.type,
        func.sum(models.FinancialRecord.amount).label('total')
    ).group_by('year', 'month', models.FinancialRecord.type).all()
    
    trends_dict = {}
    for row in monthly_query:
        # format month like "2024-05"
        month_str = f"{int(row.year)}-{int(row.month):02d}"
        if month_str not in trends_dict:
            trends_dict[month_str] = {"month": month_str, "income": 0.0, "expense": 0.0}
            
        if row.type == "income":
            trends_dict[month_str]["income"] = row.total
        else:
            trends_dict[month_str]["expense"] = row.total
            
    # Sort trends chronologically
    monthly_trends = [trends_dict[k] for k in sorted(trends_dict.keys())]
    
    return schemas.DashboardSummaryOut(
        total_income=total_income,
        total_expenses=total_expenses,
        net_balance=net_balance,
        category_totals=category_totals,
        recent_activity=recent_activity,
        monthly_trends=monthly_trends
    )
