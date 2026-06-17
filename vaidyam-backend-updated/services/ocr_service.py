import os
import fitz          # PyMuPDF   → pip install pymupdf
import easyocr       # EasyOCR   → pip install easyocr
from pathlib import Path

# ─────────────────────────────────────────────────────────────────────────────
# EASYOCR READER — loaded once at startup (takes ~10 seconds first time)
# Supports English by default. Add more languages like ["en", "hi"] if needed
# ─────────────────────────────────────────────────────────────────────────────
print("⏳ Loading EasyOCR model... (first load takes ~10 seconds)")
reader = easyocr.Reader(["en"], gpu=False)
print("✅ EasyOCR model loaded")

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


# ─────────────────────────────────────────────────────────────────────────────
# MAIN FUNCTION — call this from your router
# ─────────────────────────────────────────────────────────────────────────────
def extract_text_from_file(file_path: str) -> str:
    """
    Auto-detects file type and extracts all text from it.
    Supports: PDF, PNG, JPG, JPEG, WEBP, BMP, TIFF

    Returns extracted text as a single string.
    Raises ValueError for unsupported file types.
    """
    path   = Path(file_path)
    suffix = path.suffix.lower()

    if not path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    if suffix not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Unsupported file type: {suffix}. Allowed: {ALLOWED_EXTENSIONS}")

    file_size = path.stat().st_size
    if file_size > MAX_FILE_SIZE_BYTES:
        raise ValueError(f"File too large: {file_size / 1024 / 1024:.1f} MB. Max: 10 MB")

    print(f"📄 Processing file: {path.name} ({suffix})")

    if suffix == ".pdf":
        return _extract_from_pdf(file_path)
    else:
        return _extract_from_image(file_path)


# ─────────────────────────────────────────────────────────────────────────────
# PDF EXTRACTION
# ─────────────────────────────────────────────────────────────────────────────
def _extract_from_pdf(file_path: str) -> str:
    """
    First tries to extract selectable text from PDF (fast, no AI).
    If PDF is a scanned image, falls back to EasyOCR (slower but accurate).
    """
    text = ""
    try:
        doc = fitz.open(file_path)
        for page_num, page in enumerate(doc):
            page_text = page.get_text("text")
            if page_text.strip():
                text += f"\n--- Page {page_num + 1} ---\n{page_text}"

        doc.close()

        # If we got meaningful text, return it
        if len(text.strip()) > 50:
            print(f"✅ PDF text extracted: {len(text)} characters (digital PDF)")
            return text.strip()

    except Exception as e:
        print(f"⚠️ PyMuPDF failed: {e}, falling back to OCR")

    # Fallback: PDF is a scanned image — run OCR on each page
    print("🔄 PDF appears to be scanned. Running EasyOCR on each page...")
    return _ocr_pdf_pages(file_path)


def _ocr_pdf_pages(file_path: str) -> str:
    """
    Convert each PDF page to an image and run EasyOCR.
    Used for scanned/image-based PDFs.
    """
    import tempfile
    all_text = ""

    doc = fitz.open(file_path)
    for page_num, page in enumerate(doc):
        # Render page as image (300 DPI for good OCR accuracy)
        mat  = fitz.Matrix(300 / 72, 300 / 72)
        pix  = page.get_pixmap(matrix=mat)

        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            pix.save(tmp.name)
            page_text = _extract_from_image(tmp.name)
            all_text += f"\n--- Page {page_num + 1} ---\n{page_text}"
            os.unlink(tmp.name)

    doc.close()
    print(f"✅ OCR complete on scanned PDF: {len(all_text)} characters")
    return all_text.strip()


# ─────────────────────────────────────────────────────────────────────────────
# IMAGE EXTRACTION
# ─────────────────────────────────────────────────────────────────────────────
def _extract_from_image(file_path: str) -> str:
    """
    Run EasyOCR on an image file.
    Returns all detected text joined as a single string.
    """
    try:
        results  = reader.readtext(file_path, detail=1, paragraph=False)
        # Filter out very low confidence detections (below 30%)
        filtered = [text for (_, text, confidence) in results if confidence > 0.3]
        joined   = " ".join(filtered)
        print(f"✅ Image OCR complete: {len(joined)} characters, {len(filtered)} text blocks")
        return joined
    except Exception as e:
        print(f"❌ EasyOCR failed: {e}")
        raise RuntimeError(f"OCR failed: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# CLEANUP HELPER
# ─────────────────────────────────────────────────────────────────────────────
def delete_file(file_path: str):
    """Delete uploaded file after processing to save disk space."""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"🗑️ Deleted temp file: {file_path}")
    except Exception as e:
        print(f"⚠️ Could not delete file {file_path}: {e}")
