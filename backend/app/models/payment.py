from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database.session import Base
from app.models.bill import PaymentMethod, PaymentStatus


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    bill_id = Column(Integer, ForeignKey("bills.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    payment_method = Column(SQLEnum(PaymentMethod), nullable=False)
    transaction_ref = Column(String(100), nullable=True)
    payment_status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PAID, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    bill = relationship("Bill", back_populates="payments")
