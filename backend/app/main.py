from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from .database import engine, Base
from . import models, deps, auth
from .deps import get_db
from .crud import create_user, get_user_by_email, create_session, get_session, get_messages, get_user_sessions, get_quizzes, create_quiz
from .schemas import UserCreate, UserOut, SessionCreate, SessionOut, MessageCreate, MessageOut, QuizOut, QuizCreate
from .deps import get_current_user
from .ws import router as ws_router

load_dotenv()

Base.metadata.create_all(bind=engine)
app = FastAPI(title="CollabEdu")

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
    from .database import SessionLocal
    app.state.db = SessionLocal()

# Auth routes
@app.post("/signup", response_model=UserOut)
def signup(user: UserCreate, db=Depends(deps.get_db)):
    return create_user(db, user)

@app.post("/login")
def login(form_data: deps.OAuth2PasswordRequestForm=Depends(), db=Depends(deps.get_db)):
    from .auth import verify_password, create_access_token
    user = get_user_by_email(db, form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}

# Session endpoints
@app.get("/sessions", response_model=List[SessionOut])
def get_sessions(current_user=Depends(get_current_user), db=Depends(deps.get_db)):
    return get_user_sessions(db, current_user.id)

@app.post("/sessions", response_model=SessionOut)
def post_session(sc: SessionCreate,
                  current_user=Depends(get_current_user),
                  db=Depends(deps.get_db)):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can create sessions")
    return create_session(db, current_user.id, sc)

@app.get("/sessions/{session_id}/messages", response_model=List[MessageOut])
def read_messages(session_id: int,
                   db=Depends(deps.get_db),
                   current_user=Depends(get_current_user)):
    sess = get_session(db, session_id)
    if not sess:
        raise HTTPException(status_code=404)
    return get_messages(db, session_id)

@app.get("/sessions/{session_id}/quizzes", response_model=List[QuizOut])
def read_quizzes(session_id: int,
                 db=Depends(deps.get_db),
                 current_user=Depends(get_current_user)):
    sess = get_session(db, session_id)
    if not sess:
        raise HTTPException(status_code=404)
    return get_quizzes(db, session_id)

@app.post("/sessions/{session_id}/quizzes", response_model=QuizOut)
def create_session_quiz(session_id: int,
                       quiz: QuizCreate,
                       db=Depends(deps.get_db),
                       current_user=Depends(get_current_user)):
    sess = get_session(db, session_id)
    if not sess:
        raise HTTPException(status_code=404)
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can create quizzes")
    return create_quiz(db, session_id, current_user.id, quiz)

# Mount WebSocket router
app.include_router(ws_router)
