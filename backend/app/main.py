from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from .database import engine, Base, SessionLocal
from . import models, deps, auth, crud, schemas
from .deps import get_db
from .crud import create_user, get_user_by_email, create_session, get_session, get_messages, get_user_sessions, get_quizzes, create_quiz, create_class, get_teacher_classes, get_student_classes, get_class_by_id, enroll_student_in_class, remove_student_from_class, get_class_students, get_all_students, update_session, delete_session, update_class, record_response, get_responses
from .schemas import UserCreate, UserOut, SessionCreate, SessionOut, MessageCreate, MessageOut, QuizOut, QuizCreate, QuizResponseCreate, QuizResponseOut, ClassCreate, ClassOut, SessionUpdate, ClassUpdate
from .deps import get_current_user
from .auth import create_access_token, verify_password
from .ws import router as ws_router
from .ai_quiz import generate_quiz_questions, QuestionGenerationRequest, QuestionGenerationResponse
import os

load_dotenv()

Base.metadata.create_all(bind=engine)
app = FastAPI(title="CodeCrew")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attach DB session to state
@app.on_event("startup")
def startup_event():
    app.state.db = SessionLocal()
    print(f"APP_STARTUP: SECRET_KEY loaded: {os.getenv('SECRET_KEY')}")

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Auth routes
@app.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = get_user_by_email(db, form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}

@app.post("/users", response_model=UserOut)
def create_user_endpoint(user: UserCreate, db: Session = Depends(get_db)):
    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return create_user(db=db, user=user)

@app.post("/signup", response_model=UserOut)
def signup_endpoint(user: UserCreate, db: Session = Depends(get_db)):
    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return create_user(db=db, user=user)

@app.get("/users/me", response_model=UserOut)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

# Class endpoints
@app.post("/classes", response_model=ClassOut)
def create_class_endpoint(
    class_data: ClassCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can create classes")
    return create_class(db, current_user.id, class_data)

@app.put("/classes/{class_id}", response_model=ClassOut)
def update_class_endpoint(
    class_id: int,
    class_data: ClassUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can update classes")
    
    updated_class = update_class(db, class_id, current_user.id, class_data)
    if not updated_class:
        raise HTTPException(status_code=404, detail="Class not found or not authorized")
    
    return updated_class

@app.get("/classes", response_model=List[ClassOut])
def get_classes(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "teacher":
        return get_teacher_classes(db, current_user.id)
    else:
        return get_student_classes(db, current_user.id)

@app.get("/classes/{class_id}", response_model=ClassOut)
def get_class_endpoint(
    class_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    class_obj = get_class_by_id(db, class_id)
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Check if user has access to this class
    if current_user.role == "teacher" and class_obj.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this class")
    elif current_user.role == "student":
        # Check if student is enrolled
        enrollment = db.query(models.ClassEnrollment).filter(
            models.ClassEnrollment.class_id == class_id,
            models.ClassEnrollment.student_id == current_user.id
        ).first()
        if not enrollment:
            raise HTTPException(status_code=403, detail="Not enrolled in this class")
    
    return class_obj

@app.post("/classes/{class_id}/enroll/{student_id}")
def enroll_student_endpoint(
    class_id: int,
    student_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can enroll students")
    
    class_obj = get_class_by_id(db, class_id)
    if not class_obj or class_obj.teacher_id != current_user.id:
        raise HTTPException(status_code=404, detail="Class not found")
    
    student = db.query(models.User).filter(models.User.id == student_id, models.User.role == "student").first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    return enroll_student_in_class(db, class_id, student_id)

@app.delete("/classes/{class_id}/enroll/{student_id}")
def remove_student_endpoint(
    class_id: int,
    student_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can remove students")
    
    class_obj = get_class_by_id(db, class_id)
    if not class_obj or class_obj.teacher_id != current_user.id:
        raise HTTPException(status_code=404, detail="Class not found")
    
    success = remove_student_from_class(db, class_id, student_id)
    if not success:
        raise HTTPException(status_code=404, detail="Student not enrolled in this class")
    
    return {"message": "Student removed from class"}

@app.get("/classes/{class_id}/students", response_model=List[UserOut])
def get_class_students_endpoint(
    class_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can view class students")
    
    class_obj = get_class_by_id(db, class_id)
    if not class_obj or class_obj.teacher_id != current_user.id:
        raise HTTPException(status_code=404, detail="Class not found")
    
    return get_class_students(db, class_id)

@app.get("/students", response_model=List[UserOut])
def get_all_students_endpoint(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can view all students")
    
    return get_all_students(db)

# Session endpoints
@app.get("/sessions", response_model=List[SessionOut])
def get_sessions_endpoint(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_user_sessions(db, current_user.id)

@app.get("/sessions/{session_id}", response_model=SessionOut)
def get_session_endpoint(
    session_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check if user has access to this session
    if current_user.role == "teacher":
        if session.teacher_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this session")
    else:
        # Check if student is enrolled in the class
        if session.class_id:
            enrollment = db.query(models.ClassEnrollment).filter(
                models.ClassEnrollment.class_id == session.class_id,
                models.ClassEnrollment.student_id == current_user.id
            ).first()
            if not enrollment:
                raise HTTPException(status_code=403, detail="Not enrolled in this class")
    
    return session

@app.post("/sessions", response_model=SessionOut)
def post_session_endpoint(sc: SessionCreate,
                  current_user=Depends(get_current_user),
                  db=Depends(get_db)):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can create sessions")
    return create_session(db, current_user.id, sc)

@app.put("/sessions/{session_id}", response_model=SessionOut)
def update_session_endpoint(
    session_id: int,
    session_data: SessionUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can update sessions")
    
    updated_session = update_session(db, session_id, current_user.id, session_data)
    if not updated_session:
        raise HTTPException(status_code=404, detail="Session not found or not authorized")
    
    return updated_session

@app.delete("/sessions/{session_id}")
def delete_session_endpoint(
    session_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can delete sessions")
    
    success = delete_session(db, session_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found or not authorized")
    
    return {"message": "Session deleted successfully"}

@app.get("/sessions/{session_id}/messages", response_model=List[MessageOut])
def read_messages_endpoint(session_id: int,
                   db=Depends(get_db),
                   current_user=Depends(get_current_user)):
    sess = get_session(db, session_id)
    if not sess:
        raise HTTPException(status_code=404)
    return get_messages(db, session_id)

@app.get("/sessions/{session_id}/quizzes", response_model=List[QuizOut])
def read_quizzes_endpoint(session_id: int,
                 db=Depends(get_db),
                 current_user=Depends(get_current_user)):
    sess = get_session(db, session_id)
    if not sess:
        raise HTTPException(status_code=404)
    return get_quizzes(db, session_id)

@app.post("/sessions/{session_id}/quizzes", response_model=QuizOut)
def create_session_quiz_endpoint(session_id: int,
                       quiz: QuizCreate,
                       db=Depends(get_db),
                       current_user=Depends(get_current_user)):
    sess = get_session(db, session_id)
    if not sess:
        raise HTTPException(status_code=404)
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can create quizzes")
    return create_quiz(db, session_id, current_user.id, quiz)

@app.post("/sessions/{session_id}/quizzes/{quiz_id}/responses", response_model=QuizResponseOut)
def submit_quiz_response_endpoint(
    session_id: int,
    quiz_id: int,
    response: QuizResponseCreate,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Submit a quiz response"""
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can submit quiz responses")
    
    # Check if session exists
    sess = get_session(db, session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check if quiz exists
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id, models.Quiz.session_id == session_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Check if student is enrolled in the class (if session is part of a class)
    if sess.class_id:
        enrollment = db.query(models.ClassEnrollment).filter(
            models.ClassEnrollment.class_id == sess.class_id,
            models.ClassEnrollment.student_id == current_user.id
        ).first()
        if not enrollment:
            raise HTTPException(status_code=403, detail="Not enrolled in this class")
    
    return record_response(db, quiz_id, current_user.id, response)

@app.get("/sessions/{session_id}/quizzes/{quiz_id}/responses", response_model=List[QuizResponseOut])
def get_quiz_responses_endpoint(
    session_id: int,
    quiz_id: int,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get all responses for a quiz (teachers only)"""
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can view quiz responses")
    
    # Check if session exists and belongs to teacher
    sess = get_session(db, session_id)
    if not sess or sess.teacher_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check if quiz exists
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id, models.Quiz.session_id == session_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    return get_responses(db, quiz_id)

# AI Quiz Generation endpoints
@app.post("/ai/generate-questions", response_model=QuestionGenerationResponse)
def generate_questions_endpoint(
    request: QuestionGenerationRequest,
    current_user: models.User = Depends(get_current_user)
):
    """Generate quiz questions using AI"""
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can generate AI questions")
    
    return generate_quiz_questions(request)

@app.get("/ai/status")
def ai_status_endpoint():
    """Check AI service status"""
    api_key = os.getenv("OPENAI_API_KEY")
    has_api_key = bool(api_key)
    client_available = client is not None
    
    return {
        "has_api_key": has_api_key,
        "api_key_length": len(api_key) if api_key else 0,
        "client_available": client_available,
        "status": "available" if client_available else "unavailable"
    }

# Mount WebSocket router
app.include_router(ws_router)
