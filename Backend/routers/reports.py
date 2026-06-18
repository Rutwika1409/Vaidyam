import os
import shutil
from fastapi import APIRouter, HTTPException, UploadFile, File, BackgroundTasks, Query
from fastapi.responses import JSONResponse
from config import supabase, UPLOAD_DIR, MAX_FILE_SIZE_MB
from models.schemas import ReportResponse, SymptomCheckRequest, SymptomCheckResponse, MessageResponse
from services.ocr_service import extract_text_from_file, delete_file
from services.ai_service import analyze_report_text, get_specialist, check_emergency

router = APIRouter()

ALLOWED_CONTENT_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"]
MAX_FILE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024


# ─────────────────────────────────────────────────────────────────────────────
# BACKGROUND TASK: OCR + AI ANALYSIS
# ─────────────────────────────────────────────────────────────────────────────
async def process_report_background(report_id: str, file_path: str):
    """
    Background task:
    1. Runs OCR on the uploaded file
    2. Sends OCR text to AI for analysis
    3. Checks for emergency/critical values
    4. Saves results (ai_summary, specialist_recommendation) to Supabase
    5. Deletes local temp file
    """
    print(f"🔄 Background processing started for report: {report_id}")
    try:
        ocr_text = extract_text_from_file(file_path)
        print(f"✅ OCR done: {len(ocr_text)} chars")

        emergency_info = check_emergency(ocr_text)
        ai_result = await analyze_report_text(ocr_text)
        specialist = get_specialist(ocr_text)

        if emergency_info["is_emergency"]:
            warning_text = "🚨 EMERGENCY ALERT:\n" + "\n".join(emergency_info["warnings"])
            ai_result = warning_text + "\n\n" + ai_result

        supabase.table("reports").update({
            "ocr_text":                  ocr_text,
            "ai_summary":                ai_result,
            "specialist_recommendation": specialist,
        }).eq("id", report_id).execute()

        print(f"✅ Report {report_id} saved")

    except Exception as e:
        error_msg = f"Processing failed: {str(e)}"
        print(f"❌ {error_msg}")
        supabase.table("reports").update({"ai_summary": error_msg}).eq("id", report_id).execute()
    finally:
        delete_file(file_path)


# ─────────────────────────────────────────────────────────────────────────────
# POST: UPLOAD REPORT
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/upload/{user_id}", status_code=202, summary="Upload a medical report")
async def upload_report(
    user_id:          str,
    background_tasks: BackgroundTasks,
    file:             UploadFile = File(...),
):
    """
    Upload a medical report (PDF or image). Processing runs in the background.
    Poll GET /api/reports/{report_id} to check when ai_summary is ready.
    """
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}. Allowed: PDF, PNG, JPG, WEBP"
        )

    content = await file.read()
    if len(content) > MAX_FILE_BYTES:
        raise HTTPException(status_code=400, detail=f"File too large. Max: {MAX_FILE_SIZE_MB} MB")

    user_check = supabase.table("users").select("id").eq("id", user_id).execute()
    if not user_check.data:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    safe_filename = f"{user_id}_{file.filename}"
    file_path     = os.path.join(UPLOAD_DIR, safe_filename)

    with open(file_path, "wb") as f:
        f.write(content)

    result = supabase.table("reports").insert({
        "user_id":   user_id,
        "file_name": file.filename,
        "file_url":  file_path,
        "report_type": file.content_type,
        "ocr_text":  None,
        "ai_summary": "Processing… Please check back in a few seconds.",
        "specialist_recommendation": None,
    }).execute()

    if not result.data:
        delete_file(file_path)
        raise HTTPException(status_code=500, detail="Failed to create report record")

    report_id = result.data[0]["id"]
    background_tasks.add_task(process_report_background, report_id, file_path)

    return {
        "message":   "Report uploaded. AI analysis in progress.",
        "report_id": report_id,
        "status":    "processing",
        "tip":       f"Poll GET /api/reports/{report_id} every 5 s.",
    }


# ─────────────────────────────────────────────────────────────────────────────
# GET: SINGLE REPORT
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/{report_id}", response_model=ReportResponse, summary="Get a single report")
def get_report(report_id: str):
    result = (
        supabase.table("reports")
        .select("*")
        .eq("id", report_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail=f"Report {report_id} not found")
    return result.data


# ─────────────────────────────────────────────────────────────────────────────
# GET: ALL REPORTS FOR A USER
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/user/{user_id}", summary="Get all reports for a user")
def get_user_reports(
    user_id: str,
    limit:   int = Query(20, ge=1, le=100),
    offset:  int = Query(0,  ge=0),
):
    user_check = supabase.table("users").select("id").eq("id", user_id).execute()
    if not user_check.data:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found")

    result = (
        supabase.table("reports")
        .select("*")
        .eq("user_id", user_id)
        .order("uploaded_at", desc=True)
        .limit(limit)
        .offset(offset)
        .execute()
    )
    return {"user_id": user_id, "reports": result.data, "total": len(result.data)}


# ─────────────────────────────────────────────────────────────────────────────
# POST: SYMPTOM CHECK
# ─────────────────────────────────────────────────────────────────────────────
@router.post(
    "/symptoms/check",
    response_model=SymptomCheckResponse,
    summary="Check symptoms and get specialist recommendation",
)
def check_symptoms(body: SymptomCheckRequest):
    specialist = get_specialist(body.symptoms)
    return {
        "symptoms":   body.symptoms,
        "specialist": specialist,
        "message":    f"Based on your symptoms, we recommend visiting a {specialist}.",
        "disclaimer": "For educational purposes only. Please consult a real doctor.",
    }


# ─────────────────────────────────────────────────────────────────────────────
# POST: EMERGENCY CHECK
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/emergency/check", summary="Check text for emergency/critical values")
def emergency_check(body: dict):
    text = body.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="text field is required")
    return check_emergency(text)


# ─────────────────────────────────────────────────────────────────────────────
# DELETE: REPORT
# ─────────────────────────────────────────────────────────────────────────────
@router.delete("/{report_id}", response_model=MessageResponse, summary="Delete a report")
def delete_report(report_id: str):
    check = supabase.table("reports").select("id").eq("id", report_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail=f"Report {report_id} not found")
    supabase.table("reports").delete().eq("id", report_id).execute()
    return {"message": f"Report {report_id} deleted successfully"}
