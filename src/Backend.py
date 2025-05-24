from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import spacy
from dotenv import load_dotenv
import os
import re
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

# Agent classes using Gemini
class ResumeAnalysisAgent:
    def process(self, resume_text):
        model = genai.GenerativeModel("gemini-2.0-flash")
        prompt = f"""Extract the following from this resume:
- Key Skills
- Experience Summary
- Education
- Certifications

Resume:
{resume_text}
"""
        response = model.generate_content(prompt)
        return response.text.strip()

class JobDescriptionAnalysisAgent:
    def process(self, job_description_text):
        model = genai.GenerativeModel("gemini-2.0-flash")
        prompt = f"""Extract the following from this job description:
- Required Skills
- Experience Requirements
- Education Requirements

Job Description:
{job_description_text}
"""
        response = model.generate_content(prompt)
        return response.text.strip()

class MatchingAgent:
    def process(self, resume_data, job_data):
        model = genai.GenerativeModel("gemini-2.0-flash")
        prompt = f"""Compare the following resume and job description and provide:
- Match Score (0-100%) 
- Missing Skills
- Overqualified Skills
- Compatibility Analysis in around 5 bulleted sentences.

Resume Data:
{resume_data}

Job Description Data:
{job_data}
"""
        response = model.generate_content(prompt)
        return response.text.strip()

class QuestionGenerationAgent:
    def process(self, resume_data, job_data, match_score):
        model = genai.GenerativeModel("gemini-2.0-flash")
        prompt = f"""Based on the resume and job description below, and a match score of {match_score}, generate 5 relevant interview questions.

Resume Data:
{resume_data}

Job Description Data:
{job_data}
"""
        response = model.generate_content(prompt)
        return response.text.strip()

# Resume-Job Matching System
class ResumeJobMatchSystem:
    def __init__(self):
        self.resume_agent = ResumeAnalysisAgent()
        self.job_agent = JobDescriptionAnalysisAgent()
        self.match_agent = MatchingAgent()
        self.q_agent = QuestionGenerationAgent()

    def run(self, resume_text, job_description_text):
        resume_data = self.resume_agent.process(resume_text)
        job_data = self.job_agent.process(job_description_text)
        match_result = self.match_agent.process(resume_data, job_data)
        
        # Extract score using regex (optional enhancement)
        score_match = re.search(r"(\d{1,3})\s*%", match_result)
        match_score = score_match.group(1) if score_match else "N/A"
        
        questions_raw = self.q_agent.process(resume_data, job_data, match_score)
        questions = [q.strip("-• ") for q in questions_raw.split("\n") if q.strip()]
        
        return {
            "match_score": match_result,
            "interview_questions": questions
        }

# Global model instance for evaluation
model = genai.GenerativeModel("gemini-2.0-flash")

@app.post("/api/match")
async def match_resume_job(request: MatchRequest):
    try:
        matcher = ResumeJobMatchSystem()
        results = matcher.run(request.resumeText, request.jobDescriptionText)
        
        prompt = f"""Based on the resume and job description, generate interview questions in three difficulty levels:
        Generate 2 Easy questions: Basic concepts and fundamentals
        Generate 2 Medium questions: Intermediate concepts and practical applications
        Generate 1 Hard question: Advanced concepts and complex problem-solving

        Format your response exactly like this:
        Easy:
        First easy question
        Second easy question

        Medium:
        First medium question
        Second medium question

        Hard:
        Hard question

        Resume: {request.resumeText}
        Job Description: {request.jobDescriptionText}
        """

        response = model.generate_content(prompt)
        
        # Parse questions by difficulty
        questions = []
        current_difficulty = None
        
        for line in response.text.split('\n'):
            line = line.strip()
            if not line:
                continue
                
            if line.lower() == 'easy:':
                current_difficulty = 'easy'
            elif line.lower() == 'medium:':
                current_difficulty = 'medium'
            elif line.lower() == 'hard:':
                current_difficulty = 'hard'
            elif line and not line.endswith(':'):
                questions.append({
                    'question': line,
                    'difficulty': current_difficulty
                })

        return {
            "match_score": results["match_score"],
            "interview_questions": questions
        }

    except Exception as e:
        print(f"Error in match_resume_job: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Add a new endpoint for generating additional questions
@app.post("/api/more-questions")
async def generate_more_questions(request: MatchRequest):
    try:
        prompt = f"""Generate exactly 5 new interview questions with specific difficulty levels:
        2 Easy questions: Basic concepts and fundamentals
        2 Medium questions: Intermediate concepts and practical applications
        1 Hard question: Advanced concepts and complex problem-solving

        Format your response EXACTLY like this:
        Easy:
        First easy question
        Second easy question

        Medium:
        First medium question
        Second medium question

        Hard:
        Hard question

        Note: Make these questions unique and different from typical questions.
        Base questions on this context:

        Resume: {request.resumeText}
        Job Description: {request.jobDescriptionText}
        """

        response = model.generate_content(prompt)
        
        # Parse questions by difficulty
        additional_questions = []
        current_difficulty = None
        
        for line in response.text.split('\n'):
            line = line.strip()
            if not line:
                continue
                
            if line.lower() == 'easy:':
                current_difficulty = 'easy'
            elif line.lower() == 'medium:':
                current_difficulty = 'medium'
            elif line.lower() == 'hard:':
                current_difficulty = 'hard'
            elif line and not line.endswith(':'):
                additional_questions.append({
                    'question': line,
                    'difficulty': current_difficulty
                })

        return {
            "additional_questions": additional_questions
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
        print(f"Error in /api/evaluate: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
