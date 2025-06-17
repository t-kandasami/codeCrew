# 🤖 AI Quiz Generation Setup

## Overview
The CodeCrew platform now includes AI-powered quiz generation using OpenAI's GPT models. Teachers can automatically generate quiz questions for their sessions.

## Features
- **AI Quiz Generation**: Generate multiple-choice questions using AI
- **Subject Support**: Science, Math, English, History, Geography
- **Difficulty Levels**: Easy, Medium, Hard
- **Grade Levels**: Primary, Middle, High School
- **Question Editing**: Review and edit generated questions before saving

## Setup Instructions

### 1. Get OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the API key (starts with `sk-`)

### 2. Configure Environment Variables
Add the following to your backend `.env` file:

```env
# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here
```

### 3. Install Dependencies
The OpenAI dependency has been added to `requirements.txt`. Rebuild your backend:

```bash
# If using Docker
docker-compose build backend

# If running locally
pip install -r requirements.txt
```

### 4. Restart Backend
Restart your backend service to load the new environment variables.

## Usage

### For Teachers
1. Navigate to a Quiz Session
2. Click on the "AI Generator" tab (only visible to teachers)
3. Select subject, topic, difficulty, and grade level
4. Choose number of questions (5-20)
5. Click "Generate Questions with AI"
6. Review and edit generated questions
7. Click "Save to Session" to add them to your quiz

### API Endpoints
- `POST /ai/generate-questions` - Generate quiz questions

## Supported Subjects
- **Science**: Biology, Chemistry, Physics, Earth Science, Environmental Science
- **Mathematics**: Algebra, Geometry, Statistics, Problem Solving
- **English**: Grammar, Literature, Writing, Vocabulary, Reading Comprehension
- **History**: World History, Political Science, Historical Analysis
- **Geography**: Physical Geography, Human Geography, Environmental Geography

## Security
- Only teachers can access AI generation features
- API calls require authentication
- Questions are validated before saving

## Troubleshooting

### Common Issues
1. **"AI service not configured"**: Check that `OPENAI_API_KEY` is set in your environment
2. **"Failed to generate questions"**: Verify your OpenAI API key is valid and has credits
3. **"Not enough valid questions"**: Try reducing the question count or changing the topic

### API Key Security
- Never commit your API key to version control
- Use environment variables for configuration
- Rotate your API key regularly

## Cost Considerations
- OpenAI API usage incurs costs based on token usage
- GPT-3.5-turbo is used for cost efficiency
- Monitor your OpenAI usage dashboard for costs

## Future Enhancements
- Support for more subjects and topics
- Custom question templates
- Question difficulty auto-adjustment
- Integration with learning analytics 