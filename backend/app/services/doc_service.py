import io
import re
import zipfile
from pathlib import Path
from typing import Tuple
from fastapi import UploadFile, HTTPException
from pypdf import PdfReader
import docx

from app.config import settings

CODE_EXTENSIONS = {
    ".java", ".py", ".js", ".jsx", ".ts", ".tsx", ".html", ".css",
    ".json", ".xml", ".properties", ".yaml", ".yml", ".sql", ".md", ".txt"
}

class DocumentProcessingService:
    @staticmethod
    def validate_file(file: UploadFile) -> str:
        """Validates file extension and size. Returns lower-cased extension."""
        filename = file.filename or ""
        ext = Path(filename).suffix.lower()
        allowed = [".pdf", ".docx", ".txt", ".md", ".zip"]
        if ext not in allowed:
            allowed_str = ", ".join(allowed)
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format '{ext}'. Allowed formats: {allowed_str}"
            )
        return ext

    @staticmethod
    def extract_text_from_file(file_path: Path) -> Tuple[str, dict]:
        """
        Extracts and sanitizes text from PDF, DOCX, TXT, or ZIP project archives.
        Returns extracted_text and metadata.
        """
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Uploaded file not found on disk")

        ext = file_path.suffix.lower()
        text_content = ""
        meta = {"format": ext, "page_count": 1, "word_count": 0, "files_in_archive": 0}

        try:
            if ext == ".pdf":
                reader = PdfReader(str(file_path))
                meta["page_count"] = len(reader.pages)
                pages_text = []
                for i, page in enumerate(reader.pages):
                    extracted = page.extract_text() or ""
                    pages_text.append(f"--- Page {i+1} ---\n{extracted}")
                text_content = "\n\n".join(pages_text)

            elif ext == ".docx":
                doc = docx.Document(str(file_path))
                paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
                for table in doc.tables:
                    for row in table.rows:
                        row_text = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                        if row_text:
                            paragraphs.append(" | ".join(row_text))
                text_content = "\n".join(paragraphs)

            elif ext in [".txt", ".md"]:
                with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                    text_content = f.read()

            elif ext == ".zip":
                extracted_files = []
                with zipfile.ZipFile(file_path, 'r') as zip_ref:
                    namelist = zip_ref.namelist()
                    meta["files_in_archive"] = len(namelist)
                    # Filter relevant code / text files
                    for name in namelist:
                        # Skip __MACOSX, hidden files, or binaries
                        if "/." in name or name.startswith(".") or "__MACOSX" in name:
                            continue
                        f_ext = Path(name).suffix.lower()
                        if f_ext in CODE_EXTENSIONS:
                            try:
                                with zip_ref.open(name) as zf:
                                    file_bytes = zf.read(15000) # Read up to 15KB per file
                                    file_str = file_bytes.decode('utf-8', errors='replace')
                                    extracted_files.append(f"=== File: {name} ===\n{file_str}")
                            except Exception:
                                continue
                text_content = "\n\n".join(extracted_files)
                if not text_content:
                    text_content = f"Zip archive contained {len(namelist)} files, but no text or code files could be parsed."

            else:
                raise ValueError(f"Unsupported extension: {ext}")

        except Exception as e:
            raise HTTPException(
                status_code=422,
                detail=f"Failed to extract document contents from {file_path.name}: {str(e)}"
            )

        sanitized_text = DocumentProcessingService.sanitize_text(text_content)
        meta["word_count"] = len(sanitized_text.split())
        return sanitized_text, meta

    @staticmethod
    def sanitize_text(text: str) -> str:
        """Removes null bytes, cleans control characters, and normalizes whitespace."""
        if not text:
            return ""
        cleaned = text.replace("\x00", "")
        cleaned = re.sub(r'[\x01-\x08\x0b\x0c\x0e-\x1f]', '', cleaned)
        cleaned = re.sub(r'[ \t]+', ' ', cleaned)
        cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
        max_chars = 50_000
        if len(cleaned) > max_chars:
            cleaned = cleaned[:max_chars] + f"\n\n[... Truncated: Content exceeded {max_chars} characters ...]"
        return cleaned.strip()

doc_service = DocumentProcessingService()
