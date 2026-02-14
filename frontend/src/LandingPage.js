import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';
import Logo from './RG_logo.jpg';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="landing-container">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-logo" onClick={() => navigate('/')}>
          <img src={Logo} alt="Resume Genie Logo" className="site-logo" />
          Resume Genie
        </div>
        <div className="navbar-actions">
          <button className="login-btn" onClick={() => navigate('/login')}>Login</button>
          <button className="signup-btn" onClick={() => navigate('/signup')}>Sign Up</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        {/* Decorative SVG background */}
        <svg className="hero-bg-svg" viewBox="0 0 1440 320" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="heroGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#2196F3" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#00BCD4" stopOpacity="0.12" />
            </linearGradient>
          </defs>
          <ellipse cx="1200" cy="80" rx="320" ry="120" fill="url(#heroGradient)" />
          <ellipse cx="300" cy="200" rx="220" ry="80" fill="url(#heroGradient)" />
        </svg>
        {/* Floating accent shapes */}
        <div className="floating-accent accent-1"></div>
        <div className="floating-accent accent-2"></div>
        <div className="floating-accent accent-3"></div>
        <div className="hero-left">
          <h1 className="hero-title">
            Transform Your Job Search with <span className="ai-powered">AI-Powered</span> Resume Analysis
          </h1>
          <p className="hero-subtitle">
            Match your resume with job descriptions, get instant feedback, and prepare for interviews with AI-generated questions.
          </p>
          <button 
            className="get-started-btn cta-glow"
            onClick={() => navigate('/signup')}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            Get Started Free <span className={`arrow ${isHovered ? 'arrow-hover' : ''}`}>→</span>
          </button>
        </div>
        <div className="hero-right">
          <div className="match-score-card">
            <div className="match-score-title">Match Score</div>
            <div className="match-score-value">95%</div>
          </div>
          <div className="skills-analysis-card">
            <div className="skills-analysis-title">Skills Analysis</div>
            <div className="skills-list">
              <span>Python</span>
              <span>React</span>
              <span>AWS</span>
            </div>
          </div>
        </div>
      </section>

      {/* Wavy SVG divider between hero and features section */}
      <div className="wavy-divider">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,32 C360,80 1080,0 1440,48 L1440,80 L0,80 Z" fill="#fff" fillOpacity="1" />
        </svg>
      </div>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Why Choose Resume Genie?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Smart Matching</h3>
            <p>AI-powered analysis to match your resume with job requirements</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📄</div>
            <h3>Skill Gap Analysis</h3>
            <p>Identify missing skills and get recommendations for improvement</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Interview Prep</h3>
            <p>Generate custom interview questions based on your profile</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <h2 className="section-title">How It Works</h2>
        <div className="how-steps">
          <div className="how-step">
            <div className="how-step-number">1</div>
            <div className="how-step-title">Upload Resume</div>
            <div className="how-step-desc">Upload your resume and target job description</div>
          </div>
          <div className="how-step">
            <div className="how-step-number">2</div>
            <div className="how-step-title">Get Analysis</div>
            <div className="how-step-desc">Receive detailed match analysis and recommendations</div>
          </div>
          <div className="how-step">
            <div className="how-step-number">3</div>
            <div className="how-step-title">Practice Interview</div>
            <div className="how-step-desc">Practice with AI-generated interview questions</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2 className="cta-title">Ready to Boost Your Job Search?</h2>
        <p className="cta-desc">Join thousands of job seekers who have improved their chances with Resume Genie</p>
        <button className="cta-btn" onClick={() => navigate('/signup')}>Get Started Free</button>
      </section>
    </div>
  );
};

export default LandingPage;