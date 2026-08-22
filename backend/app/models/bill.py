import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database.session import Base


class PaymentMethod(str, enum.Enum):
    CASH = "CASH"
    UPI = "UPI"
    CARD = "CARD"


class PaymentStatus(str, enum.Enum):
    PAID = "PAID"
    PENDING = "PENDING"


class Bill(Base):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    bill_number = Column(String(50), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="SET NULL"), nullable=True)
    cashier_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    subtotal = Column(Numeric(12, 2), nullable=False)
    discount_percentage = Column(Numeric(5, 2), default=0.00, nullable=False)
    discount_amount = Column(Numeric(12, 2), default=0.00, nullable=False)
    gst_percentage = Column(Numeric(5, 2), default=0.00, nullable=False)
    gst_amount = Column(Numeric(12, 2), default=0.00, nullable=False)
    total_amount = Column(Numeric(12, 2), nullable=False)
    
    payment_method = Column(SQLEnum(PaymentMethod), default=PaymentMethod.CASH, nullable=False)
    payment_status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PAID, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    customer = relationship("Customer", back_populates="bills")
    cashier = relationship("User", back_populates="bills")
    items = relationship("BillItem", back_populates="bill", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="bill", cascade="all, delete-orphan")
