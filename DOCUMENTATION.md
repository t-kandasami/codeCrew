# 📚 CodeCrew Technical Documentation

This document provides technical details for developers working on the CodeCrew platform.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React/Vite)  │◄──►│   (FastAPI)     │◄──►│  (PostgreSQL)   │
│   Port: 5173    │    │   Port: 8000    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │              ┌─────────────────┐
         └──────────────►│   WebSocket     │
                        │   (Real-time)   │
                        └─────────────────┘
```

## 🔧 Environment Configuration

### Required Environment Variables

```env
# Database
POSTGRES_DB=codecrew
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
DATABASE_URL=postgresql://postgres:your_secure_password@db:5432/codecrew

# Authentication
SECRET_KEY=your_generated_secret_key
ACCESS_TOKEN_EXPIRE_MINUTES=60

# AI Features (Optional)
OPENAI_API_KEY=your_openai_api_key

# Frontend
VITE_API_URL=http://localhost:8000

# Development
DEBUG=false
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Generating Secure Keys

```bash
# Generate JWT secret key
openssl rand -hex 32

# Example output: 09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7
```

## 🗄️ Database Schema

### Core Tables

#### Users
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    full_name VARCHAR NOT NULL,
    hashed_password VARCHAR NOT NULL,
    role VARCHAR NOT NULL CHECK (role IN ('teacher', 'student')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Classes
```sql
CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    teacher_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Sessions
```sql
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    title VARCHAR NOT NULL,
    session_type VARCHAR NOT NULL CHECK (session_type IN ('live', 'quiz', 'whiteboard')),
    class_id INTEGER REFERENCES classes(id),
    teacher_id INTEGER REFERENCES users(id),
    start_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Quizzes
```sql
CREATE TABLE quizzes (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(id),
    question_text TEXT NOT NULL,
    correct_answer VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔌 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user

### Classes
- `GET /classes` - Get user's classes
- `POST /classes` - Create new class
- `GET /classes/{class_id}` - Get class details
- `PUT /classes/{class_id}` - Update class
- `POST /classes/{class_id}/enroll` - Enroll student

### Sessions
- `GET /sessions` - Get user's sessions
- `POST /sessions` - Create new session
- `GET /sessions/{session_id}` - Get session details
- `PUT /sessions/{session_id}` - Update session
- `DELETE /sessions/{session_id}` - Delete session

### Quizzes
- `GET /sessions/{session_id}/quizzes` - Get session quizzes
- `POST /sessions/{session_id}/quizzes` - Create quiz
- `POST /quizzes/{quiz_id}/responses` - Submit quiz response

### AI Features
- `POST /ai/generate-questions` - Generate quiz questions
- `POST /ai/swot-analysis` - Generate SWOT analysis
- `GET /ai/status` - Check AI service status

### WebSocket
- `WS /ws/{session_id}` - Real-time communication

## 🧠 AI Integration

### OpenAI Configuration

The platform uses OpenAI's GPT-3.5-turbo for quiz generation:

```python
# Backend configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY)
```

### Supported Subjects and Prompts

```python
SUBJECT_PROMPTS = {
    "science": {
        "primary": "Generate quiz questions for primary school students about science...",
        "middle": "Generate quiz questions for middle school students about science...",
        "high": "Generate quiz questions for high school students about science..."
    },
    "math": {
        "primary": "Generate quiz questions for primary school students about math...",
        "middle": "Generate quiz questions for middle school students about math...",
        "high": "Generate quiz questions for high school students about math..."
    }
    # ... more subjects
}
```

### Question Generation Request

```json
{
    "subject": "science",
    "topic": "biology",
    "difficulty": "medium",
    "count": 10,
    "grade_level": "middle"
}
```

## 🔄 Real-time Features

### WebSocket Events

```javascript
// Client-side WebSocket events
socket.on('message', handleMessage);
socket.on('whiteboard_update', handleWhiteboardUpdate);
socket.on('quiz_update', handleQuizUpdate);
socket.on('user_joined', handleUserJoined);
socket.on('user_left', handleUserLeft);
```

### Message Types

```typescript
interface WebSocketMessage {
    type: 'message' | 'whiteboard_update' | 'quiz_update' | 'user_joined' | 'user_left';
    data: any;
    timestamp: string;
    user_id: number;
}
```

## 🐳 Docker Configuration

### Service Dependencies

```yaml
services:
  db:
    # Database must be healthy before backend starts
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d codecrew"]
      
  backend:
    depends_on:
      db:
        condition: service_healthy
        
  frontend:
    depends_on:
      - backend
```

### Volume Persistence

```yaml
volumes:
  postgres_data:  # Database data persists between restarts
```

## 🔒 Security Implementation

### Password Hashing

```python
# Using bcrypt for password hashing
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_ctx.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_ctx.verify(plain_password, hashed_password)
```

### JWT Token Management

```python
# Token creation
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Token verification
def verify_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
```

### CORS Configuration

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 🧪 Testing

### API Testing

```bash
# Test authentication
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "teacher@example.com", "password": "password123"}'

# Test AI features
curl -X POST "http://localhost:8000/ai/generate-questions" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"subject": "science", "count": 5}'
```

### Database Testing

```bash
# Access database directly
docker-compose exec db psql -U postgres -d codecrew

# Run migrations
docker-compose exec backend alembic upgrade head
```

## 📊 Performance Considerations

### Database Optimization

- Use connection pooling
- Index frequently queried columns
- Implement query optimization

### Frontend Optimization

- Lazy load components
- Implement caching strategies
- Optimize bundle size

### Real-time Optimization

- Implement rate limiting
- Use efficient WebSocket message formats
- Monitor connection health

## 🚀 Deployment

### Production Checklist

- [ ] Set `DEBUG=false`
- [ ] Use HTTPS URLs
- [ ] Configure production database
- [ ] Set up monitoring and logging
- [ ] Configure backup strategies
- [ ] Set up SSL certificates
- [ ] Configure reverse proxy (nginx)

### Environment-Specific Configurations

```env
# Development
DEBUG=true
CORS_ORIGINS=http://localhost:5173

# Production
DEBUG=false
CORS_ORIGINS=https://yourdomain.com
```

## 🔍 Monitoring and Logging

### Log Levels

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

### Health Checks

```python
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "database": "connected",
        "ai_service": "available" if OPENAI_API_KEY else "unavailable"
    }
```

---

For user-facing documentation, see [README.md](./README.md).