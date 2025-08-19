import React, { useState, useEffect, useRef } from 'react';
import './Home.css';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useResume } from '../context/ResumeContext';
import Login from './auth/Login';
import IntegratedBuilderStart from './IntegratedBuilderStart';
import ResumeHistory from './ResumeHistory';
import JobSubmit from './JobSubmit';
import SimpleHero from './SimpleHero';
import About from './About';
import Contact from './Contact';
import SEO from './SEO';
import { trackReferrer, trackBuilderStart } from './Analytics';

const Home = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const { resumeData } = useResume();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showIntegratedModal, setShowIntegratedModal] = useState(false);
  const [showResumeHistory, setShowResumeHistory] = useState(false);
  const [showJobSubmit, setShowJobSubmit] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [usernameWidth, setUsernameWidth] = useState(100);
  const usernameRef = useRef(null);
  const buttonRef = useRef(null);



  // Track user source when home page loads
  useEffect(() => {
    trackReferrer();
    trackBuilderStart('home_page_load');
  }, []);

  // Calculate optimal spacing based on button width
  useEffect(() => {
    if (buttonRef.current && user) {
      const buttonWidth = buttonRef.current.offsetWidth;
      const minSpacing = 20; // Minimum spacing in pixels
      const optimalSpacing = Math.max(buttonWidth + minSpacing, 100); // At least 100px or button width + 20px
      setUsernameWidth(optimalSpacing);
    }
  }, [user]);

  const handleStartBuilding = () => {
    // Track referrer and builder start when user clicks the button
    trackReferrer();
    trackBuilderStart('home_page_button');
    if (!user) {
      setShowAuthModal(true);
    } else {
      setShowIntegratedModal(true);
    }
  };

  const handleViewTemplates = () => {
    trackReferrer();
    trackBuilderStart('home_page_templates');
    navigate('/templates');
  };
  
  return (
    <div>
      <SEO 
        title="Free AI Resume Builder - Create Professional Resumes Online | HiHired"
        description="100% free AI resume builder. Create professional resumes in minutes with AI-powered writing assistance. No signup required. ATS-optimized templates. Download PDF instantly. Build your resume for free today!"
        keywords="free resume builder, free ai resume builder, resume builder, free resume, ai resume builder, resume builder free, online resume builder, free resume templates, professional resume builder, resume maker free, build resume online free, free cv builder, resume generator, ats resume builder, free resume creator, make resume online free"
        canonical="https://hihired.org/"
      />
      <nav className="home-navbar">
        <div className="home-navbar-left">
          <span className="home-logo">HiHired</span>
        </div>
        
        {/* Desktop Navigation */}
        <div className="home-navbar-center desktop-nav">
          <button 
            className="home-nav-link" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
          >
            Home
          </button>
          <button 
            className="home-nav-link" 
            onClick={() => {
              if (!user) {
                setShowAuthModal(true);
              } else {
                setShowIntegratedModal(true);
              }
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
          >
            Builder
          </button>
          {user && (
            <button 
              className="home-nav-link" 
              onClick={() => setShowResumeHistory(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
            >
              Resume History
            </button>
          )}
          {user && (
            <Link 
              to="/apply" 
              className="home-nav-link"
            >
              Apply to Jobs
            </Link>
          )}
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
              className="desktop-username"
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
                localStorage.removeItem('resumeUser');
                window.location.reload();
              } else {
                setShowAuthModal(true);
              }
            }}
            style={{ flexShrink: 0 }}
          >
{user ? 'Logout' : 'Login'}
          </button>
          
          {/* Mobile Menu Button */}
          <button 
            className="mobile-menu-button"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-label="Toggle menu"
          >
            <span className={`hamburger ${showMobileMenu ? 'open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
      </nav>
      
      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="mobile-menu-overlay" onClick={() => setShowMobileMenu(false)}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <button 
              className="mobile-nav-link" 
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setShowMobileMenu(false);
              }}
            >
              Home
            </button>
            <button 
              className="mobile-nav-link"
              onClick={() => {
                setShowMobileMenu(false);
                if (!user) {
                  setShowAuthModal(true);
                } else {
                  setShowIntegratedModal(true);
                }
              }}
            >
              Builder
            </button>
            {user && (
              <button 
                className="mobile-nav-link" 
                onClick={() => {
                  setShowResumeHistory(true);
                  setShowMobileMenu(false);
                }}
              >
                Resume History
              </button>
            )}
            {user && (
              <Link 
                to="/apply" 
                className="mobile-nav-link"
                onClick={() => setShowMobileMenu(false)}
              >
                Apply to Jobs
              </Link>
            )}
            <a 
              href="#about" 
              className="mobile-nav-link" 
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('about').scrollIntoView({ behavior: 'smooth' });
                setShowMobileMenu(false);
              }}
            >
              About
            </a>
            <a 
              href="#contact" 
              className="mobile-nav-link" 
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
                setShowMobileMenu(false);
              }}
            >
              Contact
            </a>
          </div>
        </div>
      )}
      
      {/* Simple Hero Section with Resume */}
      <SimpleHero 
        onImportClick={() => {
          trackBuilderStart('import_resume');
          if (!user) {
            setShowAuthModal(true);
          } else {
            setShowIntegratedModal(true);
          }
        }}
        onCreateClick={() => {
          trackBuilderStart('create_resume');
          if (!user) {
            setShowAuthModal(true);
          } else {
            setShowIntegratedModal(true);
          }
        }}
      />
      
      {/* AI Features Section */}
      <div className="what-makes-different">
        <div className="what-makes-different-content">
          <h2>🚀 Smart Features That Set Us Apart</h2>
          <p>
            Experience professional resume building that gets results. 
            Our intelligent system analyzes successful resumes and job postings to give you the competitive edge.
          </p>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🧠</div>
              <div className="feature-title">Neural Network Analysis</div>
              <div className="feature-description">
                Our AI uses deep learning to understand job requirements and intelligently match your experience to what employers are looking for.
              </div>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <div className="feature-title">Smart Keyword Optimization</div>
              <div className="feature-description">
                Advanced algorithms analyze job descriptions and automatically optimize your resume with the most relevant keywords and phrases.
              </div>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <div className="feature-title">Machine Learning Insights</div>
              <div className="feature-description">
                Our AI continuously learns from successful resumes and hiring patterns to provide data-driven recommendations for improvement.
              </div>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <div className="feature-title">Real-Time AI Processing</div>
              <div className="feature-description">
                Get instant AI-powered suggestions and optimizations as you build your resume, with real-time feedback and improvements.
              </div>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔮</div>
              <div className="feature-title">Predictive Success Modeling</div>
              <div className="feature-description">
                Our AI predicts resume success rates and provides actionable insights to maximize your chances of landing interviews.
              </div>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <div className="feature-title">AI-Driven Formatting</div>
              <div className="feature-description">
                Intelligent formatting algorithms ensure your resume is perfectly structured for both human readers and ATS systems.
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Success Stories Section */}
      <div className="success-stories-section">
        <div className="success-stories-content">
          <h2 className="success-stories-title">🤖 What People Say About Our AI</h2>
          <p className="success-stories-subtitle">Real success stories from job seekers who experienced the power of AI-driven resume optimization</p>
          
          <div className="success-stories-grid">
            <div className="success-story-card">
              <div className="story-header">
                <div className="story-avatar">MC</div>
                <div className="story-info">
                  <div className="story-name">Michael Chen</div>
                  <div className="story-role">Software Engineer at Google</div>
                </div>
              </div>
              <div className="story-content">
                "The AI technology is incredible! 🤖 It analyzed my experience and automatically optimized my resume for each job. The AI-powered keyword matching got me past every ATS system. Landed my dream job in 3 weeks!"
              </div>
              <div className="story-stats">
                <span className="stat">Clean format</span>
                <span className="stat">Easy to use</span>
              </div>
            </div>
            
            <div className="success-story-card">
              <div className="story-header">
                <div className="story-avatar">👩‍💻</div>
                <div className="story-info">
                  <div className="story-name">Sarah Rodriguez</div>
                  <div className="story-role">Product Manager at Amazon</div>
                </div>
              </div>
              <div className="story-content">
                "The AI is like having a personal career coach! 🤖 It intelligently restructured my experience to match job requirements and used machine learning to optimize keywords. My interview rate skyrocketed from 5% to 45%!"
              </div>
              <div className="story-stats">
                <span className="stat">📊 92/100 ATS Score</span>
                <span className="stat">🚀 Hired in 3 weeks</span>
              </div>
            </div>
            
            <div className="success-story-card">
              <div className="story-header">
                <div className="story-avatar">👨‍🎓</div>
                <div className="story-info">
                  <div className="story-name">David Kim</div>
                  <div className="story-role">Data Scientist at Meta</div>
                </div>
              </div>
              <div className="story-content">
                "The AI transformed my basic resume into a professional masterpiece! 🤖 It used intelligent algorithms to highlight my projects and skills in ways I never thought of. Now recruiters are contacting me daily!"
              </div>
              <div className="story-stats">
                <span className="stat">📈 3.2x More Callbacks</span>
                <span className="stat">💼 First job out of college</span>
              </div>
            </div>
          </div>
          
          <div className="success-metrics">
            <div className="metric-item">
              <div className="metric-number">50,000+</div>
              <div className="metric-label">AI-Optimized Resumes</div>
            </div>
            <div className="metric-item">
              <div className="metric-number">92%</div>
              <div className="metric-label">AI Accuracy Rate</div>
            </div>
            <div className="metric-item">
              <div className="metric-number">3.2x</div>
              <div className="metric-label">Higher Interview Rate</div>
            </div>
            <div className="metric-item">
              <div className="metric-number">AI-Powered</div>
              <div className="metric-label">Machine Learning</div>
            </div>
          </div>
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

      {/* Integrated Builder Start Modal */}
      {showIntegratedModal && (
        <IntegratedBuilderStart onClose={() => setShowIntegratedModal(false)} />
      )}


      {/* Resume History Modal */}
      {showResumeHistory && (
        <ResumeHistory onClose={() => setShowResumeHistory(false)} />
      )}

      {showJobSubmit && (
        <JobSubmit 
          user={user}
          resumeData={resumeData}
          onClose={() => setShowJobSubmit(false)} 
        />
      )}
      
      {/* About Section */}
      <About />
      
      {/* Contact Section */}
      <Contact />
    </div>
  );
};

export default Home; 