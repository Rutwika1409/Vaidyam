from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routers import users, doctors, reports, notifications
import uvicorn
import os

# ─────────────────────────────────────────────────────────────────────────────
# APP INIT
# ─────────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="vAIdyam API",
    description="AI-Powered Multilingual Healthcare Guidance Platform",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─────────────────────────────────────────────────────────────────────────────
# CORS MIDDLEWARE
# ─────────────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────────────────────
# GLOBAL EXCEPTION HANDLER
# ─────────────────────────────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)},
    )

# ─────────────────────────────────────────────────────────────────────────────
# STARTUP
# ─────────────────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    os.makedirs("uploads", exist_ok=True)
    print("✅ vAIdyam backend v2.0 started")
    print("📖 API Docs: http://localhost:8000/docs")

# ─────────────────────────────────────────────────────────────────────────────
# ROUTERS
# ─────────────────────────────────────────────────────────────────────────────
app.include_router(users.router,         prefix="/api/users",         tags=["👤 Users"])
app.include_router(doctors.router,       prefix="/api/doctors",       tags=["🩺 Doctors"])
app.include_router(reports.router,       prefix="/api/reports",       tags=["📄 Reports"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["🔔 Notifications"])

# ─────────────────────────────────────────────────────────────────────────────
# ROOT & HEALTH CHECK
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {
        "app":     "vAIdyam API",
        "status":  "running",
        "version": "2.0.0",
        "docs":    "http://localhost:8000/docs",
    }

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}

# ─────────────────────────────────────────────────────────────────────────────
# RUN
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
