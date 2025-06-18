# 🚀 CodeCrew - Collaborative Education Platform

A real-time collaborative platform for remote education, featuring interactive whiteboards, live quizzes, AI-powered question generation, and real-time communication.

## ✨ Features

- 🎨 **Interactive Whiteboard**: Real-time collaborative drawing and annotation
- 🧠 **AI Quiz Generation**: Generate questions using OpenAI GPT models
- 📊 **Live Quizzes**: Interactive quizzes with instant feedback
- 💬 **Real-time Chat**: Live messaging during sessions
- 🎥 **Video Conferencing**: WebRTC-based video calls
- 👥 **Role-based Access**: Separate interfaces for teachers and students
- 🔐 **JWT Authentication**: Secure user authentication
- 📱 **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Tech Stack

- **Backend**: FastAPI (Python)
- **Frontend**: React + Vite
- **Database**: PostgreSQL
- **Real-time**: WebSocket
- **AI**: OpenAI GPT-3.5-turbo
- **Containerization**: Docker & Docker Compose
- **Authentication**: JWT with bcrypt

## 🚀 Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- [Git](https://git-scm.com/downloads)

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd codeCrew
```

### 2. Set Up Environment Variables

```bash
# Copy the example environment file
cp env.example .env

# Edit the .env file with your values
# You'll need to set at least:
# - POSTGRES_PASSWORD (your database password)
# - SECRET_KEY (generate with: openssl rand -hex 32)
# - OPENAI_API_KEY (optional, for AI features)
```

### 3. Generate Required Keys

```bash
# Generate a secure secret key for JWT
openssl rand -hex 32
# Copy the output to SECRET_KEY in your .env file
```

### 4. Start the Application

```bash
# 1. Remove all the previous running instances of docker containers
docker-compose down -v --rmi all

# 2. Build everything fresh
docker-compose build --no-cache

# 3. Start all services
docker-compose up -d

# 4. Check status
docker-compose ps

# 5. View logs
docker-compose logs -f
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🔧 Configuration

### Environment Variables

The application uses the following environment variables (see `env.example` for all options):

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `POSTGRES_PASSWORD` | Database password | Yes | - |
| `SECRET_KEY` | JWT secret key | Yes | - |
| `OPENAI_API_KEY` | OpenAI API key for AI features | No | - |
| `VITE_API_URL` | Frontend API URL | No | http://localhost:8000 |
| `DEBUG` | Debug mode | No | false |

.env file to paste inside frontend, backend, and codeCrew folder

### Table Plus Software to View The Tables
table plus: to view database


### Ports

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 5173 | React development server |
| Backend | 8000 | FastAPI server |
| Database | 5432 | PostgreSQL database |

## 🎯 Getting Started

### For Teachers

1. **Sign Up**: Create a teacher account
2. **Create Classes**: Set up your classes
3. **Add Students**: Invite students to your classes
4. **Start Sessions**: Create live, quiz, or whiteboard sessions
5. **Use AI Features**: Generate quiz questions with AI

### For Students

1. **Sign Up**: Create a student account
2. **Join Classes**: Enter class codes provided by teachers
3. **Participate**: Join live sessions and take quizzes
4. **Collaborate**: Use the whiteboard and chat features

## 🧠 AI Features

The platform includes AI-powered quiz generation:

- **Subjects**: Science, Math, English, History, Geography
- **Difficulty Levels**: Easy, Medium, Hard
- **Grade Levels**: Primary, Middle, High School
- **Custom Topics**: Specify topics for targeted questions

To enable AI features:
1. Get an OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add it to your `.env` file as `OPENAI_API_KEY`

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild services
docker-compose build

# Reset database (removes all data)
docker-compose down -v
docker-compose up -d
```

## 🔍 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   lsof -i :5173  # or :8000, :5432
   
   # Change ports in .env file
   FRONTEND_PORT=3000
   BACKEND_PORT=8001
   ```

2. **Database Connection Issues**
   ```bash
   # Check if database is running
   docker-compose ps
   
   # View database logs
   docker-compose logs db
   ```

3. **AI Features Not Working**
   - Ensure `OPENAI_API_KEY` is set in `.env`
   - Check your OpenAI account has credits
   - Verify the API key is valid

4. **Frontend Can't Connect to Backend**
   - Check `VITE_API_URL` in `.env`
   - Ensure backend is running on the correct port
   - Check CORS settings

### Useful Commands

```bash
# Check service status
docker-compose ps

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db

# Access database directly
docker-compose exec db psql -U postgres -d codecrew

# Restart a specific service
docker-compose restart backend
```

## 📚 API Documentation

Once the application is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔒 Security

- All passwords are hashed using bcrypt
- JWT tokens for authentication
- Environment variables for sensitive data
- CORS protection enabled
- Input validation on all endpoints
- SQL injection protection through SQLAlchemy

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. View the logs: `docker-compose logs -f`
3. Check the API documentation: http://localhost:8000/docs
4. Create an issue in the repository

---

**Happy Coding! 🎉** 