from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt
import os
from . import models

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY")
print(f"AUTH_MODULE_LOAD: SECRET_KEY is: {SECRET_KEY[:5]}...") if SECRET_KEY else print("AUTH_MODULE_LOAD: SECRET_KEY is NOT set.")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable is not set")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))


def hash_password(password: str) -> str:
    return pwd_ctx.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_ctx.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    print(f"AUTH: Attempting to decode token. SECRET_KEY used: {SECRET_KEY[:5]}...")
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


async def get_current_user_ws(token: str, db):
    """Get current user for WebSocket connections"""
    try:
        payload = decode_token(token)
        email = payload.get("sub")
        if email is None:
            print("AUTH_WS_DEBUG: User email (sub) not found in token payload.")
            return None
        
        user = db.query(models.User).filter(models.User.email == email).first()
        if user is None:
            print(f"AUTH_WS_DEBUG: User with email {email} not found in DB.")
            return None
        
        return user
    except jwt.ExpiredSignatureError:
        print("AUTH_WS_DEBUG: Token has expired.")
        return None
    except jwt.InvalidTokenError as e:
        print(f"AUTH_WS_DEBUG: Invalid token error: {e}")
        return None
    except Exception as e:
        print(f"AUTH_WS_DEBUG: An unexpected error occurred during WebSocket user authentication: {e}")
        return None
