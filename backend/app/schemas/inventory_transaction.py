from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.inventory_transaction import TransactionType
from app.schemas.product import ProductResponse


class StockInRequest(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)
    note: Optional[str] = None


class StockAdjustRequest(BaseModel):
    product_id: int
    quantity_change: int = Field(...)  # can be positive or negative
    reason: Optional[str] = None


class InventoryTransactionResponse(BaseModel):
    id: int
    product_id: int
    transaction_type: TransactionType
    quantity: int
    reference_id: Optional[str] = None
    created_at: datetime
    product: Optional[ProductResponse] = None

    class Config:
        from_attributes = True
