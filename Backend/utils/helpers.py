import os
import uuid
from datetime import datetime
from pathlib import Path


def generate_unique_filename(original_filename: str) -> str:
    """
    Creates a unique filename using UUID + original extension.
    Example: "report.pdf" → "a1b2c3d4-e5f6-...-.pdf"
    Prevents filename collisions in the uploads folder.
    """
    ext = Path(original_filename).suffix.lower()
    return f"{uuid.uuid4()}{ext}"


def get_file_size_mb(file_path: str) -> float:
    """Returns file size in MB."""
    return os.path.getsize(file_path) / (1024 * 1024)


def format_datetime(dt: datetime) -> str:
    """Format datetime to readable string."""
    return dt.strftime("%d %B %Y, %I:%M %p")


def is_valid_uuid(value: str) -> bool:
    """Check if a string is a valid UUID."""
    try:
        uuid.UUID(str(value))
        return True
    except ValueError:
        return False


def safe_int(value, default=0) -> int:
    """Safely convert value to int, return default if fails."""
    try:
        return int(value)
    except (ValueError, TypeError):
        return default


def truncate_text(text: str, max_chars: int = 500) -> str:
    """Truncate long text with ellipsis."""
    if len(text) <= max_chars:
        return text
    return text[:max_chars] + "..."
