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

# --- Class CRUD ---
def create_class(db: Session, teacher_id: int, class_data: schemas.ClassCreate):
    db_class = models.Class(
        name=class_data.name,
        description=class_data.description,
        teacher_id=teacher_id
    )
    db.add(db_class)
    db.commit()
    db.refresh(db_class)
    return db_class

def update_class(db: Session, class_id: int, teacher_id: int, class_data: schemas.ClassUpdate):
    db_class = db.query(models.Class).filter(
        models.Class.id == class_id,
        models.Class.teacher_id == teacher_id
    ).first()
    
    if not db_class:
        return None
    
    # Update only the fields that are provided
    if class_data.name is not None:
        db_class.name = class_data.name
    if class_data.description is not None:
        db_class.description = class_data.description
    
    db.commit()
    db.refresh(db_class)
    return db_class

def get_teacher_classes(db: Session, teacher_id: int):
    classes = db.query(models.Class).filter(models.Class.teacher_id == teacher_id).all()
    # Add student count and sessions to each class
    for class_obj in classes:
        student_count = db.query(models.ClassEnrollment).filter(
            models.ClassEnrollment.class_id == class_obj.id
        ).count()
        class_obj.student_count = student_count
        
        # Get sessions for this class
        sessions = db.query(models.Session).filter(models.Session.class_id == class_obj.id).all()
        class_obj.sessions = sessions
    return classes

def get_student_classes(db: Session, student_id: int):
    enrollments = db.query(models.ClassEnrollment).filter(
        models.ClassEnrollment.student_id == student_id
    ).all()
    class_ids = [enrollment.class_id for enrollment in enrollments]
    classes = db.query(models.Class).filter(models.Class.id.in_(class_ids)).all()
    
    # Add sessions to each class
    for class_obj in classes:
        sessions = db.query(models.Session).filter(models.Session.class_id == class_obj.id).all()
        class_obj.sessions = sessions
    return classes

def get_class_by_id(db: Session, class_id: int):
    return db.query(models.Class).filter(models.Class.id == class_id).first()

def enroll_student_in_class(db: Session, class_id: int, student_id: int):
    # Check if already enrolled
    existing_enrollment = db.query(models.ClassEnrollment).filter(
        models.ClassEnrollment.class_id == class_id,
        models.ClassEnrollment.student_id == student_id
    ).first()
    
    if existing_enrollment:
        return existing_enrollment
    
    db_enrollment = models.ClassEnrollment(
        class_id=class_id,
        student_id=student_id
    )
    db.add(db_enrollment)
    db.commit()
    db.refresh(db_enrollment)
    return db_enrollment

def remove_student_from_class(db: Session, class_id: int, student_id: int):
    enrollment = db.query(models.ClassEnrollment).filter(
        models.ClassEnrollment.class_id == class_id,
        models.ClassEnrollment.student_id == student_id
    ).first()
    
    if enrollment:
        db.delete(enrollment)
        db.commit()
        return True
    return False

def get_class_students(db: Session, class_id: int):
    enrollments = db.query(models.ClassEnrollment).filter(
        models.ClassEnrollment.class_id == class_id
    ).all()
    student_ids = [enrollment.student_id for enrollment in enrollments]
    return db.query(models.User).filter(models.User.id.in_(student_ids)).all()

def get_all_students(db: Session):
    return db.query(models.User).filter(models.User.role == "student").all()

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
        class_id=sc.class_id,
        session_type=sc.session_type,
        start_time=datetime.utcnow()
    )
    db.add(db_sess); db.commit(); db.refresh(db_sess)
    return db_sess

def update_session(db: Session, session_id: int, teacher_id: int, session_data: schemas.SessionUpdate):
    db_session = db.query(models.Session).filter(
        models.Session.id == session_id,
        models.Session.teacher_id == teacher_id
    ).first()
    
    if not db_session:
        return None
    
    # Update only the fields that are provided
    if session_data.title is not None:
        db_session.title = session_data.title
    if session_data.session_type is not None:
        db_session.session_type = session_data.session_type
    
    db.commit()
    db.refresh(db_session)
    return db_session

def delete_session(db: Session, session_id: int, teacher_id: int):
    db_session = db.query(models.Session).filter(
        models.Session.id == session_id,
        models.Session.teacher_id == teacher_id
    ).first()
    
    if not db_session:
        return False
    
    db.delete(db_session)
    db.commit()
    return True

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
        options=qc.options,
        correct_answer=qc.correct_answer,
        explanation=qc.explanation,
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
