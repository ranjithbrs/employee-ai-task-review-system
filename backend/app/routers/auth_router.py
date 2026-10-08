from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import LoginRequest, TokenResponse, UserResponse
from app.auth import verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email.lower().strip()).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token = create_access_token({"sub": str(user.id), "role": user.role, "email": user.email})
    return TokenResponse(access_token=token, user=user)

@router.get("/me", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/demo-switch/{role}", response_model=TokenResponse)
def demo_switch_account(role: str, db: Session = Depends(get_db)):
    """Fast shortcut for hackathon judges to switch between Manager and Intern."""
    role_norm = role.upper()
    if role_norm not in ["MANAGER", "INTERN"]:
        raise HTTPException(status_code=400, detail="Role must be MANAGER or INTERN")

    target_email = "manager@demo.com" if role_norm == "MANAGER" else "intern@demo.com"
    user = db.query(User).filter(User.email == target_email).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"Demo user for {role_norm} not found. Please run seed first.")

    token = create_access_token({"sub": str(user.id), "role": user.role, "email": user.email})
    return TokenResponse(access_token=token, user=user)
