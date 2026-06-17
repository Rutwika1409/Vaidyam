from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from config import supabase
from models.schemas import DoctorRequestCreate, NotificationResponse, MessageResponse
from services.email_service import send_doctor_request_email, send_user_request_confirmation

router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# POST: SEND REQUEST TO DOCTOR  (creates notification + fires emails)
# ─────────────────────────────────────────────────────────────────────────────
@router.post(
    "/request-doctor",
    status_code=201,
    summary="Send a consultation request to a doctor",
)
async def request_doctor(body: DoctorRequestCreate, background_tasks: BackgroundTasks):
    """
    User clicks "Send Request" on a doctor card.

    Steps:
    1. Validates user and doctor exist
    2. Inserts a notification record (notification_type = 'doctor_request')
    3. Sends an email to the doctor (background task)
    4. Sends a confirmation email to the user (background task)
    5. Returns the notification record immediately

    Body:
    - user_id:   UUID of the requesting user
    - doctor_id: UUID of the target doctor
    - report_id: (optional) UUID of a report to share with the doctor
    """
    # ── 1. Verify user exists ──────────────────────────────────────────────
    user_res = (
        supabase.table("users")
        .select("id, full_name, email")
        .eq("id", body.user_id)
        .single()
        .execute()
    )
    if not user_res.data:
        raise HTTPException(status_code=404, detail=f"User {body.user_id} not found")
    user = user_res.data

    # ── 2. Verify doctor exists ────────────────────────────────────────────
    doctor_res = (
        supabase.table("doctors")
        .select("id, full_name, email")
        .eq("id", body.doctor_id)
        .single()
        .execute()
    )
    if not doctor_res.data:
        raise HTTPException(status_code=404, detail=f"Doctor {body.doctor_id} not found")
    doctor = doctor_res.data

    # ── 3. (Optional) Verify report belongs to user ────────────────────────
    if body.report_id:
        report_res = (
            supabase.table("reports")
            .select("id, user_id")
            .eq("id", body.report_id)
            .single()
            .execute()
        )
        if not report_res.data:
            raise HTTPException(status_code=404, detail=f"Report {body.report_id} not found")
        if report_res.data["user_id"] != body.user_id:
            raise HTTPException(status_code=403, detail="Report does not belong to this user")

    # ── 4. Insert notification record ──────────────────────────────────────
    notif_data = {
        "user_id":           body.user_id,
        "doctor_id":         body.doctor_id,
        "report_id":         body.report_id,
        "notification_type": "doctor_request",
        "email_sent":        False,          # will be updated after email attempt
    }
    notif_res = supabase.table("notifications").insert(notif_data).execute()
    if not notif_res.data:
        raise HTTPException(status_code=500, detail="Failed to create notification record")

    notification = notif_res.data[0]
    notification_id = notification["id"]

    # ── 5. Send emails in the background ──────────────────────────────────
    async def send_emails_and_update(notif_id: str):
        email_ok = send_doctor_request_email(
            doctor_email    = doctor["email"],
            doctor_name     = doctor["full_name"],
            user_name       = user["full_name"],
            user_email      = user["email"],
            report_id       = body.report_id,
            notification_id = notif_id,
        )
        send_user_request_confirmation(
            user_email   = user["email"],
            user_name    = user["full_name"],
            doctor_name  = doctor["full_name"],
            doctor_email = doctor["email"],
        )
        # Mark email_sent in DB
        supabase.table("notifications").update({"email_sent": email_ok}).eq("id", notif_id).execute()
        print(f"📧 Email dispatch done for notification {notif_id} — sent={email_ok}")

    background_tasks.add_task(send_emails_and_update, notification_id)

    return {
        "message":         "Request sent successfully. The doctor will be notified via email.",
        "notification_id": notification_id,
        "doctor": {
            "id":    doctor["id"],
            "name":  doctor["full_name"],
            "email": doctor["email"],
        },
        "user": {
            "id":    user["id"],
            "name":  user["full_name"],
            "email": user["email"],
        },
        "email_status": "queued",
    }


# ─────────────────────────────────────────────────────────────────────────────
# GET: ALL NOTIFICATIONS FOR A USER
# ─────────────────────────────────────────────────────────────────────────────
@router.get(
    "/user/{user_id}",
    response_model=list[NotificationResponse],
    summary="Get all notifications sent by a user",
)
def get_user_notifications(
    user_id: str,
    limit:   int = Query(50, ge=1, le=200),
    offset:  int = Query(0,  ge=0),
):
    """Returns all doctor-request notifications sent by a specific user."""
    user_check = supabase.table("users").select("id").eq("id", user_id).execute()
    if not user_check.data:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found")

    result = (
        supabase.table("notifications")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .offset(offset)
        .execute()
    )
    return result.data


# ─────────────────────────────────────────────────────────────────────────────
# GET: ALL NOTIFICATIONS FOR A DOCTOR
# ─────────────────────────────────────────────────────────────────────────────
@router.get(
    "/doctor/{doctor_id}",
    response_model=list[NotificationResponse],
    summary="Get all requests received by a doctor",
)
def get_doctor_notifications(
    doctor_id: str,
    limit:     int = Query(50, ge=1, le=200),
    offset:    int = Query(0,  ge=0),
):
    """Returns all consultation requests received by a specific doctor."""
    doc_check = supabase.table("doctors").select("id").eq("id", doctor_id).execute()
    if not doc_check.data:
        raise HTTPException(status_code=404, detail=f"Doctor {doctor_id} not found")

    result = (
        supabase.table("notifications")
        .select("*")
        .eq("doctor_id", doctor_id)
        .order("created_at", desc=True)
        .limit(limit)
        .offset(offset)
        .execute()
    )
    return result.data


# ─────────────────────────────────────────────────────────────────────────────
# GET: SINGLE NOTIFICATION
# ─────────────────────────────────────────────────────────────────────────────
@router.get(
    "/{notification_id}",
    response_model=NotificationResponse,
    summary="Get a single notification by ID",
)
def get_notification(notification_id: str):
    result = (
        supabase.table("notifications")
        .select("*")
        .eq("id", notification_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail=f"Notification {notification_id} not found")
    return result.data


# ─────────────────────────────────────────────────────────────────────────────
# DELETE: NOTIFICATION
# ─────────────────────────────────────────────────────────────────────────────
@router.delete(
    "/{notification_id}",
    response_model=MessageResponse,
    summary="Delete a notification",
)
def delete_notification(notification_id: str):
    check = supabase.table("notifications").select("id").eq("id", notification_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail=f"Notification {notification_id} not found")

    supabase.table("notifications").delete().eq("id", notification_id).execute()
    return {"message": f"Notification {notification_id} deleted successfully"}
