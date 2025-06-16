from sqlalchemy.orm import Session
from . import models, schemas
from datetime import datetime
from .auth import hash_password

# --- User CRUD ---
def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(
        name=user.name,
        email=user.email,
        hashed_password=hash_password(user.password),
        role=user.role
    )
    db.add(db_user); db.commit(); db.refresh(db_user)
    return db_user

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

# --- Session CRUD ---
def get_user_sessions(db: Session, user_id: int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user.role == "teacher":
        return db.query(models.Session).filter(models.Session.teacher_id == user_id).all()
    else:
        # For students, return all sessions they can access
        return db.query(models.Session).all()

def create_session(db: Session, teacher_id: int, sc: schemas.SessionCreate):
    db_sess = models.Session(
        title=sc.title,
        teacher_id=teacher_id,
        start_time=datetime.utcnow()
    )
    db.add(db_sess); db.commit(); db.refresh(db_sess)
    return db_sess

def get_session(db: Session, session_id: int):
    return db.query(models.Session).filter(models.Session.id == session_id).first()

# --- Message CRUD ---
def create_message(db: Session, session_id: int, sender_id: int, mc: schemas.MessageCreate):
    msg = models.Message(
        session_id=session_id,
        sender_id=sender_id,
        message_text=mc.message_text,
        timestamp=datetime.utcnow()
    )
    db.add(msg); db.commit(); db.refresh(msg)
    return msg

def get_messages(db: Session, session_id: int):
    return db.query(models.Message).filter(models.Message.session_id == session_id).all()

# --- Quiz CRUD ---
def create_quiz(db: Session, session_id: int, user_id: int, qc: schemas.QuizCreate):
    q = models.Quiz(
        session_id=session_id,
        question_text=qc.question_text,
        correct_answer=qc.correct_answer,
        created_by=user_id
    )
    db.add(q); db.commit(); db.refresh(q)
    return q

def get_quizzes(db: Session, session_id: int):
    return db.query(models.Quiz).filter(models.Quiz.session_id == session_id).all()

# --- QuizResponse CRUD ---
def record_response(db: Session, quiz_id: int, student_id: int, rc: schemas.QuizResponseCreate):
    correct = db.query(models.Quiz).get(quiz_id).correct_answer == rc.selected_answer
    resp = models.QuizResponse(
        quiz_id=quiz_id,
        student_id=student_id,
        selected_answer=rc.selected_answer,
        is_correct=correct,
        timestamp=datetime.utcnow()
    )
    db.add(resp); db.commit(); db.refresh(resp)
    return resp

def get_responses(db: Session, quiz_id: int):
    return db.query(models.QuizResponse).filter(models.QuizResponse.quiz_id == quiz_id).all()

# --- Whiteboard CRUD ---
def save_whiteboard(db: Session, session_id: int, wb: schemas.WhiteboardCreate):
    entry = models.WhiteboardData(
        session_id=session_id,
        data_json=wb.data_json,
        timestamp=datetime.utcnow()
    )
    db.add(entry); db.commit(); db.refresh(entry)
    return entry

def get_whiteboard(db: Session, session_id: int):
    return db.query(models.WhiteboardData).filter(models.WhiteboardData.session_id == session_id).all()

# --- Feedback CRUD ---
def create_feedback(db: Session, from_user: int, session_id: int, fc: schemas.FeedbackCreate):
    fb = models.Feedback(
        from_user_id=from_user,
        to_user_id=fc.to_user_id,
        session_id=session_id,
        comment=fc.comment,
        rating=fc.rating,
        timestamp=datetime.utcnow()
    )
    db.add(fb); db.commit(); db.refresh(fb)
    return fb

def get_feedback(db: Session, session_id: int):
    return db.query(models.Feedback).filter(models.Feedback.session_id == session_id).all()
