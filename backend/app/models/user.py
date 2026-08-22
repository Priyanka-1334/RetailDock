import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Enum as SQLEnum, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.database.session import Base


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    CASHIER = "CASHIER"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.CASHIER, nullable=False)
    full_name = Column(String(100), nullable=True)
    email = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    bills = relationship("Bill", back_populates="cashier")
