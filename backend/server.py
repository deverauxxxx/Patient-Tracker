from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, date
from enum import Enum


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Enums
class YesNoEnum(str, Enum):
    YES = "Yes"
    NO = "No"

class FluidStatus(str, Enum):
    RUNNING = "running"
    COMPLETED = "completed"
    STOPPED = "stopped"


# Patient Model
class Patient(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str  # Unique hospital ID
    full_name: str
    age: Optional[int] = None  # Auto-calculated
    birthdate: date
    address: str
    ward_number: str
    bed_number: str
    admission_date: date
    diagnosis: str
    high_risk: YesNoEnum = YesNoEnum.NO
    discharged: YesNoEnum = YesNoEnum.NO
    notes: Optional[str] = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class PatientCreate(BaseModel):
    patient_id: str
    full_name: str
    birthdate: date
    address: str
    ward_number: str
    bed_number: str
    admission_date: date
    diagnosis: str
    high_risk: YesNoEnum = YesNoEnum.NO
    discharged: YesNoEnum = YesNoEnum.NO
    notes: Optional[str] = ""

class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    address: Optional[str] = None
    ward_number: Optional[str] = None
    bed_number: Optional[str] = None
    admission_date: Optional[date] = None
    diagnosis: Optional[str] = None
    high_risk: Optional[YesNoEnum] = None
    discharged: Optional[YesNoEnum] = None
    notes: Optional[str] = None


# Vital Signs Model
class VitalSigns(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str  # Reference to patient
    patient_name: str  # Auto-filled
    ward_number: str  # Auto-filled
    bed_number: str  # Auto-filled
    monitoring_datetime: datetime
    blood_pressure: str  # e.g., "120/80"
    heart_rate: int  # bpm
    temperature: float  # celsius
    respiratory_rate: int  # breaths per minute
    spo2: int  # oxygen saturation percentage
    pain_score: int = Field(ge=0, le=10)  # 0-10 scale
    iv_fluids_type: Optional[str] = ""  # e.g., "D5LR"
    iv_fluids_volume: Optional[int] = None  # ml
    iv_fluids_status: Optional[FluidStatus] = FluidStatus.RUNNING
    iv_medications: Optional[str] = ""  # Name, dose, time given
    oral_intake: Optional[str] = ""  # water, food in ml or % consumed
    urine_output: Optional[int] = None  # ml
    other_output: Optional[str] = ""  # vomitus, stool with description
    additional_notes: Optional[str] = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

class VitalSignsCreate(BaseModel):
    patient_id: str
    monitoring_datetime: datetime
    blood_pressure: str
    heart_rate: int
    temperature: float
    respiratory_rate: int
    spo2: int
    pain_score: int = Field(ge=0, le=10)
    iv_fluids_type: Optional[str] = ""
    iv_fluids_volume: Optional[int] = None
    iv_fluids_status: Optional[FluidStatus] = FluidStatus.RUNNING
    iv_medications: Optional[str] = ""
    oral_intake: Optional[str] = ""
    urine_output: Optional[int] = None
    other_output: Optional[str] = ""
    additional_notes: Optional[str] = ""


# Utility functions
def calculate_age(birthdate: date) -> int:
    today = date.today()
    age = today.year - birthdate.year
    if today.month < birthdate.month or (today.month == birthdate.month and today.day < birthdate.day):
        age -= 1
    return age


# Patient endpoints
@api_router.post("/patients", response_model=Patient)
async def create_patient(patient: PatientCreate):
    # Check if patient_id already exists
    existing = await db.patients.find_one({"patient_id": patient.patient_id})
    if existing:
        raise HTTPException(status_code=400, detail="Patient ID already exists")
    
    # Calculate age
    age = calculate_age(patient.birthdate)
    
    patient_dict = patient.dict()
    patient_dict["age"] = age
    
    # Convert date objects to strings for MongoDB storage
    if isinstance(patient_dict.get("birthdate"), date):
        patient_dict["birthdate"] = patient_dict["birthdate"].isoformat()
    if isinstance(patient_dict.get("admission_date"), date):
        patient_dict["admission_date"] = patient_dict["admission_date"].isoformat()
    
    patient_obj = Patient(**patient_dict)
    
    # Convert dates to strings in the dict for MongoDB
    patient_doc = patient_obj.dict()
    if isinstance(patient_doc.get("birthdate"), date):
        patient_doc["birthdate"] = patient_doc["birthdate"].isoformat()
    if isinstance(patient_doc.get("admission_date"), date):
        patient_doc["admission_date"] = patient_doc["admission_date"].isoformat()
    
    await db.patients.insert_one(patient_doc)
    return patient_obj

@api_router.get("/patients", response_model=List[Patient])
async def get_patients(
    search: Optional[str] = Query(None, description="Search by name, patient ID, or ward"),
    high_risk: Optional[bool] = Query(None, description="Filter by high risk status"),
    discharged: Optional[bool] = Query(None, description="Filter by discharge status"),
    ward: Optional[str] = Query(None, description="Filter by ward number")
):
    query = {}
    
    if search:
        query["$or"] = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"patient_id": {"$regex": search, "$options": "i"}},
            {"ward_number": {"$regex": search, "$options": "i"}}
        ]
    
    if high_risk is not None:
        query["high_risk"] = YesNoEnum.YES if high_risk else YesNoEnum.NO
    
    if discharged is not None:
        query["discharged"] = YesNoEnum.YES if discharged else YesNoEnum.NO
    
    if ward:
        query["ward_number"] = ward
    
    patients = await db.patients.find(query).sort("ward_number", 1).to_list(1000)
    
    # Update ages for all patients
    updated_patients = []
    for patient in patients:
        # Convert string dates back to date objects
        if isinstance(patient.get("birthdate"), str):
            try:
                patient["birthdate"] = datetime.fromisoformat(patient["birthdate"]).date()
            except:
                pass
        if isinstance(patient.get("admission_date"), str):
            try:
                patient["admission_date"] = datetime.fromisoformat(patient["admission_date"]).date()
            except:
                pass
        
        if patient.get("birthdate"):
            patient["age"] = calculate_age(patient["birthdate"])
        updated_patients.append(Patient(**patient))
    
    return updated_patients

@api_router.get("/patients/{patient_db_id}", response_model=Patient)
async def get_patient(patient_db_id: str):
    patient = await db.patients.find_one({"id": patient_db_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Convert string dates back to date objects
    if isinstance(patient.get("birthdate"), str):
        try:
            patient["birthdate"] = datetime.fromisoformat(patient["birthdate"]).date()
        except:
            pass
    if isinstance(patient.get("admission_date"), str):
        try:
            patient["admission_date"] = datetime.fromisoformat(patient["admission_date"]).date()
        except:
            pass
    
    # Update age
    if patient.get("birthdate"):
        patient["age"] = calculate_age(patient["birthdate"])
    
    return Patient(**patient)

@api_router.put("/patients/{patient_db_id}", response_model=Patient)
async def update_patient(patient_db_id: str, patient_update: PatientUpdate):
    existing_patient = await db.patients.find_one({"id": patient_db_id})
    if not existing_patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    update_data = {k: v for k, v in patient_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    # Recalculate age if birthdate is updated
    if "birthdate" in update_data:
        update_data["age"] = calculate_age(update_data["birthdate"])
    elif existing_patient.get("birthdate"):
        update_data["age"] = calculate_age(existing_patient["birthdate"])
    
    await db.patients.update_one({"id": patient_db_id}, {"$set": update_data})
    
    updated_patient = await db.patients.find_one({"id": patient_db_id})
    return Patient(**updated_patient)

@api_router.delete("/patients/{patient_db_id}")
async def delete_patient(patient_db_id: str):
    result = await db.patients.delete_one({"id": patient_db_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Also delete associated vital signs
    await db.vital_signs.delete_many({"patient_id": patient_db_id})
    
    return {"message": "Patient deleted successfully"}


# Vital Signs endpoints
@api_router.post("/vital-signs", response_model=VitalSigns)
async def create_vital_signs(vital_signs: VitalSignsCreate):
    # Get patient details for auto-fill
    patient = await db.patients.find_one({"id": vital_signs.patient_id})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    vital_signs_dict = vital_signs.dict()
    vital_signs_dict["patient_name"] = patient["full_name"]
    vital_signs_dict["ward_number"] = patient["ward_number"]
    vital_signs_dict["bed_number"] = patient["bed_number"]
    
    vital_signs_obj = VitalSigns(**vital_signs_dict)
    await db.vital_signs.insert_one(vital_signs_obj.dict())
    
    return vital_signs_obj

@api_router.get("/vital-signs", response_model=List[VitalSigns])
async def get_vital_signs(
    patient_id: Optional[str] = Query(None, description="Filter by patient ID"),
    ward: Optional[str] = Query(None, description="Filter by ward number"),
    limit: int = Query(100, description="Limit number of results")
):
    query = {}
    
    if patient_id:
        query["patient_id"] = patient_id
    
    if ward:
        query["ward_number"] = ward
    
    vital_signs = await db.vital_signs.find(query).sort("monitoring_datetime", -1).limit(limit).to_list(limit)
    return [VitalSigns(**vs) for vs in vital_signs]

@api_router.get("/vital-signs/{vital_signs_id}", response_model=VitalSigns)
async def get_vital_sign(vital_signs_id: str):
    vital_signs = await db.vital_signs.find_one({"id": vital_signs_id})
    if not vital_signs:
        raise HTTPException(status_code=404, detail="Vital signs record not found")
    
    return VitalSigns(**vital_signs)

@api_router.delete("/vital-signs/{vital_signs_id}")
async def delete_vital_signs(vital_signs_id: str):
    result = await db.vital_signs.delete_one({"id": vital_signs_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vital signs record not found")
    
    return {"message": "Vital signs record deleted successfully"}


# Statistics endpoints
@api_router.get("/stats/overview")
async def get_overview_stats():
    total_patients = await db.patients.count_documents({"discharged": YesNoEnum.NO})
    high_risk_patients = await db.patients.count_documents({
        "discharged": YesNoEnum.NO,
        "high_risk": YesNoEnum.YES
    })
    
    # Get ward statistics
    pipeline = [
        {"$match": {"discharged": YesNoEnum.NO}},
        {"$group": {"_id": "$ward_number", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    ward_stats = await db.patients.aggregate(pipeline).to_list(100)
    
    return {
        "total_patients": total_patients,
        "high_risk_patients": high_risk_patients,
        "discharged_patients": await db.patients.count_documents({"discharged": YesNoEnum.YES}),
        "ward_statistics": ward_stats,
        "recent_vital_signs": await db.vital_signs.count_documents({})
    }


# Test endpoint
@api_router.get("/")
async def root():
    return {"message": "Hospital Maternity Patient Tracker API"}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()