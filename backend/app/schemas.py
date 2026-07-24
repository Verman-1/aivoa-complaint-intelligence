from datetime import datetime
from pydantic import BaseModel, ConfigDict

class ComplaintCreate(BaseModel):
    source: str = "Email"
    customer: str
    product: str
    strength: str = ""
    batch: str
    complaint_type: str
    description: str
    severity: str = "Major"
    priority: str = "High"

class ComplaintRead(ComplaintCreate):
    id: int
    complaint_no: str
    status: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class AnalysisRequest(BaseModel):
    tool: str
    question: str | None = None

class AnalysisResponse(BaseModel):
    tool: str
    result: str
    model: str
    used_llm: bool
