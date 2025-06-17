from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    id             = Column(Integer, primary_key=True, index=True)
    name           = Column(String, nullable=False)
    email          = Column(String, unique=True, index=True, nullable=False)
    hashed_password= Column(String, nullable=False)
    role           = Column(String, default="student", nullable=False)

    sessions       = relationship("Session", back_populates="teacher")
    messages       = relationship("Message", back_populates="sender")
    quiz_responses = relationship("QuizResponse", back_populates="student")
    sent_feedback  = relationship("Feedback", back_populates="from_user", foreign_keys='Feedback.from_user_id')
    received_feedback = relationship("Feedback", back_populates="to_user", foreign_keys='Feedback.to_user_id')
    # Class relationships
    created_classes = relationship("Class", back_populates="teacher")
    enrollments = relationship("ClassEnrollment", back_populates="student")

class Class(Base):
    __tablename__ = "classes"
    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    teacher_id  = Column(Integer, ForeignKey("users.id"))
    created_at  = Column(DateTime, default=datetime.utcnow)
    
    teacher     = relationship("User", back_populates="created_classes")
    enrollments = relationship("ClassEnrollment", back_populates="class_obj")
    sessions    = relationship("Session", back_populates="class_obj")

class ClassEnrollment(Base):
    __tablename__ = "class_enrollments"
    id        = Column(Integer, primary_key=True, index=True)
    class_id  = Column(Integer, ForeignKey("classes.id"))
    student_id= Column(Integer, ForeignKey("users.id"))
    enrolled_at = Column(DateTime, default=datetime.utcnow)
    
    class_obj = relationship("Class", back_populates="enrollments")
    student   = relationship("User", back_populates="enrollments")

class Session(Base):
    __tablename__ = "sessions"
    id         = Column(Integer, primary_key=True, index=True)
    title      = Column(String, nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"))
    class_id   = Column(Integer, ForeignKey("classes.id"), nullable=True)  # Optional: sessions can be standalone or part of a class
    session_type = Column(String, default="live", nullable=False)  # live, quiz, whiteboard
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time   = Column(DateTime, nullable=True)

    teacher    = relationship("User", back_populates="sessions")
    class_obj  = relationship("Class", back_populates="sessions")
    messages   = relationship("Message", back_populates="session")
    quizzes    = relationship("Quiz", back_populates="session")
    whiteboard = relationship("WhiteboardData", back_populates="session")
    feedbacks  = relationship("Feedback", back_populates="session")

class Message(Base):
    __tablename__ = "messages"
    id           = Column(Integer, primary_key=True, index=True)
    session_id   = Column(Integer, ForeignKey("sessions.id"))
    sender_id    = Column(Integer, ForeignKey("users.id"))
    message_text = Column(Text, nullable=False)
    timestamp    = Column(DateTime, default=datetime.utcnow)

    session = relationship("Session", back_populates="messages")
    sender  = relationship("User", back_populates="messages")

class Quiz(Base):
    __tablename__ = "quizzes"
    id              = Column(Integer, primary_key=True, index=True)
    session_id      = Column(Integer, ForeignKey("sessions.id"))
    question_text   = Column(Text, nullable=False)
    options         = Column(JSON, nullable=True)  # Store multiple choice options as JSON array
    correct_answer  = Column(String, nullable=False)
    explanation     = Column(Text, nullable=True)  # Explanation for the correct answer
    created_by      = Column(Integer, ForeignKey("users.id"))

    session   = relationship("Session", back_populates="quizzes")
    responses = relationship("QuizResponse", back_populates="quiz")

class QuizResponse(Base):
    __tablename__ = "quiz_responses"
    id              = Column(Integer, primary_key=True, index=True)
    quiz_id         = Column(Integer, ForeignKey("quizzes.id"))
    student_id      = Column(Integer, ForeignKey("users.id"))
    selected_answer = Column(String, nullable=False)
    is_correct      = Column(Boolean, default=False)
    timestamp       = Column(DateTime, default=datetime.utcnow)

    quiz    = relationship("Quiz", back_populates="responses")
    student = relationship("User", back_populates="quiz_responses")

class WhiteboardData(Base):
    __tablename__ = "whiteboard_data"
    id         = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"))
    data_json  = Column(JSON, nullable=False)
    timestamp  = Column(DateTime, default=datetime.utcnow)

    session = relationship("Session", back_populates="whiteboard")

class Feedback(Base):
    __tablename__ = "feedback"
    id            = Column(Integer, primary_key=True, index=True)
    from_user_id  = Column(Integer, ForeignKey("users.id"))
    to_user_id    = Column(Integer, ForeignKey("users.id"))
    session_id    = Column(Integer, ForeignKey("sessions.id"))
    comment       = Column(Text, nullable=False)
    rating        = Column(Integer, nullable=True)
    timestamp     = Column(DateTime, default=datetime.utcnow)

    from_user = relationship("User", back_populates="sent_feedback", foreign_keys=[from_user_id])
    to_user   = relationship("User", back_populates="received_feedback", foreign_keys=[to_user_id])
    session   = relationship("Session", back_populates="feedbacks")
