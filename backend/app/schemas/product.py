from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.category import CategoryResponse


class ProductBase(BaseModel):
    product_code: str = Field(..., min_length=2, max_length=50)
    name: str = Field(..., min_length=2, max_length=150)
    category_id: Optional[int] = None
    description: Optional[str] = None
    cost_price: Decimal = Field(..., ge=Decimal("0.00"))
    selling_price: Decimal = Field(..., ge=Decimal("0.00"))
    quantity: int = Field(0, ge=0)
    low_stock_threshold: int = Field(10, ge=0)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    product_code: Optional[str] = Field(None, min_length=2, max_length=50)
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    category_id: Optional[int] = None
    description: Optional[str] = None
    cost_price: Optional[Decimal] = Field(None, ge=Decimal("0.00"))
    selling_price: Optional[Decimal] = Field(None, ge=Decimal("0.00"))
    quantity: Optional[int] = Field(None, ge=0)
    low_stock_threshold: Optional[int] = Field(None, ge=0)


class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime
    is_low_stock: bool = False
    category: Optional[CategoryResponse] = None

    class Config:
        from_attributes = True
