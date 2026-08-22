import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database.session import Base


class TransactionType(str, enum.Enum):
    STOCK_IN = "STOCK_IN"
    SALE = "SALE"
    ADJUSTMENT = "ADJUSTMENT"


class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    transaction_type = Column(SQLEnum(TransactionType), nullable=False)
    quantity = Column(Integer, nullable=False)  # positive for stock in, negative for sale/adjustment
    reference_id = Column(String(100), nullable=True)  # e.g., Bill Number or Note
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    product = relationship("Product", back_populates="inventory_transactions")
