import os
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.config import settings, UPLOAD_DIR, SAMPLE_DIR
from app.database import get_db
from app.models import User, Task, Submission, AIReview, ReviewHistory
from app.schemas import SubmissionResponse, AIReviewResponse
from app.auth import get_current_user
from app.services.doc_service import doc_service
from app.services.ai_service import ai_review_service
from app.services.notification_service import notification_service
from app.services.seed_service import seed_database

router = APIRouter(tags=["Submissions"])

@router.post("/tasks/{task_id}/submit", response_model=SubmissionResponse)
async def submit_task_work(
    task_id: int,
    submission_type: str = Form("FILE"), # FILE, ZIP, LINK, TEXT
    file: Optional[UploadFile] = File(None),
    repo_link: Optional[str] = Form(None),
    submitted_text: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submits intern work, processes document/code/link, runs AI human mentor review,
    evaluates continuous improvement if resubmission, updates task status, and notifies parties.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Determine previous submissions
    existing_subs = task.submissions
    version = len(existing_subs) + 1

    file_name = None
    file_path_str = None
    file_size_bytes = 0
    extracted_content = ""

    # Handle file submission
    if file and file.filename:
        file_name = file.filename
        ext = doc_service.validate_file(file)
        
        # Save file to uploads folder
        safe_filename = f"task_{task_id}_v{version}_{Path(file.filename).name}"
        target_path = UPLOAD_DIR / safe_filename
        with open(target_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        file_path_str = str(target_path)
        file_size_bytes = target_path.stat().st_size
        
        # Extract text/code
        extracted_content, _ = doc_service.extract_text_from_file(target_path)
    
    # Handle text or repository link submission
    if submitted_text:
        extracted_content += f"\n\n[Submitted Notes / Description]:\n{submitted_text}"
    if repo_link:
        extracted_content += f"\n\n[Repository / Demo URL]: {repo_link}"

    if not extracted_content.strip():
        extracted_content = "Empty submission provided."

    # Fetch previous review data for improvement comparison if version > 1
    previous_review_data = None
    if existing_subs and existing_subs[0].ai_review:
        prev_rev = existing_subs[0].ai_review
        previous_review_data = {
            "score": prev_rev.overall_score,
            "issues": prev_rev.issues,
            "areas_for_improvement": prev_rev.weaknesses
        }

    # Run AI Review like human mentor
    ai_result = await ai_review_service.review_submission(
        task_title=task.title,
        task_description=task.description,
        expected_outcome=task.expected_outcome or "",
        evaluation_guidelines=task.evaluation_guidelines or "",
        submission_content=extracted_content,
        submission_type=submission_type,
        file_name=file_name,
        version=version,
        previous_review_data=previous_review_data
    )

    # Determine submission & task status
    sub_status = ai_result.recommendation
    task.status = sub_status

    # Create submission record
    new_sub = Submission(
        task_id=task.id,
        intern_id=current_user.id,
        version=version,
        submission_type=submission_type,
        file_name=file_name or (repo_link if repo_link else "Text Submission"),
        file_path=file_path_str or "",
        file_size_bytes=file_size_bytes,
        repo_link=repo_link,
        submitted_text=submitted_text,
        extracted_content=extracted_content[:15000],
        status=sub_status,
        submitted_at=datetime.now(timezone.utc)
    )
    db.add(new_sub)
    db.flush()

    # Calculate previous score / score change if v2+
    prev_score = previous_review_data.get("score") if previous_review_data else None
    score_change = round(ai_result.score - prev_score, 1) if prev_score is not None else None

    # Create AI Review record
    ai_review = AIReview(
        submission_id=new_sub.id,
        overall_score=ai_result.score,
        confidence_score=ai_result.confidence,
        recommendation=ai_result.recommendation,
        overall_assessment=ai_result.overall_assessment,
        mentor_feedback=ai_result.mentor_feedback,
        previous_score=prev_score,
        score_change=score_change,
        improvement_summary=ai_result.improvement_summary,
        reviewed_at=datetime.now(timezone.utc),
        model_used=ai_result.model_used
    )
    ai_review.strengths = ai_result.strengths
    ai_review.weaknesses = ai_result.areas_for_improvement
    ai_review.issues = ai_result.issues
    ai_review.suggestions = ai_result.suggestions
    ai_review.previous_issues_status = ai_result.previous_issues_status

    db.add(ai_review)
    db.flush()

    # Create audit history record
    event_type = "AI_REVIEWED"
    if ai_result.recommendation == "APPROVED":
        event_title = f"Submission v{version} Approved by AI Mentor (Score: {ai_result.score:.0f})"
    elif ai_result.recommendation == "NEEDS_REVISION":
        event_title = f"Submission v{version} Reviewed: Revision Requested (Score: {ai_result.score:.0f})"
    else:
        event_title = f"Submission v{version} Flagged for Human Review (Confidence: {ai_result.confidence:.0f}%)"

    db.add(ReviewHistory(
        task_id=task.id,
        submission_id=new_sub.id,
        actor_id=current_user.id,
        event_type=event_type,
        title=event_title,
        description=ai_result.overall_assessment
    ))

    # Send notifications
    intern = task.intern
    manager = task.manager

    if ai_result.recommendation == "APPROVED":
        notification_service.notify_task_approved(db, task, intern, ai_result.score)
    elif ai_result.recommendation == "NEEDS_REVISION":
        notification_service.notify_revision_requested(db, task, intern, ai_result.score, ai_result.mentor_feedback[:180])
    elif ai_result.recommendation == "HUMAN_REVIEW_REQUIRED":
        notification_service.notify_human_review_required(
            db, task, manager, intern, f"AI confidence is {ai_result.confidence:.0f}%, below threshold."
        )

    db.commit()
    db.refresh(new_sub)
    return new_sub

@router.get("/sample-files/{filename}")
def download_sample_file(filename: str):
    """Provides downloadable test files so judges can test uploads in seconds."""
    safe_name = Path(filename).name
    file_path = SAMPLE_DIR / safe_name
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Sample file '{safe_name}' not found.")
    
    media_type = "application/pdf" if safe_name.endswith(".pdf") else "application/zip"
    return FileResponse(path=str(file_path), filename=safe_name, media_type=media_type)

@router.post("/admin/reseed")
def reseed_demo(db: Session = Depends(get_db)):
    """Resets the database back to clean hackathon demo state."""
    res = seed_database(db)
    return {"message": "Demo data successfully reseeded", "details": res}
