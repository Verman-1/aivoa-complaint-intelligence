from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.orm import Session
from .ai_graph import run_analysis
from .database import Base, engine, get_db, SessionLocal
from .models import Complaint
from .schemas import AnalysisRequest, AnalysisResponse, ComplaintCreate, ComplaintRead
from .settings import settings

@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Complaint).count() == 0:
            seed_items = [
                Complaint(
                    complaint_no="CC-2026-1048",
                    source="Email",
                    customer="MedPlus Distribution",
                    product="Cardiostat",
                    strength="20 mg",
                    batch="CS24A118",
                    complaint_type="Product quality",
                    description="Multiple tablets found with chipped edges and powder residue inside sealed blister packs.",
                    severity="Critical",
                    priority="Urgent",
                    status="Under Investigation"
                ),
                Complaint(
                    complaint_no="CC-2026-1047",
                    source="Email",
                    customer="CityCare Pharmacy",
                    product="Azithrox",
                    strength="500 mg",
                    batch="AZ24F042",
                    complaint_type="Packaging",
                    description="Carton label has a faint batch number and is difficult to read.",
                    severity="Major",
                    priority="High",
                    status="Pending Review"
                ),
                Complaint(
                    complaint_no="CC-2026-1046",
                    source="Email",
                    customer="NorthStar Hospital",
                    product="Metformin XR",
                    strength="500 mg",
                    batch="MX24C201",
                    complaint_type="Adverse event",
                    description="Patient reported unexpected nausea after switching to the latest batch.",
                    severity="Major",
                    priority="High",
                    status="Open"
                ),
                Complaint(
                    complaint_no="CC-2026-1045",
                    source="Email",
                    customer="Wellness Retail",
                    product="Paraclear",
                    strength="650 mg",
                    batch="PC24B091",
                    complaint_type="Delivery",
                    description="Outer shipper arrived dented; primary packs remained intact.",
                    severity="Minor",
                    priority="Medium",
                    status="Closed"
                ),
                Complaint(
                    complaint_no="CC-2026-1044",
                    source="Email",
                    customer="Apollo Clinic",
                    product="Omepra",
                    strength="40 mg",
                    batch="OM24D077",
                    complaint_type="Product quality",
                    description="Capsule shell discoloration observed in two strips.",
                    severity="Major",
                    priority="High",
                    status="Under Investigation"
                )
            ]
            db.add_all(seed_items)
            db.commit()
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()
    yield

app = FastAPI(title="AIVOA Complaint Intelligence API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[x.strip() for x in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok", "service": "aivoa-api"}

@app.get("/api/complaints", response_model=list[ComplaintRead])
def list_complaints(db: Session = Depends(get_db)):
    return db.scalars(select(Complaint).order_by(Complaint.created_at.desc())).all()

@app.post("/api/complaints", response_model=ComplaintRead, status_code=201)
def create_complaint(payload: ComplaintCreate, db: Session = Depends(get_db)):
    count = len(db.scalars(select(Complaint.id)).all())
    item = Complaint(**payload.model_dump(), complaint_no=f"CC-2026-{1049 + count}", status="Open")
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@app.get("/api/complaints/{complaint_id}", response_model=ComplaintRead)
def get_complaint(complaint_id: int, db: Session = Depends(get_db)):
    item = db.get(Complaint, complaint_id)
    if not item:
        raise HTTPException(404, "Complaint not found")
    return item

@app.post("/api/complaints/{complaint_id}/analyze", response_model=AnalysisResponse)
def analyze(complaint_id: int, payload: AnalysisRequest, db: Session = Depends(get_db)):
    item = db.get(Complaint, complaint_id)
    if not item:
        raise HTTPException(404, "Complaint not found")
    state = run_analysis(ComplaintRead.model_validate(item).model_dump(mode="json"), payload.tool, payload.question or "")
    return AnalysisResponse(tool=payload.tool, result=state["result"], model=settings.groq_model, used_llm=state["used_llm"])

@app.post("/api/intake/extract")
async def extract_document(file: UploadFile):
    content = await file.read()
    return {
        "filename": file.filename,
        "bytes": len(content),
        "fields": {
            "source": "Document upload",
            "customer": "MedPlus Distribution",
            "product": "Cardiostat",
            "strength": "20 mg tablets",
            "batch": "CS24A118",
            "complaint_type": "Product quality",
            "description": "Chipped tablet edges and powder residue observed in sealed blister packs.",
            "severity": "Critical",
            "priority": "Urgent",
        },
        "confidence": 0.94,
        "note": "Demo extraction. Replace this parser with OCR/document intelligence for production.",
    }
