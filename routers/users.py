from fastapi import APIRouter, HTTPException, Query
from config import supabase
from models.schemas import UserCreate, UserUpdate, UserResponse, MessageResponse

router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# GET ALL USERS
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/", response_model=list[UserResponse], summary="Get all users")
def get_all_users(
    limit:  int = Query(50, ge=1, le=200),
    offset: int = Query(0,  ge=0),
):
    result = (
        supabase.table("users")
        .select("id, full_name, email, language, created_at")
        .order("created_at", desc=True)
        .limit(limit)
        .offset(offset)
        .execute()
    )
    return result.data


# ─────────────────────────────────────────────────────────────────────────────
# GET SINGLE USER
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/{user_id}", response_model=UserResponse, summary="Get user by ID")
def get_user(user_id: str):
    result = (
        supabase.table("users")
        .select("id, full_name, email, language, created_at")
        .eq("id", user_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found")
    return result.data


# ─────────────────────────────────────────────────────────────────────────────
# CREATE USER
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/", response_model=UserResponse, status_code=201, summary="Create a new user")
def create_user(user: UserCreate):
    """
    Body: full_name, email, password_hash (required) + language (optional, default 'en')
    NOTE: password_hash should be hashed on the client/auth layer before sending.
    """
    # Check for duplicate email
    existing = supabase.table("users").select("id").eq("email", str(user.email)).execute()
    if existing.data:
        raise HTTPException(status_code=409, detail="A user with this email already exists")

    result = supabase.table("users").insert(user.model_dump()).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create user")
    return result.data[0]


# ─────────────────────────────────────────────────────────────────────────────
# UPDATE USER
# ─────────────────────────────────────────────────────────────────────────────
@router.put("/{user_id}", response_model=UserResponse, summary="Update user details")
def update_user(user_id: str, user: UserUpdate):
    data = {k: v for k, v in user.model_dump().items() if v is not None}
    if not data:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    result = (
        supabase.table("users")
        .update(data)
        .eq("id", user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found")
    return result.data[0]


# ─────────────────────────────────────────────────────────────────────────────
# DELETE USER
# ─────────────────────────────────────────────────────────────────────────────
@router.delete("/{user_id}", response_model=MessageResponse, summary="Delete a user")
def delete_user(user_id: str):
    check = supabase.table("users").select("id").eq("id", user_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found")
    supabase.table("users").delete().eq("id", user_id).execute()
    return {"message": f"User {user_id} deleted successfully"}


# ─────────────────────────────────────────────────────────────────────────────
# GET USER'S REPORTS (convenience endpoint)
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/{user_id}/reports", summary="Get all reports for a user")
def get_user_reports(user_id: str):
    check = supabase.table("users").select("id").eq("id", user_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found")

    result = (
        supabase.table("reports")
        .select("*")
        .eq("user_id", user_id)
        .order("uploaded_at", desc=True)
        .execute()
    )
    return {"user_id": user_id, "reports": result.data, "total": len(result.data)}
