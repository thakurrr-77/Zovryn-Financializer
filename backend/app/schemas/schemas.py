from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import date as dt_date, datetime
from enum import Enum

class TransactionTypeModel(str, Enum):
    income = "income"
    expense = "expense"

class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoleCreate(RoleBase):
    pass

class RoleOut(RoleBase):
    id: int
    class Config:
        from_attributes = True

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Username must be between 3 and 50 characters")
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=72, description="Password must be at least 6 characters and cannot exceed 72 due to algorithm limits")

class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=6, max_length=72)

class UserOut(UserBase):
    id: int
    is_active: bool
    roles: List[RoleOut] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class FinancialRecordBase(BaseModel):
    amount: float = Field(..., gt=0, description="Transaction amount must be strictly greater than 0")
    type: TransactionTypeModel
    category: str = Field(..., min_length=1, max_length=100)
    date: Optional[dt_date] = None
    description: Optional[str] = Field(None, max_length=500)
    currency: str = Field("USD", max_length=10)
    payment_method: Optional[str] = Field(None, max_length=50)
    tags: Optional[str] = Field(None, max_length=200)

class FinancialRecordCreate(FinancialRecordBase):
    owner_id: Optional[int] = Field(None, description="The user to associate this record with (Admin only)")
    pass

class FinancialRecordUpdate(BaseModel):
    owner_id: Optional[int] = Field(None, description="Re-associate record with a different user (Admin only)")
    amount: Optional[float] = Field(None, gt=0)
    type: Optional[TransactionTypeModel] = None
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    date: Optional[dt_date] = None
    description: Optional[str] = Field(None, max_length=500)
    currency: Optional[str] = Field(None, max_length=10)
    payment_method: Optional[str] = Field(None, max_length=50)
    tags: Optional[str] = Field(None, max_length=200)

class FinancialRecordOut(FinancialRecordBase):
    id: int
    owner_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CategoryTotal(BaseModel):
    category: str
    total: float

class MonthlyTrend(BaseModel):
    month: str
    income: float
    expense: float

class DashboardSummaryOut(BaseModel):
    total_income: float
    total_expenses: float
    net_balance: float
    category_totals: List[CategoryTotal]
    recent_activity: List[FinancialRecordOut]
    monthly_trends: List[MonthlyTrend]
