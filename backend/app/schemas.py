from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime

# --- User Schemas ---


class UserBase(BaseModel):
    name: str
    email: EmailStr


class UserCreate(UserBase):
    password: str
    role: str


class UserOut(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    role: str

# --- Class Schemas ---

class ClassBase(BaseModel):
    name: str
    description: Optional[str] = None

class ClassCreate(ClassBase):
    pass

class ClassUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class ClassOut(ClassBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    teacher_id: int
    created_at: datetime
    student_count: Optional[int] = 0
    sessions: Optional[List["SessionOut"]] = []

class ClassEnrollmentBase(BaseModel):
    class_id: int
    student_id: int

class ClassEnrollmentCreate(ClassEnrollmentBase):
    pass

class ClassEnrollmentOut(ClassEnrollmentBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    enrolled_at: datetime

# --- Session Schemas ---


class SessionBase(BaseModel):
    title: str
    class_id: Optional[int] = None
    session_type: str = "live"


class SessionCreate(SessionBase):
    pass


class SessionUpdate(BaseModel):
    title: Optional[str] = None
    session_type: Optional[str] = None


class SessionOut(SessionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    teacher_id: int
    start_time: datetime
    end_time: Optional[datetime]

# --- Message Schemas ---


class MessageBase(BaseModel):
    message_text: str


class MessageCreate(MessageBase):
    pass


class MessageOut(MessageBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sender_id: int
    timestamp: datetime

# --- Quiz Schemas ---


class QuizBase(BaseModel):
    question_text: str
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: Optional[str] = None


class QuizCreate(QuizBase):
    pass


class QuizOut(QuizBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    session_id: int
    created_by: int


# --- QuizResponse Schemas ---
class QuizResponseBase(BaseModel):
    selected_answer: str


class QuizResponseCreate(QuizResponseBase):
    pass


class QuizResponseOut(QuizResponseBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    quiz_id: int
    student_id: int
    is_correct: bool
    timestamp: datetime


# --- Whiteboard Data Schemas ---
class WhiteboardDataBase(BaseModel):
    data_json: dict


class WhiteboardCreate(WhiteboardDataBase):
    pass


class WhiteboardOut(WhiteboardDataBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    session_id: int
    timestamp: datetime

# --- Feedback Schemas ---


class FeedbackBase(BaseModel):
    comment: str
    rating: Optional[int]


class FeedbackCreate(FeedbackBase):
    to_user_id: int


class FeedbackOut(FeedbackBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    from_user_id: int
    session_id: int
    timestamp: datetime

# Rebuild models to resolve forward references
ClassOut.model_rebuild()
