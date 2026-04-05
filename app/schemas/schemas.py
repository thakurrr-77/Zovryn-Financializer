from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import date
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
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters long")

class UserOut(UserBase):
    id: int
    is_active: bool
    roles: List[RoleOut] = []

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
    date: Optional[date] = None
    description: Optional[str] = Field(None, max_length=500)

class FinancialRecordCreate(FinancialRecordBase):
    pass

class FinancialRecordUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0, description="Transaction amount must be strictly greater than 0")
    type: Optional[TransactionTypeModel] = None
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    date: Optional[date] = None
    description: Optional[str] = Field(None, max_length=500)

class FinancialRecordOut(FinancialRecordBase):
    id: int
    owner_id: Optional[int] = None

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
