from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import spacy
from dotenv import load_dotenv
import os
import re
import time
import asyncio
from typing import Optional

# Load environment variables
load_dotenv()

# Set Gemini API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
os.environ["GEMINI_API_KEY"] = GEMINI_API_KEY

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)

# Load spaCy model
nlp = spacy.load("en_core_web_sm")

# Initialize FastAPI app
app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class MatchRequest(BaseModel):
    resumeText: str
    jobDescriptionText: str
    questionCount: Optional[dict] = {
        "easy": 2,
        "medium": 2,
        "hard": 1
    }

class ChatRequest(BaseModel):
    conversation: list

class EvaluationRequest(BaseModel):
    question: str
    answer: str
    resumeText: str
    jobDescriptionText: str

# Local matching algorithm using spaCy
class LocalMatcher:
    """Uses spaCy NLP and string matching to analyze resume-job compatibility"""
    
    def extract_skills(self, text):
        """Extract skills from text using spaCy and keyword matching"""
        doc = nlp(text.lower())
        
        # Common skill keywords
        skill_keywords = {
            'python', 'javascript', 'java', 'c++', 'c#', 'go', 'rust', 'php', 'ruby', 'swift',
            'typescript', 'kotlin', 'sql', 'nosql', 'mongodb', 'postgresql', 'mysql',
            'react', 'angular', 'vue', 'django', 'flask', 'fastapi', 'node', 'express',
            'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'git', 'linux', 'windows',
            'api', 'rest', 'graphql', 'html', 'css', 'json', 'xml', 'agile', 'scrum',
            'machine learning', 'data science', 'ai', 'nlp', 'deep learning', 'tensorflow',
            'communication', 'leadership', 'problem-solving', 'teamwork'
        }
        
        found_skills = set()
        for token in doc:
            if token.text in skill_keywords:
                found_skills.add(token.text)
        
        # Also check for multi-word skills
        text_lower = text.lower()
        for skill in ['machine learning', 'data science', 'project management', 'business analysis']:
            if skill in text_lower:
                found_skills.add(skill)
        
        return list(found_skills)
    
    def calculate_match_score(self, resume_text, job_text):
        """Calculate match percentage"""
        resume_skills = set(self.extract_skills(resume_text))
        job_skills = set(self.extract_skills(job_text))
        
        if not job_skills:
            return 50, [], []
        
        matched = resume_skills & job_skills
        missing = job_skills - resume_skills
        
        score = int((len(matched) / len(job_skills)) * 100) if job_skills else 50
        score = min(score, 100)
        
        return score, list(matched), list(missing)

# Initialize matcher
matcher = LocalMatcher()

# Global model instance for evaluation
model = genai.GenerativeModel("gemini-2.0-flash")

# Offline question generation fallback (no API calls)
def generate_offline_questions(resume_text, job_text):
    """Generate interview questions without using API - works offline and avoids rate limits"""
    questions = []
    
    # Extract key topics from both texts
    resume_lower = resume_text.lower()
    job_lower = job_text.lower()
    
    # Easy questions (general knowledge)
    easy_questions = [
        "What interests you most about this position?",
        "Can you describe your understanding of the role based on the job description?",
        "What are your strongest skills that align with this position?",
        "How do you approach learning new technologies or skills?",
        "Tell us about your experience working in similar roles.",
    ]
    
    # Medium questions (experience-based)
    medium_questions = [
        "Describe a project where you used relevant technical skills.",
        "How do you handle working with cross-functional teams?",
        "Tell us about a challenge you faced and how you overcame it.",
        "What's your approach to problem-solving in your field?",
        "How do you stay updated with industry trends and developments?",
        "Describe your experience with the technologies mentioned in this job description.",
        "How have you applied your leadership skills in previous roles?",
    ]
    
    # Hard questions (advanced problem-solving)
    hard_questions = [
        "Design and explain how you would approach a complex project using your skills.",
        "What are the biggest challenges in this industry and how would you address them?",
        "Tell us about an innovative solution you've implemented.",
        "How would you scale your expertise to handle the responsibilities of this role?",
        "What is your long-term career vision and how does this position align with it?",
    ]
    
    # Select appropriate questions based on resume content
    import random
    random.seed(hash(resume_text + job_text) % 2**32)  # Consistent questions for same input
    
    questions.extend([
        {'question': easy_questions[i % len(easy_questions)], 'difficulty': 'easy'}
        for i in range(2)
    ])
    
    questions.extend([
        {'question': medium_questions[i % len(medium_questions)], 'difficulty': 'medium'}
        for i in range(2)
    ])
    
    questions.extend([
        {'question': hard_questions[0], 'difficulty': 'hard'}
    ])
    
    return questions

async def generate_questions_with_retry(resume_text, job_text, max_retries=2):
    """Generate interview questions with fallback to offline generation"""
    for attempt in range(max_retries):
        try:
            prompt = f"""Generate 5 concise interview questions based on this resume and job description.

Resume (key points):
{resume_text[:2000]}

Job Description (key requirements):
{job_text[:2000]}

Format as:
Easy: [question 1]
Easy: [question 2]
Medium: [question 1]
Medium: [question 2]
Hard: [question 1]"""

            response = model.generate_content(prompt)
            
            # Parse questions by difficulty
            questions = []
            
            for line in response.text.split('\n'):
                line = line.strip()
                if line.startswith('Easy:'):
                    questions.append({
                        'question': line.replace('Easy:', '').strip(),
                        'difficulty': 'easy'
                    })
                elif line.startswith('Medium:'):
                    questions.append({
                        'question': line.replace('Medium:', '').strip(),
                        'difficulty': 'medium'
                    })
                elif line.startswith('Hard:'):
                    questions.append({
                        'question': line.replace('Hard:', '').strip(),
                        'difficulty': 'hard'
                    })
            
            # If we got questions, return them
            if questions:
                return questions
            
        except Exception as e:
            error_msg = str(e)
            print(f"Attempt {attempt + 1} failed: {error_msg}")
            
            # Check if it's a rate limit error
            if '429' in error_msg or 'quota' in error_msg.lower():
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt  # Exponential backoff: 1s, 2s
                    print(f"Rate limited. Retrying in {wait_time}s... (Attempt {attempt + 1}/{max_retries})")
                    await asyncio.sleep(wait_time)
                    continue
                else:
                    # Fall back to offline generation
                    print("API rate limit exceeded. Falling back to offline question generation.")
                    return generate_offline_questions(resume_text, job_text)
            else:
                # For other errors, also fall back
                print(f"API error: {error_msg}. Using offline question generation.")
                return generate_offline_questions(resume_text, job_text)
    
    # Final fallback to offline generation
    return generate_offline_questions(resume_text, job_text)

@app.post("/api/match")
async def match_resume_job(request: MatchRequest):
    try:
        # Validate input
        if not request.resumeText or not request.resumeText.strip():
            raise HTTPException(status_code=400, detail="Resume text cannot be empty")
        if not request.jobDescriptionText or not request.jobDescriptionText.strip():
            raise HTTPException(status_code=400, detail="Job description cannot be empty")
        
        # Truncate texts to reduce token usage
        resume_text = request.resumeText[:3000]
        job_text = request.jobDescriptionText[:3000]
        
        # Use local analysis for matching (no API call needed)
        match_score, matched_skills, missing_skills = matcher.calculate_match_score(resume_text, job_text)
        
        # Generate match analysis text
        match_analysis = f"""
Match Score: {match_score}%

Matched Skills: {', '.join(matched_skills) if matched_skills else 'None identified'}

Missing Skills: {', '.join(missing_skills) if missing_skills else 'All required skills present!'}

Compatibility Analysis:
- Your resume demonstrates {match_score}% alignment with the job requirements.
- You have {len(matched_skills)} of the key skills mentioned in the job description.
- Focus on developing {len(missing_skills)} additional skills to strengthen your candidacy.
- Consider highlighting your transferable skills and relevant experience.
- Tailor your cover letter to address the specific requirements.
"""
        
        # Generate interview questions with retry logic (single API call)
        questions = await generate_questions_with_retry(resume_text, job_text)
        
        # Return response
        return {
            "match_score": match_analysis,
            "interview_questions": questions,
            "score": match_score,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "status": "success"
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = str(e)
        print(f"Error in match_resume_job: {error_detail}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=error_detail)

# Add a new endpoint for generating additional questions
@app.post("/api/more-questions")
async def generate_more_questions(request: MatchRequest):
    try:
        resume_text = request.resumeText[:3000]
        job_text = request.jobDescriptionText[:3000]
        
        # Generate additional questions with retry logic
        additional_questions = await generate_questions_with_retry(resume_text, job_text, max_retries=3)

        return {
            "additional_questions": additional_questions,
            "status": "success"
        }

    except Exception as e:
        print(f"Error generating additional questions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/evaluate")
async def evaluate_answer(request: EvaluationRequest):
    try:
        prompt = f"""Evaluate this interview answer and provide feedback in this exact format:

Overall Score: [Give a score out of 10]

Strengths:
• [Key strength point 1]
• [Key strength point 2]

Areas for Improvement:
• [Improvement point 1]
• [Improvement point 2]

Quick Tip: [One short, actionable improvement tip]

Question: {request.question}
Answer: {request.answer}

Base your evaluation on:
- Relevance to the question
- Completeness of response
- Technical accuracy
- Communication clarity
"""
        response = model.generate_content(prompt)
        return {"evaluation": response.text.strip()}
    except Exception as e:
        error_msg = str(e)
        print(f"Error in /api/evaluate: {error_msg}")
        
        # Fallback to basic evaluation if API fails
        if '429' in error_msg or 'quota' in error_msg.lower():
            # Generate offline evaluation
            answer_length = len(request.answer.split())
            score = min(10, max(5, answer_length // 20))  # Base score on answer length
            
            fallback_evaluation = f"""Overall Score: {score}/10

Strengths:
• You provided a response to the question
• Your answer demonstrates engagement with the topic

Areas for Improvement:
• Consider providing more specific examples from your experience
• Include measurable outcomes or metrics where applicable

Quick Tip: Use the STAR method (Situation, Task, Action, Result) to structure your answers more effectively."""
            
            return {"evaluation": fallback_evaluation}
        
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
