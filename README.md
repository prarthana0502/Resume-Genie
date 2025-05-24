
# 🧞‍♂️ Resume Genie

**Resume Genie** is an AI-powered interview preparation assistant that automatically generates customized interview questions from job descriptions and resumes. Built using a multi-agent architecture, it leverages NLP and large language models to personalize and streamline the hiring and preparation process.

---

## 🚀 Features

- 🔍 **Automated Skill Extraction** from job descriptions using NLP (spaCy)
- 🤖 **AI-powered Question Generation** (technical + behavioral) via Gemini/OpenAI API
- 🧠 **Question Difficulty Categorization** (Easy, Medium, Hard) using rule-based agents
- 🧑‍💻 **Multi-Agent Architecture** powered by CrewAI
- 🌐 **Interactive Web Interface** with React.js frontend and FastAPI backend
- 📄 **Resume & JD Upload** support for dynamic question generation
- 📊 **High Accuracy** (85%+ in question categorization) and 4.6/5 user satisfaction

---

## 🛠️ Tech Stack

| Layer       | Tools / Libraries                     |
|-------------|----------------------------------------|
| Frontend    | React.js, JavaScript, HTML, CSS        |
| Backend     | FastAPI (Python)                       |
| NLP Engine  | spaCy                                  |
| AI/LLM API  | Gemini API / OpenAI GPT                |
| Agent System| CrewAI                                 |
| Deployment  | Streamlit (prototype), GitHub Pages    |

---

## ⚙️ Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/resume-genie.git
cd resume-genie
```

### 2. Setup Backend
```bash
cd backend
pip install -r requirements.txt
cd src
uvicorn Backend:app --reload --host 127.0.0.1 --port 8000
```

### 3. Setup Frontend
```bash
cd frontend
npm install
npm start
```

---

## 🧪 Sample Input/Output

**Input:** Job description for "Software Developer"  
**Extracted Skills:** Python, REST APIs, SQL, Agile  
**Generated Questions:**
| Type       | Difficulty | Sample Question |
|------------|------------|-----------------|
| Technical  | Easy       | What is a REST API? |
| Technical  | Medium     | How would you connect Python to a SQL DB? |
| Technical  | Hard       | How to scale a REST API in microservices? |
| Behavioral | Medium     | How do you handle feedback during Agile sprints? |

---

## 🎯 Future Enhancements

- 🤝 Integration with job portals (LinkedIn, Indeed)
- 🌍 Multi-language support
- 📊 Analytics dashboard for HR managers
- 🗣️ Voice-based interface for interview simulation
- ☁️ Cloud deployment on AWS/Azure with database

---

## 👥 Contributors

- Prarthana Patil - [`@prarthana0502`](https://github.com/prarthana0502)  
- Shivaraj Manikashetti  -['@shivaraj245'(https://github.com/shivaraj245)
- Naipunya P  

---

## 📄 License

This project is licensed under the MIT License.  
© 2025 RV University - For academic and non-commercial use only.
