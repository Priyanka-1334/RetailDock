from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class CustomerBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None


class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
