from fastapi import APIRouter, HTTPException, Query
from config import supabase
from models.schemas import DoctorCreate, DoctorUpdate, DoctorResponse, MessageResponse, SPECIALIST_TYPES

router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# GET ALL DOCTORS (with optional filters)
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/", response_model=list[DoctorResponse], summary="Get all doctors")
def get_all_doctors(
    specialization: str = Query(None, description="Filter by specialization"),
    city:           str = Query(None, description="Filter by city (partial match)"),
    state:          str = Query(None, description="Filter by state (partial match)"),
    limit:          int = Query(50, ge=1, le=200),
    offset:         int = Query(0,  ge=0),
):
    """
    Returns doctors with optional filters.

    Examples:
    - /api/doctors/ → all doctors
    - /api/doctors/?specialization=Cardiologist
    - /api/doctors/?city=Hyderabad
    - /api/doctors/?specialization=Dermatologist&state=Telangana
    """
    query = supabase.table("doctors").select("*")

    if specialization:
        query = query.ilike("specialization", f"%{specialization}%")
    if city:
        query = query.ilike("city", f"%{city}%")
    if state:
        query = query.ilike("state", f"%{state}%")

    result = (
        query
        .order("full_name")
        .limit(limit)
        .offset(offset)
        .execute()
    )
    return result.data


# ─────────────────────────────────────────────────────────────────────────────
# GET ALL SPECIALIST TYPES (for frontend dropdowns)
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/specialists/list", summary="Get list of all specialist types")
def get_specialist_types():
    return {"specialists": SPECIALIST_TYPES}


# ─────────────────────────────────────────────────────────────────────────────
# GET SINGLE DOCTOR
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/{doctor_id}", response_model=DoctorResponse, summary="Get doctor by ID")
def get_doctor(doctor_id: str):
    result = (
        supabase.table("doctors")
        .select("*")
        .eq("id", doctor_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail=f"Doctor {doctor_id} not found")
    return result.data


# ─────────────────────────────────────────────────────────────────────────────
# CREATE DOCTOR
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/", response_model=DoctorResponse, status_code=201, summary="Add a new doctor")
def create_doctor(doctor: DoctorCreate):
    """
    Body: full_name, email, specialization (required) + hospital_name, phone, city, state, experience_years (optional)
    """
    # Check for duplicate email
    existing = supabase.table("doctors").select("id").eq("email", str(doctor.email)).execute()
    if existing.data:
        raise HTTPException(status_code=409, detail="A doctor with this email already exists")

    result = supabase.table("doctors").insert(doctor.model_dump()).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create doctor")
    return result.data[0]


# ─────────────────────────────────────────────────────────────────────────────
# UPDATE DOCTOR
# ─────────────────────────────────────────────────────────────────────────────
@router.put("/{doctor_id}", response_model=DoctorResponse, summary="Update doctor details")
def update_doctor(doctor_id: str, doctor: DoctorUpdate):
    data = {k: v for k, v in doctor.model_dump().items() if v is not None}
    if not data:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    result = (
        supabase.table("doctors")
        .update(data)
        .eq("id", doctor_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail=f"Doctor {doctor_id} not found")
    return result.data[0]


# ─────────────────────────────────────────────────────────────────────────────
# DELETE DOCTOR
# ─────────────────────────────────────────────────────────────────────────────
@router.delete("/{doctor_id}", response_model=MessageResponse, summary="Delete a doctor")
def delete_doctor(doctor_id: str):
    check = supabase.table("doctors").select("id").eq("id", doctor_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail=f"Doctor {doctor_id} not found")
    supabase.table("doctors").delete().eq("id", doctor_id).execute()
    return {"message": f"Doctor {doctor_id} deleted successfully"}


# ─────────────────────────────────────────────────────────────────────────────
# SEARCH DOCTORS BY NAME
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/search/{name}", response_model=list[DoctorResponse], summary="Search doctors by name")
def search_doctors(name: str):
    result = (
        supabase.table("doctors")
        .select("*")
        .ilike("full_name", f"%{name}%")
        .execute()
    )
    return result.data
