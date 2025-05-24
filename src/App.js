import React, { useState, useEffect } from "react";
import "./App.css";
import "./Dashboard.css"; // Import the new Dashboard CSS
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { useAuth } from './AuthContext';
import Auth from './Auth';
import LandingPage from './LandingPage';
import Logo from './RG_logo.jpg'; // Import the logo

const API_URL = "http://localhost:8000";

// Add default responses
const DEFAULT_RESPONSES = {
  qualifiedSkills: [
    "Communication Skills",
    "Team Collaboration",
    "Problem Solving",
    "Time Management",
    "Adaptability"
  ],
  missingSkills: [
    "Advanced Technical Skills",
    "Industry-specific Knowledge",
    "Leadership Experience",
    "Project Management",
    "Specialized Certifications"
  ],
  analysis: "Based on the resume and job description analysis, there are several areas where your profile aligns well with the position, and some areas where additional development could enhance your candidacy. Focus on developing the missing skills while highlighting your existing strengths in your application."
};

// Add helper function to validate and clean skills
const cleanSkillsList = (skills) => {
  if (!Array.isArray(skills)) return [];
  return skills
    .map(skill => skill.trim())
    .filter(skill => skill && skill.length > 2)
    .filter(skill => !skill.toLowerCase().includes('skills') && !skill.toLowerCase().includes('analysis'));
};

// Add helper function to validate analysis text
const cleanAnalysisText = (text) => {
  if (!text || typeof text !== 'string') return DEFAULT_RESPONSES.analysis;
  const cleaned = text.trim();
  return cleaned.length > 50 ? cleaned : DEFAULT_RESPONSES.analysis;
};

// Add match score calculation function
const calculateMatchScore = (resumeText, jobDescriptionText) => {
  try {
    // Convert texts to lowercase for case-insensitive matching
    const resume = resumeText.toLowerCase();
    const jobDesc = jobDescriptionText.toLowerCase();

    // Define scoring weights
    const weights = {
      skills: 0.4,
      experience: 0.3,
      education: 0.2,
      keywords: 0.1
    };

    // Extract and match skills
    const commonSkills = extractSkills(resume).filter(skill => 
      jobDesc.includes(skill.toLowerCase())
    );
    const totalSkills = extractSkills(jobDesc);
    const skillsScore = totalSkills.length > 0 ? 
      (commonSkills.length / totalSkills.length) * weights.skills * 100 : 0;

    // Extract and match experience
    const experienceScore = calculateExperienceScore(resume, jobDesc) * weights.experience * 100;

    // Extract and match education
    const educationScore = calculateEducationScore(resume, jobDesc) * weights.education * 100;

    // Match keywords
    const keywordsScore = calculateKeywordsScore(resume, jobDesc) * weights.keywords * 100;

    // Calculate final score
    const finalScore = Math.round(skillsScore + experienceScore + educationScore + keywordsScore);

    return {
      score: finalScore.toString(),
      breakdown: {
        skills: Math.round(skillsScore),
        experience: Math.round(experienceScore),
        education: Math.round(educationScore),
        keywords: Math.round(keywordsScore)
      }
    };
  } catch (error) {
    console.error('Error calculating match score:', error);
    return { score: '0', breakdown: { skills: 0, experience: 0, education: 0, keywords: 0 } };
  }
};

// Helper function to extract skills
const extractSkills = (text) => {
  const commonSkills = [
    'javascript', 'python', 'java', 'c++', 'c#', 'ruby', 'php',
    'react', 'angular', 'vue', 'node.js', 'express', 'django',
    'flask', 'spring', 'sql', 'mongodb', 'aws', 'azure', 'gcp',
    'docker', 'kubernetes', 'git', 'agile', 'scrum', 'ci/cd',
    'machine learning', 'ai', 'data science', 'analytics',
    'project management', 'leadership', 'communication'
  ];

  return commonSkills.filter(skill => text.includes(skill.toLowerCase()));
};

// Helper function to calculate experience score
const calculateExperienceScore = (resume, jobDesc) => {
  const experienceKeywords = ['experience', 'years', 'worked', 'job', 'position', 'role'];
  const resumeExp = experienceKeywords.filter(keyword => resume.includes(keyword)).length;
  const jobExp = experienceKeywords.filter(keyword => jobDesc.includes(keyword)).length;
  
  return jobExp > 0 ? Math.min(resumeExp / jobExp, 1) : 0;
};

// Helper function to calculate education score
const calculateEducationScore = (resume, jobDesc) => {
  const educationKeywords = ['bachelor', 'master', 'phd', 'degree', 'diploma', 'certification'];
  const resumeEdu = educationKeywords.filter(keyword => resume.includes(keyword)).length;
  const jobEdu = educationKeywords.filter(keyword => jobDesc.includes(keyword)).length;
  
  return jobEdu > 0 ? Math.min(resumeEdu / jobEdu, 1) : 0;
};

// Helper function to calculate keywords score
const calculateKeywordsScore = (resume, jobDesc) => {
  const keywords = jobDesc.split(/\W+/).filter(word => word.length > 4);
  const matches = keywords.filter(keyword => resume.includes(keyword.toLowerCase()));
  
  return keywords.length > 0 ? matches.length / keywords.length : 0;
};

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
}

function Dashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescFile, setJobDescFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ resume: 0, jobDesc: 0 });
  const [questionResponses, setQuestionResponses] = useState({});
  const [evaluations, setEvaluations] = useState({});
  const [evaluationLoading, setEvaluationLoading] = useState({});
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState('easy');
  const [isHovered, setIsHovered] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      // Clear any existing state
      setResumeFile(null);
      setJobDescFile(null);
      setResult(null);
      setQuestionResponses({});
      setEvaluations({});
      // Navigate to landing page
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  // Add click outside handler to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isProfileOpen && !event.target.closest('.user-profile-container')) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    if (file) {
      setUploadProgress(prev => ({ ...prev, [fileType]: 0 }));
      
      const reader = new FileReader();
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(prev => ({ ...prev, [fileType]: progress }));
        }
      };
      
      reader.onload = () => {
        if (fileType === "resume") {
          setResumeFile(file);
        } else if (fileType === "jobDesc") {
          setJobDescFile(file);
        }
        setUploadProgress(prev => ({ ...prev, [fileType]: 100 }));
      };
      
      // Handle different file types
      if (file.type === 'application/pdf') {
        reader.readAsArrayBuffer(file);
      } else if (file.type === 'application/msword' || 
                 file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    }
  };

  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const formatQuestions = (questions) => {
    if (!Array.isArray(questions)) return [];
    
    return questions
      .filter(q => q && typeof q === 'object')
      .filter(q => {
        const questionText = q.question || '';
        return !questionText.toLowerCase().includes('here are') && 
               !questionText.toLowerCase().includes('rationale:');
      })
      .map(q => ({
        question: q.question.split('Rationale:')[0].trim().replace(/^\d+\.\s*/, ''),
        difficulty: q.difficulty || 'medium'
      }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resumeFile || !jobDescFile) {
      alert("Please upload both files.");
      return;
    }
  
    setLoading(true);
    try {
      const resumeText = await readFileAsText(resumeFile);
      const jobDescriptionText = await readFileAsText(jobDescFile);
  
      const response = await fetch(`${API_URL}/api/match`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ resumeText, jobDescriptionText }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('Backend /api/match response:', data);

      // Calculate match score using our new function
      const matchScoreResult = calculateMatchScore(resumeText, jobDescriptionText);
  
      const parsedMatchScore = {
        score: matchScoreResult.score,
        missingSkills: [],
        qualifiedSkills: [],
        analysis: '',
        breakdown: matchScoreResult.breakdown
      };
  
      if (data.match_score) {
        // Extract missing skills
        const missingSkillsSection = data.match_score.split(/Missing Skills:|Skills to Develop:/i)[1];
        if (missingSkillsSection) {
          const skillsText = missingSkillsSection.split(/Qualified Skills:|Compatibility Analysis:|Analysis:/i)[0];
          const extractedSkills = skillsText
            .split(/[•\-\*]/)
            .map(skill => skill.trim())
            .filter(skill => skill && 
              !skill.toLowerCase().includes('missing skills') && 
              !skill.toLowerCase().includes('skills to develop') &&
              !skill.toLowerCase().includes('qualified skills'));
          
          parsedMatchScore.missingSkills = cleanSkillsList(extractedSkills);
        }

        // Extract qualified skills
        const qualifiedSkillsSection = data.match_score.split(/Qualified Skills:|Matching Skills:/i)[1];
        if (qualifiedSkillsSection) {
          const skillsText = qualifiedSkillsSection.split(/Missing Skills:|Skills to Develop:|Compatibility Analysis:|Analysis:/i)[0];
          const extractedSkills = skillsText
            .split(/[•\-\*]/)
            .map(skill => skill.trim())
            .filter(skill => skill && 
              !skill.toLowerCase().includes('qualified skills') && 
              !skill.toLowerCase().includes('matching skills'));
          
          parsedMatchScore.qualifiedSkills = cleanSkillsList(extractedSkills);
        }
      
        const analysisSection = data.match_score.split(/Compatibility Analysis:|Analysis:/i)[1];
        if (analysisSection) {
          parsedMatchScore.analysis = cleanAnalysisText(analysisSection
            .split(/[•\-\*]/)
            .map(line => line.trim())
            .filter(line => line && !line.toLowerCase().includes('compatibility analysis') && !line.toLowerCase().includes('analysis'))
            .join('\n'));
        }
      }

      // Apply default values if sections are empty
      if (!parsedMatchScore.qualifiedSkills.length) {
        parsedMatchScore.qualifiedSkills = DEFAULT_RESPONSES.qualifiedSkills;
      }
      if (!parsedMatchScore.missingSkills.length) {
        parsedMatchScore.missingSkills = DEFAULT_RESPONSES.missingSkills;
      }
      if (!parsedMatchScore.analysis) {
        parsedMatchScore.analysis = DEFAULT_RESPONSES.analysis;
      }

      setResult({
        parsedMatchScore,
        interview_questions: formatQuestions(data.interview_questions)
      });
      
      setActiveTab('easy');
  
    } catch (error) {
      console.error("Error details:", error);
      alert("Failed to process the response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionResponse = async (questionIndex, response) => {
    if (!response?.trim()) {
      alert("Please provide an answer before submitting.");
      return;
    }

    setEvaluationLoading(prev => ({ ...prev, [questionIndex]: true }));
    try {
      const resumeText = await readFileAsText(resumeFile);
      const jobDescriptionText = await readFileAsText(jobDescFile);

      const [difficulty, index] = questionIndex.split('-');
      
      const question = result.interview_questions
        .filter(q => q.difficulty === difficulty)[index];

      if (!question) {
        throw new Error('Question not found');
      }

      const evalResponse = await fetch(`${API_URL}/api/evaluate`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          question: question.question,
          answer: response,
          resumeText,
          jobDescriptionText
        }),
      });

      if (!evalResponse.ok) {
        const errorData = await evalResponse.text();
        throw new Error(errorData || "Failed to get evaluation");
      }

      const evalData = await evalResponse.json();

      console.log(`Backend /api/evaluate response for question ${questionIndex}:`, evalData); // Log the evaluation response

      const formattedEvaluation = evalData.evaluation
        .split('\n')
        .filter(line => line.trim())
        .join('\n');

      setEvaluations(prev => ({
        ...prev,
        [questionIndex]: formattedEvaluation
      }));

    } catch (error) {
      console.error("Evaluation error:", error);
      alert("Failed to evaluate response. Please try again.");
    } finally {
      setEvaluationLoading(prev => ({ ...prev, [questionIndex]: false }));
    }
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const resumeText = await readFileAsText(resumeFile);
      const jobDescriptionText = await readFileAsText(jobDescFile);

      const response = await fetch(`${API_URL}/api/more-questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          resumeText,
          jobDescriptionText
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('Backend /api/more-questions response:', data); // Log the additional questions response

      const newQuestions = formatQuestions(data.additional_questions);
      
      setResult(prev => ({
        ...prev,
        interview_questions: [
          ...prev.interview_questions,
          ...newQuestions
        ]
      }));

    } catch (error) {
      console.error("Error loading more questions:", error);
      alert("Failed to load additional questions. Please try again.");
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="landing-container">
      {/* Modern Navigation Bar */}
      <nav className="dashboard-nav">
        <div className="logo-container" onClick={() => navigate('/')}>
          <img src={Logo} alt="Resume Genie Logo" className="site-logo" />
          <h1 className="title">
            Resume <span className="highlight">Genie</span>
          </h1>
        </div>
        <div className="nav-right">
          <div className="user-profile-container">
            <div 
              className="user-profile"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <img 
                src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${currentUser?.displayName || currentUser?.email?.split('@')[0]}`}
                alt="Profile" 
                className="user-avatar"
              />
              <span className="user-name">
                {currentUser?.displayName || currentUser?.email?.split('@')[0]}
              </span>
            </div>
            {isProfileOpen && (
              <div className="profile-dropdown">
                <button 
                  className="logout-btn"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content - Using single column layout */}
      <main className="main-container">
        <div className="dashboard-content">
          {/* Upload Section */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2 className="section-title">Upload Documents</h2>
              <p className="subtitle">Upload your resume and job description for AI analysis</p>
            </div>
            <div className="card-content">
              <form className="upload-form" onSubmit={handleSubmit}>
                {/* Resume Upload */}
                <div className="upload-field">
                  <label className="upload-label">Upload Resume</label>
                  <div className="upload-box">
                    <label className="upload-area">
                      <div className="upload-placeholder">
                        <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="upload-text">
                          {resumeFile ? resumeFile.name : 'Click to upload or drag and drop'}
                        </p>
                        <p className="upload-hint">
                          Supports PDF, DOC, DOCX, TXT
                        </p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={(e) => handleFileChange(e, "resume")}
                      />
                    </label>
                  </div>
                  {uploadProgress.resume > 0 && (
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${uploadProgress.resume}%` }}
                      ></div>
                    </div>
                  )}
                </div>

                {/* Job Description Upload */}
                <div className="upload-field">
                  <label className="upload-label">Upload Job Description</label>
                  <div className="upload-box">
                    <label className="upload-area">
                      <div className="upload-placeholder">
                        <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="upload-text">
                          {jobDescFile ? jobDescFile.name : 'Click to upload or drag and drop'}
                        </p>
                        <p className="upload-hint">
                          Supports PDF, DOC, DOCX, TXT
                        </p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={(e) => handleFileChange(e, "jobDesc")}
                      />
                    </label>
                  </div>
                  {uploadProgress.jobDesc > 0 && (
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${uploadProgress.jobDesc}%` }}
                      ></div>
                    </div>
                  )}
                </div>

                <div className="button-container">
                  <button
                    type="submit"
                    disabled={loading || !resumeFile || !jobDescFile}
                    className="cta-button"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                  >
                    {loading ? (
                      <>
                        <svg className="loading-spinner" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        Analyze Resume
                        <span className={`arrow ${isHovered ? 'arrow-hover' : ''}`}>→</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Analysis Results Section - Appears below upload */}
          {result && (
            <div className="dashboard-card">
              <div className="card-header">
                <h2 className="section-title">Analysis Results</h2>
                <p className="subtitle">Your personalized resume analysis and interview preparation</p>
              </div>
              <div className="card-content">
                <div className="results-container">
                  {/* Resume-Job Match Analysis Tab */}
                  <div className="analysis-tabs">
                    <div className="analysis-tab active">Resume-Job Match Analysis</div>
                  </div>

                  {/* Match Analysis Card */}
                  <div className="match-section">
                    <div className="match-score-grid">
                      <div className="match-score-card">
                        <div>
                          <h4 className="score-title">Match Score</h4>
                          <p className="score-subtitle">Compatibility with job requirements</p>
                        </div>
                        <div className="match-score-value">
                          {result.parsedMatchScore?.score || 0}%
                        </div>
                      </div>
                      {result.parsedMatchScore?.breakdown && (
                        <div className="score-breakdown">
                          <div className="breakdown-item">
                            <span className="breakdown-label">Skills Match</span>
                            <div className="breakdown-bar">
                              <div 
                                className="breakdown-fill" 
                                style={{ width: `${result.parsedMatchScore.breakdown.skills}%` }}
                              ></div>
                            </div>
                            <span className="breakdown-value">{result.parsedMatchScore.breakdown.skills}%</span>
                          </div>
                          <div className="breakdown-item">
                            <span className="breakdown-label">Experience</span>
                            <div className="breakdown-bar">
                              <div 
                                className="breakdown-fill" 
                                style={{ width: `${result.parsedMatchScore.breakdown.experience}%` }}
                              ></div>
                            </div>
                            <span className="breakdown-value">{result.parsedMatchScore.breakdown.experience}%</span>
                          </div>
                          <div className="breakdown-item">
                            <span className="breakdown-label">Education</span>
                            <div className="breakdown-bar">
                              <div 
                                className="breakdown-fill" 
                                style={{ width: `${result.parsedMatchScore.breakdown.education}%` }}
                              ></div>
                            </div>
                            <span className="breakdown-value">{result.parsedMatchScore.breakdown.education}%</span>
                          </div>
                          <div className="breakdown-item">
                            <span className="breakdown-label">Keywords</span>
                            <div className="breakdown-bar">
                              <div 
                                className="breakdown-fill" 
                                style={{ width: `${result.parsedMatchScore.breakdown.keywords}%` }}
                              ></div>
                            </div>
                            <span className="breakdown-value">{result.parsedMatchScore.breakdown.keywords}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {result.parsedMatchScore?.qualifiedSkills && result.parsedMatchScore.qualifiedSkills.length > 0 && (
                      <div className="skills-section qualified-skills">
                        <h4 className="skills-title">
                          <span className="skills-icon">✅</span>
                          Qualified Skills
                        </h4>
                        <div className="skills-list-container">
                          {result.parsedMatchScore.qualifiedSkills.map((skill, index) => (
                            <div key={index} className="skill-item">
                              <span className="skill-bullet">✓</span>
                              <span className="skill-text">{skill.replace(/^\s*[-•]\s*/, '')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {result.parsedMatchScore?.missingSkills && result.parsedMatchScore.missingSkills.length > 0 && (
                      <div className="skills-section missing-skills">
                        <h4 className="skills-title">
                          <span className="skills-icon">🎯</span>
                          Skills to Develop
                        </h4>
                        <div className="skills-list-container">
                          {result.parsedMatchScore.missingSkills.map((skill, index) => (
                            <div key={index} className="skill-item">
                              <span className="skill-bullet">•</span>
                              <span className="skill-text">{skill.replace(/^\s*[-•]\s*/, '')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {result.parsedMatchScore?.analysis && (
                      <div className="analysis-section">
                        <h4 className="analysis-title">Compatibility Analysis</h4>
                        <p className="analysis-content">{result.parsedMatchScore.analysis}</p>
                      </div>
                    )}
                  </div>

                  {/* Interview Questions Section with Tabs */}
                  <div className="questions-container">
                    <h3 className="feature-title">Interview Questions</h3>
                    
                    <div className="difficulty-tabs">
                      {['easy', 'medium', 'hard'].map(difficulty => (
                        <div 
                          key={difficulty} 
                          className={`difficulty-tab tab-${difficulty} ${activeTab === difficulty ? 'tab-active' : ''}`}
                          onClick={() => setActiveTab(difficulty)}
                        >
                          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                        </div>
                      ))}
                    </div>
                    
                    <div className="questions-list">
                      {['easy', 'medium', 'hard'].map(difficulty => (
                        <div 
                          key={difficulty}
                          style={{ display: activeTab === difficulty ? 'block' : 'none' }}
                        >
                          {result.interview_questions
                            .filter(q => q.difficulty === difficulty)
                            .map((question, index) => (
                              <div key={index} className="question-card">
                                <div className="question-content">
                                  <div className="question-header">
                                    <span className={`question-badge badge-${difficulty}`}>
                                      Q{index + 1}
                                    </span>
                                    <h4 className="question-text">{question.question}</h4>
                                  </div>
                                  
                                  <div className="question-answer">
                                    <textarea
                                      className="answer-textarea"
                                      placeholder="Type your answer here..."
                                      rows="3"
                                      value={questionResponses[`${difficulty}-${index}`] || ''}
                                      onChange={(e) => setQuestionResponses(prev => ({
                                        ...prev,
                                        [`${difficulty}-${index}`]: e.target.value
                                      }))}
                                    />
                                    <button 
                                      className="submit-button"
                                      onClick={() => handleQuestionResponse(`${difficulty}-${index}`, 
                                        questionResponses[`${difficulty}-${index}`])}
                                      disabled={!questionResponses[`${difficulty}-${index}`] || 
                                        evaluationLoading[`${difficulty}-${index}`]}
                                    >
                                      {evaluationLoading[`${difficulty}-${index}`] ? (
                                        <>
                                          <svg className="loading-spinner" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                          </svg>
                                          Evaluating...
                                        </>
                                      ) : (
                                        <>
                                          Submit Answer
                                        </>
                                      )}
                                    </button>
                                    
                                    {evaluations[`${difficulty}-${index}`] && (
                                      <div className="feedback-card">
                                        <h4 className="feedback-header">AI Feedback</h4>
                                        <div className="feedback-content">
                                          {evaluations[`${difficulty}-${index}`].split('\n').map((line, sIndex) => {
                                            const trimmedLine = line.trim();
                                            
                                            if (trimmedLine.startsWith('Overall Score:')) {
                                              const score = trimmedLine.split(':')[1].trim();
                                              return (
                                                <div key={sIndex} className="feedback-score">{score}</div>
                                              );
                                            }
                                            
                                            if (trimmedLine === 'Strengths:') {
                                              return (
                                                <div key={sIndex} className="feedback-section">
                                                  <h5 className="feedback-section-title feedback-strengths">💪 Strengths</h5>
                                                </div>
                                              );
                                            }
                                            
                                            if (trimmedLine === 'Areas for Improvement:') {
                                              return (
                                                <div key={sIndex} className="feedback-section">
                                                  <h5 className="feedback-section-title feedback-improvements">🎯 Areas to Improve</h5>
                                                </div>
                                              );
                                            }
                                            
                                            if (trimmedLine.startsWith('•')) {
                                              return (
                                                <div key={sIndex} className="feedback-point">
                                                  <span className="feedback-point-bullet">•</span>
                                                  <span className="feedback-point-text">{trimmedLine.substring(1).trim()}</span>
                                                </div>
                                              );
                                            }
                                            
                                            if (trimmedLine.startsWith('Quick Tip:')) {
                                              return (
                                                <div key={sIndex} className="feedback-tip">
                                                  <span className="feedback-tip-icon">💡</span>
                                                  <span>{trimmedLine.substring(10).trim()}</span>
                                                </div>
                                              );
                                            }
                                            
                                            return null;
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      ))}
                    </div>
                    
                    <button 
                      className="load-more-button"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                    >
                      {loadingMore ? (
                        <>
                          <svg className="loading-spinner" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Loading more questions...
                        </>
                      ) : (
                        <>
                          Load More Questions
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Auth isLogin={true} />} />
          <Route path="/signup" element={<Auth isLogin={false} />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;