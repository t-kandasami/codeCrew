# CollabEdu - Collaborative Education Platform

A real-time collaborative platform for remote education, featuring interactive whiteboards, live quizzes, and real-time communication.

## Environment Variables

Create a `.env` file in the root directory with the following variables:

### Backend Environment Variables

```env
# Secret key for JWT token encryption
# Generate a secure key using: openssl rand -hex 32
SECRET_KEY=your-secret-key-here

# PostgreSQL Database Configuration
POSTGRES_PASSWORD=your-db-password-here
DATABASE_URL=postgresql://postgres:your-db-password-here@db:5432/codecrew

# JWT Token Configuration
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Frontend Environment Variables
REACT_APP_API_URL=http://localhost:8000

# Optional Environment Variables
DEBUG=false
CORS_ORIGINS=http://localhost:3000
```

### Security Notes

1. Never commit the `.env` file to version control
2. Generate a secure SECRET_KEY using:
   ```bash
   openssl rand -hex 32
   ```
3. Use strong passwords for the database
4. In production, use HTTPS URLs for REACT_APP_API_URL

## Setup Instructions

1. Clone the repository
2. Copy the environment variables above to a new `.env` file
3. Fill in the values with your secure credentials
4. Run the application:
   ```bash
   docker-compose up -d
   ```

## Development

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Features

- Real-time whiteboard collaboration
- Live quizzes with instant feedback
- Real-time chat
- Role-based access (teachers/students)
- Session management
- JWT authentication

## Security

- All passwords are hashed using bcrypt
- JWT tokens for authentication
- Environment variables for sensitive data
- CORS protection
- Input validation
- SQL injection protection through SQLAlchemy

# Backend Configuration
SECRET_KEY=your-secret-key-here
POSTGRES_PASSWORD=your-db-password-here
DATABASE_URL=postgresql://postgres:your-db-password-here@db:5432/codecrew
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Frontend Configuration
REACT_APP_API_URL=http://localhost:8000

# Optional Configuration
DEBUG=false
CORS_ORIGINS=http://localhost:3000 