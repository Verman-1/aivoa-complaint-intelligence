from datetime import datetime
from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base

class Complaint(Base):
    __tablename__ = "complaints"
    id: Mapped[int] = mapped_column(primary_key=True)
    complaint_no: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    source: Mapped[str] = mapped_column(String(40), default="Email")
    customer: Mapped[str] = mapped_column(String(200))
    product: Mapped[str] = mapped_column(String(200))
    strength: Mapped[str] = mapped_column(String(100), default="")
    batch: Mapped[str] = mapped_column(String(100), index=True)
    complaint_type: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(Text)
    severity: Mapped[str] = mapped_column(String(20), default="Major")
    priority: Mapped[str] = mapped_column(String(20), default="High")
    status: Mapped[str] = mapped_column(String(40), default="Open")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
