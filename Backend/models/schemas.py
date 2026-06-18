from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
import re

def validate_email_fmt(v: str) -> str:
    """Simple email format check — no external library needed."""
    if v and not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", v):
        raise ValueError("Invalid email address format")
    return v.lower().strip()


# ─────────────────────────────────────────────────────────────────────────────
# USER MODELS
# ─────────────────────────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    full_name:     str           = Field(..., min_length=2, max_length=100)
    email:         str           = Field(..., description="User email address")
    password_hash: str           = Field(..., min_length=6, description="Hashed password")
    language:      Optional[str] = Field("en", description="Preferred language: en, te, hi, ta, kn, ml")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v): return validate_email_fmt(v)

    @field_validator("language")
    @classmethod
    def validate_language(cls, v):
        allowed = ["en", "te", "hi", "ta", "kn", "ml"]
        if v not in allowed:
            raise ValueError(f"Language must be one of {allowed}")
        return v

class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    language:  Optional[str] = None

class UserResponse(BaseModel):
    id:         str
    full_name:  Optional[str]      = None
    email:      Optional[str]      = None
    language:   Optional[str]      = None
    created_at: Optional[datetime] = None


# ─────────────────────────────────────────────────────────────────────────────
# DOCTOR MODELS
# ─────────────────────────────────────────────────────────────────────────────
SPECIALIST_TYPES = [
    "General Physician", "Cardiologist", "Dermatologist", "Ophthalmologist",
    "ENT Specialist", "Orthopedic", "Gastroenterologist", "Dentist",
    "Gynecologist", "Psychiatrist", "Neurologist", "Urologist",
    "Endocrinologist", "Pulmonologist", "Oncologist",
]

class DoctorCreate(BaseModel):
    full_name:        str           = Field(..., min_length=2, max_length=100)
    email:            str           = Field(..., description="Doctor email address")
    specialization:   str           = Field(..., description="Type of specialist")
    hospital_name:    Optional[str] = None
    phone:            Optional[str] = None
    city:             Optional[str] = None
    state:            Optional[str] = None
    experience_years: Optional[int] = Field(None, ge=0, le=60)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v): return validate_email_fmt(v)

    @field_validator("specialization")
    @classmethod
    def validate_specialization(cls, v):
        if v not in SPECIALIST_TYPES:
            raise ValueError(f"specialization must be one of: {SPECIALIST_TYPES}")
        return v

class DoctorUpdate(BaseModel):
    full_name:        Optional[str] = None
    specialization:   Optional[str] = None
    hospital_name:    Optional[str] = None
    phone:            Optional[str] = None
    city:             Optional[str] = None
    state:            Optional[str] = None
    experience_years: Optional[int] = None

class DoctorResponse(BaseModel):
    id:               str
    full_name:        Optional[str] = None
    email:            Optional[str] = None
    specialization:   Optional[str] = None
    hospital_name:    Optional[str] = None
    phone:            Optional[str] = None
    city:             Optional[str] = None
    state:            Optional[str] = None
    experience_years: Optional[int] = None
    created_at:       Optional[datetime] = None


# ─────────────────────────────────────────────────────────────────────────────
# REPORT MODELS
# ─────────────────────────────────────────────────────────────────────────────
class ReportResponse(BaseModel):
    id:                        str
    user_id:                   str
    file_name:                 Optional[str] = None
    file_url:                  Optional[str] = None
    report_type:               Optional[str] = None
    ocr_text:                  Optional[str] = None
    ai_summary:                Optional[str] = None
    specialist_recommendation: Optional[str] = None
    uploaded_at:               Optional[datetime] = None


# ─────────────────────────────────────────────────────────────────────────────
# NOTIFICATION MODELS
# ─────────────────────────────────────────────────────────────────────────────
class DoctorRequestCreate(BaseModel):
    user_id:   str           = Field(..., description="UUID of the requesting user")
    doctor_id: str           = Field(..., description="UUID of the target doctor")
    report_id: Optional[str] = Field(None, description="Optional report to share with the doctor")

class NotificationResponse(BaseModel):
    id:                str
    user_id:           Optional[str]      = None
    doctor_id:         Optional[str]      = None
    report_id:         Optional[str]      = None
    notification_type: Optional[str]      = None
    email_sent:        Optional[bool]     = None
    created_at:        Optional[datetime] = None


# ─────────────────────────────────────────────────────────────────────────────
# SYMPTOM CHECK MODELS
# ─────────────────────────────────────────────────────────────────────────────
class SymptomCheckRequest(BaseModel):
    symptoms: str           = Field(..., min_length=3, description="Describe your symptoms")
    language: Optional[str] = Field("en", description="Language of input")

class SymptomCheckResponse(BaseModel):
    symptoms:   str
    specialist: str
    message:    str
    disclaimer: str = "This is for educational purposes only. Please consult a real doctor."


# ─────────────────────────────────────────────────────────────────────────────
# GENERIC RESPONSE MODELS
# ─────────────────────────────────────────────────────────────────────────────
class MessageResponse(BaseModel):
    message: str

class ErrorResponse(BaseModel):
    error:  str
    detail: Optional[str] = None
