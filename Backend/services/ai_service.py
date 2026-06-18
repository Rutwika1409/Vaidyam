import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

# ─────────────────────────────────────────────────────────────────────────────
# GROQ CLIENT
# ─────────────────────────────────────────────────────────────────────────────
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

GROQ_MODEL = "llama3-70b-8192"   # fast, free, very capable

# ─────────────────────────────────────────────────────────────────────────────
# SYSTEM PROMPTS
# ─────────────────────────────────────────────────────────────────────────────
REPORT_ANALYSIS_PROMPT = """
You are a medical report interpreter helping patients understand their lab reports.
Explain findings in simple, clear language anyone can understand.

RULES:
- Never diagnose the patient
- Never prescribe medication
- Always say "Please consult a doctor" for any abnormal finding
- Use phrases like "This may indicate...", "This could suggest..."
- Keep each explanation to 2-3 sentences maximum
- Always mention if a value is Normal, Low, or High

FORMAT YOUR RESPONSE AS:
1. Summary of overall report
2. Findings (list each parameter: name, value, status, explanation)
3. General precautions
4. Foods that may help (if relevant)
5. Emergency warning if any value is critically abnormal

REMEMBER: You are educating the patient, not treating them.
"""

SYMPTOM_ANALYSIS_PROMPT = """
You are a healthcare assistant helping patients identify which type of doctor to visit.
Given a patient's symptoms, identify the most appropriate specialist.

RULES:
- Be conservative — when in doubt, suggest General Physician
- Never diagnose
- Keep response short and clear
- Always add disclaimer

FORMAT:
- Recommended Specialist: [type]
- Reason: [one sentence]
- Disclaimer: For educational purposes only. Please consult a real doctor.
"""


# ─────────────────────────────────────────────────────────────────────────────
# GROQ CALL HELPER
# ─────────────────────────────────────────────────────────────────────────────
async def call_groq(system_prompt: str, user_text: str) -> str:
    if not client:
        return (
            "⚠️ Groq AI not configured.\n"
            "Add GROQ_API_KEY to your .env file.\n"
            "Get a free key at https://console.groq.com\n\n"
            f"OCR text extracted successfully ({len(user_text)} characters). "
            "Full AI analysis will appear here once the key is set."
        )
    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_text},
            ],
            max_tokens=1500,
            temperature=0.3,
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"AI analysis failed: {str(e)}"


# ─────────────────────────────────────────────────────────────────────────────
# PUBLIC FUNCTIONS
# ─────────────────────────────────────────────────────────────────────────────
async def analyze_report_text(ocr_text: str) -> str:
    """Send OCR text to Groq and get a plain-language medical summary."""
    prompt = f"Here is the medical report text extracted via OCR:\n\n{ocr_text}"
    return await call_groq(REPORT_ANALYSIS_PROMPT, prompt)


async def analyze_symptoms_ai(symptoms: str) -> str:
    """Send symptom description to Groq and get a specialist recommendation."""
    return await call_groq(SYMPTOM_ANALYSIS_PROMPT, symptoms)


# ─────────────────────────────────────────────────────────────────────────────
# SYMPTOM → SPECIALIST MAP  (keyword fallback, no API needed)
# ─────────────────────────────────────────────────────────────────────────────
SPECIALIST_MAP = {
    # General
    "fever":        "General Physician",
    "cold":         "General Physician",
    "cough":        "General Physician",
    "flu":          "General Physician",
    "headache":     "General Physician",
    "weakness":     "General Physician",
    "fatigue":      "General Physician",
    "weight loss":  "General Physician",
    # Heart
    "chest pain":   "Cardiologist",
    "heart":        "Cardiologist",
    "palpitation":  "Cardiologist",
    "shortness":    "Cardiologist",
    "breathless":   "Cardiologist",
    # Skin
    "skin rash":    "Dermatologist",
    "rash":         "Dermatologist",
    "acne":         "Dermatologist",
    "itching":      "Dermatologist",
    "eczema":       "Dermatologist",
    "psoriasis":    "Dermatologist",
    # Eyes
    "eye":          "Ophthalmologist",
    "vision":       "Ophthalmologist",
    "blurry":       "Ophthalmologist",
    # ENT
    "ear":          "ENT Specialist",
    "hearing":      "ENT Specialist",
    "nose":         "ENT Specialist",
    "throat":       "ENT Specialist",
    "tonsil":       "ENT Specialist",
    "sinus":        "ENT Specialist",
    # Bones/Joints
    "joint pain":   "Orthopedic",
    "bone":         "Orthopedic",
    "knee":         "Orthopedic",
    "back pain":    "Orthopedic",
    "fracture":     "Orthopedic",
    "spine":        "Orthopedic",
    # Stomach
    "stomach":      "Gastroenterologist",
    "digestion":    "Gastroenterologist",
    "vomiting":     "Gastroenterologist",
    "diarrhea":     "Gastroenterologist",
    "constipation": "Gastroenterologist",
    "acidity":      "Gastroenterologist",
    "liver":        "Gastroenterologist",
    # Dental
    "tooth":        "Dentist",
    "teeth":        "Dentist",
    "gum":          "Dentist",
    "toothache":    "Dentist",
    # Women
    "pregnancy":    "Gynecologist",
    "periods":      "Gynecologist",
    "menstrual":    "Gynecologist",
    "ovary":        "Gynecologist",
    # Mental Health
    "anxiety":      "Psychiatrist",
    "depression":   "Psychiatrist",
    "stress":       "Psychiatrist",
    "sleep":        "Psychiatrist",
    "panic":        "Psychiatrist",
    # Neuro
    "seizure":      "Neurologist",
    "epilepsy":     "Neurologist",
    "memory":       "Neurologist",
    "paralysis":    "Neurologist",
    "migraine":     "Neurologist",
    # Diabetes/Thyroid
    "diabetes":     "Endocrinologist",
    "thyroid":      "Endocrinologist",
    "sugar":        "Endocrinologist",
    "hormone":      "Endocrinologist",
    # Kidney/Urine
    "kidney":       "Urologist",
    "urine":        "Urologist",
    "urination":    "Urologist",
    # Lungs
    "asthma":       "Pulmonologist",
    "breathing":    "Pulmonologist",
    "lung":         "Pulmonologist",
    "tb":           "Pulmonologist",
}

def get_specialist(symptoms_text: str) -> str:
    """Keyword match → specialist. Falls back to General Physician."""
    text = symptoms_text.lower()
    for keyword, specialist in SPECIALIST_MAP.items():
        if keyword in text:
            return specialist
    return "General Physician"


# ─────────────────────────────────────────────────────────────────────────────
# EMERGENCY DETECTION  (no AI — pure value checks)
# ─────────────────────────────────────────────────────────────────────────────
CRITICAL_VALUES = {
    "blood sugar":  {"min": 50,   "max": 400,  "unit": "mg/dL"},
    "glucose":      {"min": 50,   "max": 400,  "unit": "mg/dL"},
    "hemoglobin":   {"min": 5,    "max": None, "unit": "g/dL"},
    "potassium":    {"min": 2.5,  "max": 6.5,  "unit": "mEq/L"},
    "sodium":       {"min": 120,  "max": 160,  "unit": "mEq/L"},
    "creatinine":   {"min": None, "max": 10,   "unit": "mg/dL"},
    "bp":           {"min": None, "max": 180,  "unit": "mmHg"},
    "oxygen":       {"min": 88,   "max": None, "unit": "%"},
    "spo2":         {"min": 88,   "max": None, "unit": "%"},
}

def check_emergency(ocr_text: str) -> dict:
    text     = ocr_text.lower()
    warnings = []
    for param, thresholds in CRITICAL_VALUES.items():
        if param in text:
            warnings.append(
                f"⚠️ Critical value detected for {param.title()}. "
                f"Normal range: {thresholds.get('min','?')} - {thresholds.get('max','?')} {thresholds['unit']}. "
                "Please seek immediate medical attention."
            )
    return {"is_emergency": len(warnings) > 0, "warnings": warnings}
