import React, { useState, useEffect, useRef } from 'react';
import './Home.css';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Login from './auth/Login';
import JobDescModal from './JobDescModal';
import About from './About';
import Contact from './Contact';
import SEO from './SEO';

const Home = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showJobDescModal, setShowJobDescModal] = useState(false);
  const [usernameWidth, setUsernameWidth] = useState(100);
  const usernameRef = useRef(null);
  const buttonRef = useRef(null);

  // Calculate optimal spacing based on button width
  useEffect(() => {
    if (buttonRef.current && user) {
      const buttonWidth = buttonRef.current.offsetWidth;
      const minSpacing = 20; // Minimum spacing in pixels
      const optimalSpacing = Math.max(buttonWidth + minSpacing, 100); // At least 100px or button width + 20px
      setUsernameWidth(optimalSpacing);
    }
  }, [user]);

  // Handler for job description submission
  const handleJobDescSubmit = (description) => {
    // Store job description in localStorage for the builder to access
    localStorage.setItem('jobDescription', description);
    setShowJobDescModal(false);
  };
  
  return (
    <div>
      <SEO 
        title="HiHired - Free AI Resume Builder | Build Professional Resumes Online"
        description="Create professional resumes in minutes with our free AI resume builder. Build ATS-friendly resumes, optimize for job descriptions, and land your dream job. No registration required."
        keywords="resume builder, AI resume builder, free resume builder, professional resume, resume maker, build resume, write resume, create resume, resume template, ATS resume, job resume, career resume, online resume builder"
        canonical="https://hihired.org/"
      />
      <nav className="home-navbar">
        <div className="home-navbar-left">
          <span className="home-logo">HiHired</span>
        </div>
        <div className="home-navbar-center">
          <button 
            className="home-nav-link" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', font: 'inherit' }}
          >
            Home
          </button>
          <Link to="/builder" className="home-nav-link">Builder</Link>
          <a href="#about" className="home-nav-link" onClick={(e) => {
            e.preventDefault();
            document.getElementById('about').scrollIntoView({ behavior: 'smooth' });
          }}>About</a>
          <a href="#contact" className="home-nav-link" onClick={(e) => {
            e.preventDefault();
            document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
          }}>Contact</a>
        </div>
        <div className="home-navbar-right">
          {user ? (
            <span 
              ref={usernameRef}
              style={{ 
                color: '#3b82f6', 
                fontWeight: 500,
                marginRight: `${usernameWidth}px`
              }}
            >
              {user}
            </span>
          ) : null}
          <button 
            ref={buttonRef}
            className="home-auth-btn" 
            onClick={() => {
              if (user) {
                // Logout: clear everything and stay on home page
                localStorage.removeItem('resumeUser');
                window.location.reload();
              } else {
                // Login: show auth modal
                setShowAuthModal(true);
              }
            }}
            style={{ flexShrink: 0 }}
          >
            {user ? 'Logout' : 'Login / Signup'}
          </button>
        </div>
      </nav>
      
      {/* Job Description Feature Section */}
      <div className="home-jobdesc-feature">
        <div className="home-jobdesc-feature-content">
          <h2>🎯 Tailor Your Resume for Specific Jobs</h2>
          <p>
            Have a job description? Our AI will analyze it and help you create a targeted resume that matches the role perfectly. 
            We'll highlight relevant skills, optimize keywords, and structure your experience to stand out to recruiters.
          </p>
          <div className="home-jobdesc-feature-benefits">
            <div className="benefit-item">
              <span className="benefit-icon">🔍</span>
              <span>Keyword Optimization</span>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">📝</span>
              <span>Skill Matching</span>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">🎯</span>
              <span>ATS-Friendly Format</span>
            </div>
          </div>
          <button 
            className="home-btn primary home-jobdesc-cta" 
            onClick={() => {
              if (!user) {
                setShowAuthModal(true);
              } else {
                setShowJobDescModal(true);
              }
            }}
          >
            Start Building with Job Description
          </button>
        </div>
      </div>
      
      <div className="home-hero">
        <div className="home-hero-content">
          <h1 className="home-title">HiHired - AI Resume Builder (Fast, Easy & Free to Use)</h1>
          <p className="home-subtitle">
            Land your next job with one of the best AI resume builders online. Work from your computer or phone with dozens of recruiter-approved templates and add ready-to-use skills and phrases in one click. Millions have trusted HiHired — and it’s free to use!
          </p>
          <div className="home-cta-buttons">
            <button className="home-btn secondary" onClick={() => navigate('/builder')}>
              {user ? 'Continue Building' : 'Build my resume'}
            </button>
          </div>
          <div className="home-trusted">
            <span>Our customers have been hired by:</span>
            <div className="home-logos">
              <span>Amazon</span>
              <span>Google</span>
              <span>Nike</span>
              <span>Meta</span>
            </div>
          </div>
        </div>
        <div className="home-hero-image">
          {/* Placeholder for illustration or screenshot */}
          <div className="home-image-placeholder">[Resume Preview Image]</div>
        </div>
      </div>
      
      {/* Auth Modal */}
      {showAuthModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.25)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ position: 'relative' }}>
            <Login onLogin={(email, token) => { login(email, token); setShowAuthModal(false); }} onClose={() => setShowAuthModal(false)} />
          </div>
        </div>
      )}

      {/* Job Description Modal */}
              {showJobDescModal && (
          <JobDescModal onClose={() => setShowJobDescModal(false)} onJobDescriptionSubmit={handleJobDescSubmit} />
        )}
      
      {/* About Section */}
      <About />
      
      {/* Contact Section */}
      <Contact />
    </div>
  );
};

export default Home; 