import os
from fastapi import HTTPException
from pydantic import BaseModel
import traceback
import json
from typing import List, Optional

# Create the OpenAI client only if API key is available
client = None
api_key = os.getenv("OPENAI_API_KEY")
print(f"DEBUG: OpenAI API Key found: {bool(api_key)}")
print(f"DEBUG: API Key length: {len(api_key) if api_key else 0}")

if api_key:
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        print("DEBUG: OpenAI client created successfully")
    except ImportError:
        print("Warning: OpenAI package not installed. AI features will be disabled.")
    except Exception as e:
        print(f"Warning: Failed to create OpenAI client: {e}")
else:
    print("Warning: OPENAI_API_KEY not found in environment. AI features will be disabled.")

class QuestionGenerationRequest(BaseModel):
    subject: str
    topic: Optional[str] = None
    difficulty: str = "medium"  # easy, medium, hard
    count: int = 10
    grade_level: str = "primary"  # primary, middle, high

class QuestionGenerationResponse(BaseModel):
    questions: List[dict]
    subject: str
    topic: Optional[str] = None
    difficulty: str
    count: int

def generate_quiz_questions(request: QuestionGenerationRequest) -> QuestionGenerationResponse:
    """
    Generate quiz questions using OpenAI
    """
    if not client:
        raise HTTPException(status_code=503, detail="AI service not configured. Please set OPENAI_API_KEY environment variable.")
    
    # Define subject-specific prompts
    subject_prompts = {
        "science": {
            "primary": "Generate quiz questions for primary school students about science topics including animals, plants, weather, space, human body, and matter.",
            "middle": "Generate quiz questions for middle school students about science topics including biology, chemistry, physics, earth science, and environmental science.",
            "high": "Generate quiz questions for high school students about advanced science topics including biology, chemistry, physics, and environmental science."
        },
        "math": {
            "primary": "Generate quiz questions for primary school students about math topics including addition, subtraction, multiplication, division, fractions, and shapes.",
            "middle": "Generate quiz questions for middle school students about math topics including algebra, geometry, statistics, and problem solving.",
            "high": "Generate quiz questions for high school students about advanced math topics including algebra, geometry, trigonometry, calculus, and statistics."
        },
        "english": {
            "primary": "Generate quiz questions for primary school students about English topics including grammar, vocabulary, reading comprehension, spelling, punctuation, and synonyms.",
            "middle": "Generate quiz questions for middle school students about English topics including grammar, literature, writing, vocabulary, and reading comprehension.",
            "high": "Generate quiz questions for high school students about English topics including literature analysis, grammar, writing, vocabulary, and critical reading."
        },
        "history": {
            "primary": "Generate quiz questions for primary school students about history topics including important people, events, and basic historical concepts.",
            "middle": "Generate quiz questions for middle school students about history topics including world history, geography, and historical events.",
            "high": "Generate quiz questions for high school students about history topics including world history, political science, and historical analysis."
        },
        "geography": {
            "primary": "Generate quiz questions for primary school students about geography topics including continents, countries, maps, and basic geographical concepts.",
            "middle": "Generate quiz questions for middle school students about geography topics including world geography, climate, and cultural geography.",
            "high": "Generate quiz questions for high school students about geography topics including physical geography, human geography, and environmental geography."
        }
    }
    
    if request.subject not in subject_prompts:
        raise HTTPException(status_code=400, detail=f"Invalid subject. Available subjects: {', '.join(subject_prompts.keys())}")
    
    if request.grade_level not in subject_prompts[request.subject]:
        raise HTTPException(status_code=400, detail=f"Invalid grade level for {request.subject}")
    
    # Build the prompt
    base_prompt = subject_prompts[request.subject][request.grade_level]
    
    if request.topic:
        base_prompt += f" Focus specifically on: {request.topic}."
    
    # Add difficulty context
    difficulty_context = {
        "easy": "Make questions simple and straightforward with clear answers.",
        "medium": "Make questions moderately challenging with some complexity.",
        "hard": "Make questions challenging and thought-provoking."
    }
    base_prompt += f" {difficulty_context.get(request.difficulty, difficulty_context['medium'])}"
    
    system_msg = """You are an expert educational content creator. Generate multiple choice questions for students.

IMPORTANT: Your response must be ONLY a valid JSON array, with no additional text, explanations, or formatting. The JSON should follow this exact structure:

[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "Option A",
    "explanation": "Brief explanation of why this is correct"
  }
]

Where 'correct_answer' is the exact text of the correct option."""
    
    user_msg = f"{base_prompt} Generate exactly {request.count} questions. Make sure questions are age-appropriate, cover various aspects of the topic, and have clear correct answers. Return ONLY the JSON array with no additional text."
    
    try:
        print(f"Generating {request.count} questions for subject: {request.subject}, grade: {request.grade_level}, difficulty: {request.difficulty}")
        
        resp = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": user_msg},
            ],
            temperature=0.7,
            max_tokens=2000,
        )
        
        response_text = resp.choices[0].message.content.strip()
        print("Raw OpenAI response:", response_text[:200] + "..." if len(response_text) > 200 else response_text)
        
        # Try to parse the JSON response
        try:
            # Clean up the response - remove any markdown formatting
            cleaned_response = response_text.strip()
            if cleaned_response.startswith('```json'):
                cleaned_response = cleaned_response[7:]
            if cleaned_response.endswith('```'):
                cleaned_response = cleaned_response[:-3]
            cleaned_response = cleaned_response.strip()
            
            questions = json.loads(cleaned_response)
            
            # Validate the structure
            if not isinstance(questions, list):
                raise ValueError("Response is not a list")
            
            valid_questions = []
            for q in questions:
                if (isinstance(q, dict) and 
                    'question' in q and 
                    'options' in q and 
                    'correct_answer' in q and
                    isinstance(q['options'], list) and 
                    len(q['options']) == 4 and
                    q['correct_answer'] in q['options']):
                    valid_questions.append(q)
            
            if len(valid_questions) < min(5, request.count):
                raise ValueError(f"Not enough valid questions generated: {len(valid_questions)}")
            
            print(f"Generated {len(valid_questions)} valid questions")
            return QuestionGenerationResponse(
                questions=valid_questions[:request.count],
                subject=request.subject,
                topic=request.topic,
                difficulty=request.difficulty,
                count=len(valid_questions[:request.count])
            )
            
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}")
            print(f"Response text: {response_text}")
            raise HTTPException(status_code=500, detail="Failed to parse generated questions")
        except ValueError as e:
            print(f"Validation error: {e}")
            raise HTTPException(status_code=500, detail=str(e))
            
    except Exception as e:
        print("Exception in generate_quiz_questions:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e)) 