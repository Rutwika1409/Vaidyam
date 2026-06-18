import sys
import os

log_file = "diagnostic_output.txt"

def log(msg):
    print(msg)
    with open(log_file, "a", encoding="utf-8") as f:
        f.write(msg + "\n")

# Clear log
if os.path.exists(log_file):
    os.remove(log_file)

log("=== DIAGNOSTIC START ===")
log(f"Python: {sys.executable}")
log(f"Version: {sys.version}")

modules = ["fastapi", "uvicorn", "supabase", "dotenv", "fitz", "easyocr", "pydantic", "groq"]

for m in modules:
    log(f"Testing import of {m}...")
    try:
        __import__(m)
        log(f"✅ Success: {m}")
    except Exception as e:
        log(f"❌ Failed: {m} -> {e}")

log("=== DIAGNOSTIC END ===")
