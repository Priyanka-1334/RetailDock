from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field
from app.models.bill import PaymentMethod, PaymentStatus
from app.schemas.customer import CustomerResponse
from app.schemas.user import UserResponse
from app.schemas.product import ProductResponse


class BillItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)


class BillItemResponse(BaseModel):
    id: int
    product_id: Optional[int]
    quantity: int
    unit_price: Decimal
    subtotal: Decimal
    product: Optional[ProductResponse] = None

    class Config:
        from_attributes = True


class BillCreate(BaseModel):
    customer_id: Optional[int] = None
    items: List[BillItemCreate] = Field(..., min_items=1)
    discount_percentage: Decimal = Field(Decimal("0.00"), ge=Decimal("0.00"), le=Decimal("100.00"))
    gst_percentage: Decimal = Field(Decimal("0.00"), ge=Decimal("0.00"), le=Decimal("100.00"))
    payment_method: PaymentMethod = PaymentMethod.CASH


class PaymentResponse(BaseModel):
    id: int
    amount: Decimal
    payment_method: PaymentMethod
    payment_status: PaymentStatus
    transaction_ref: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class BillResponse(BaseModel):
    id: int
    bill_number: str
    customer_id: Optional[int] = None
    cashier_id: Optional[int] = None
    subtotal: Decimal
    discount_percentage: Decimal
    discount_amount: Decimal
    gst_percentage: Decimal
    gst_amount: Decimal
    total_amount: Decimal
    payment_method: PaymentMethod
    payment_status: PaymentStatus
    created_at: datetime
    
    customer: Optional[CustomerResponse] = None
    cashier: Optional[UserResponse] = None
    items: List[BillItemResponse] = []
    payments: List[PaymentResponse] = []

    class Config:
        from_attributes = True
