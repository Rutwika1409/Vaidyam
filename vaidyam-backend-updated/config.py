import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Force UTF-8 encoding for standard streams on Windows to prevent UnicodeEncodeError
if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

# Tee class to write output to both the console and server.log in the workspace
class Tee:
    def __init__(self, filename, original_stream):
        try:
            self.file = open(filename, "w", encoding="utf-8", buffering=1)
        except Exception:
            self.file = None
        self.original_stream = original_stream

    def write(self, data):
        if self.file:
            try:
                self.file.write(data)
                self.file.flush()
            except Exception:
                pass
        if self.original_stream:
            try:
                self.original_stream.write(data)
                self.original_stream.flush()
            except Exception:
                pass

    def flush(self):
        if self.file:
            try:
                self.file.flush()
            except Exception:
                pass
        if self.original_stream:
            try:
                self.original_stream.flush()
            except Exception:
                pass

    def isatty(self):
        if self.original_stream:
            try:
                return self.original_stream.isatty()
            except Exception:
                pass
        return False

# Enable log mirroring
sys.stdout = Tee("server.log", sys.stdout)
sys.stderr = Tee("server.log", sys.stderr)

# Bypass duplicate OpenMP runtime loading error (common with PyTorch in Conda envs)
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

load_dotenv()

# ─────────────────────────────────────────────────────────────────────────────
# ENVIRONMENT VARIABLES
# ─────────────────────────────────────────────────────────────────────────────
SUPABASE_URL     = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY     = os.getenv("SUPABASE_KEY", "")
GROQ_API_KEY     = os.getenv("GROQ_API_KEY", "")
UPLOAD_DIR       = os.getenv("UPLOAD_DIR", "uploads")
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "10"))

# SMTP (email notifications)
SMTP_HOST     = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT     = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER     = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL    = os.getenv("FROM_EMAIL", SMTP_USER)

# Google Maps (optional — only needed for nearby-doctors feature)
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")

# ─────────────────────────────────────────────────────────────────────────────
# VALIDATE REQUIRED VARS
# ─────────────────────────────────────────────────────────────────────────────
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("❌ SUPABASE_URL and SUPABASE_KEY must be set in .env file")

# ─────────────────────────────────────────────────────────────────────────────
# SUPABASE CLIENT
# ─────────────────────────────────────────────────────────────────────────────
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print(f"✅ Supabase connected: {SUPABASE_URL[:40]}...")
if GROQ_API_KEY:
    print("✅ Groq AI ready")
else:
    print("⚠️  GROQ_API_KEY not set — AI analysis will return placeholder text")
