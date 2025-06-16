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

# --- Session Schemas ---


class SessionBase(BaseModel):
    title: str


class SessionCreate(SessionBase):
    pass


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
    correct_answer: str


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
