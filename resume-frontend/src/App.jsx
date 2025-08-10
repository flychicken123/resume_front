import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ResumeProvider, useResume } from './context/ResumeContext';
import Stepper from './components/Stepper';
import Home from './components/Home';
import StepPersonal from './components/StepPersonal';
import StepExperience from './components/StepExperience';
import StepEducation from './components/StepEducation';
import StepSkills from './components/StepSkills';
import StepFormat from './components/StepFormat';
import StepSummary from './components/StepSummary';
import StepPreview from './components/StepPreview';
import AuthModal from './components/auth/AuthModal';
import JobDescModal from './components/JobDescModal';
import SEO from './components/SEO';
import './App.css';
import ImportResumeModal from './components/ImportResumeModal';

const steps = [
  "Personal Details",
  "Experience",
  "Education", 
  "Skills",
  "Format",
  "Summary"
];

function BuilderApp() {
  const [step, setStep] = useState(1); // Start with Personal Details step
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showJobDescModal, setShowJobDescModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  
  // Load job description from localStorage on component mount
  useEffect(() => {
    const savedJobDesc = localStorage.getItem('jobDescription');
    if (savedJobDesc) {
      setJobDescription(savedJobDesc);
    }
  }, []);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, login, logout } = useAuth();
  const { data, saveToDatabaseNow } = useResume();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    const previewElement = document.getElementById('resume-preview-container');
    if (!previewElement) return;

    if (!isFullscreen) {
      if (previewElement.requestFullscreen) {
        previewElement.requestFullscreen();
      } else if (previewElement.webkitRequestFullscreen) {
        previewElement.webkitRequestFullscreen();
      } else if (previewElement.msRequestFullscreen) {
        previewElement.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleKeyDown = (e) => {
      // F11 key for fullscreen
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
      // Esc key to exit fullscreen
      if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);
  

  


  // Function to format date
  const formatDate = (dateString) => {
    if (!dateString || dateString === 'Present') return dateString;
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // API base URL function
  const getAPIBaseURL = () => {
    if (typeof window !== 'undefined') {
      // For local development, use localhost:8081
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:8081';
      }
      // Use the backend domain (non-www) for API calls
      return window.location.hostname === 'www.hihired.org' 
        ? 'https://hihired.org' 
        : window.location.origin;
    }
    // Fallback for server-side rendering
    return process.env.REACT_APP_API_URL || 'http://localhost:8081';
  };

  // Handler for view resume action
  const handleViewResume = () => {
    try {
      // Check if user is authenticated
      if (!user) {
        alert('Please log in to view your resume.');
        setShowAuthModal(true);
        return;
      }

      // Update button state
      const viewButton = document.querySelector('button[onClick]');
      if (viewButton) {
        viewButton.textContent = 'Generating PDF...';
        viewButton.disabled = true;
      }

      // Capture the HTML content from the live preview
      const previewElement = document.querySelector('.preview');
      
      if (previewElement) {
        // Clone the preview element
        const clonedElement = previewElement.cloneNode(true);

        // Inline computed styles from the live preview into the cloned HTML
        const inlineComputedStyles = (sourceEl, targetEl, isRoot = false) => {
          if (!sourceEl || !targetEl) return;

          // Copy curated properties; avoid overriding page sizing on the root .preview
          const commonProps = [
            'color', 'background-color', 'font-family', 'font-size', 'font-weight', 'font-style',
            'line-height', 'letter-spacing', 'text-transform', 'text-align', 'vertical-align',
            'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
            'border-color', 'border-style', 'border-width',
            'list-style', 'list-style-type', 'list-style-position',
            'white-space', 'word-break', 'overflow-wrap', 'hyphens'
          ];
          const layoutProps = [
            'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
            'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
            'width', 'max-width', 'min-width', 'height', 'max-height', 'min-height'
          ];
          const propertiesToCopy = isRoot ? commonProps : [...commonProps, ...layoutProps];

          try {
            const computed = window.getComputedStyle(sourceEl);
            propertiesToCopy.forEach((prop) => {
              const value = computed.getPropertyValue(prop);
              if (value) {
                // Use important to ensure inline values dominate stylesheet rules in wkhtmltopdf
                targetEl.style.setProperty(prop, value, 'important');
              }
            });
          } catch (e) {
            // Best-effort; skip nodes that error (e.g., pseudo elements)
          }

          // Recurse for children
          const sourceChildren = Array.from(sourceEl.children || []);
          const targetChildren = Array.from(targetEl.children || []);
          for (let i = 0; i < sourceChildren.length; i += 1) {
            inlineComputedStyles(sourceChildren[i], targetChildren[i], false);
          }
        };

        inlineComputedStyles(previewElement, clonedElement, true);
        
        // Remove the view button from the cloned element
        const viewBtn = clonedElement.querySelector('button');
        if (viewBtn) {
          viewBtn.remove();
        }
        
        // Comprehensive CSS debugging
        console.log('=== CSS DEBUGGING START ===');
        console.log('Environment:', window.location.hostname);
        console.log('URL:', window.location.href);
        console.log('User Agent:', navigator.userAgent);
        console.log('Number of stylesheets:', document.styleSheets.length);
        
        // Debug each stylesheet
        const stylesheetDebug = Array.from(document.styleSheets).map((sheet, index) => {
          try {
            const debug = {
              index,
              href: sheet.href || 'inline',
              disabled: sheet.disabled,
              media: sheet.media ? sheet.media.mediaText : 'all',
              title: sheet.title || 'none'
            };
            
            console.log(`Stylesheet ${index}:`, debug);
            
            const rules = Array.from(sheet.cssRules);
            const previewRules = rules.filter(rule => {
              if (rule.type === CSSRule.STYLE_RULE) {
                const sel = rule.selectorText || '';
                return sel.includes('.preview');
              }
              return false;
            });
            
            console.log(`Stylesheet ${index} total rules:`, rules.length);
            console.log(`Stylesheet ${index} preview rules:`, previewRules.length);
            
            if (previewRules.length > 0) {
              console.log(`Stylesheet ${index} preview rule examples:`, previewRules.slice(0, 3).map(r => r.selectorText));
            }
            
            return previewRules.map(rule => rule.cssText).join('\n');
          } catch (e) {
            console.log(`Stylesheet ${index} error:`, e.message);
            return '';
          }
        });
        
        const filteredCssText = stylesheetDebug.filter(Boolean).join('\n');
        
        console.log('Total preview CSS rules captured:', filteredCssText.split('\n').filter(line => line.includes('.preview')).length);
        console.log('=== CSS DEBUGGING END ===');

        // Remove screen-only visual effects that cause a visible edge in PDFs
        const cleanedCssText = filteredCssText
          .replace(/box-shadow\s*:[^;]+;?/gi, '')
          .replace(/-webkit-box-shadow\s*:[^;]+;?/gi, '')
          .replace(/border-radius\s*:[^;]+;?/gi, '');

        // Detect the current template class for targeted overrides
        const previewClasses = previewElement.className.split(' ');
        const templateClass = previewClasses.find(cls => cls !== 'preview') || '';
        console.log('Detected template class:', templateClass);
        
        // PDF-specific overrides to ensure consistent rendering (keep minimal)
        const pdfOverrides = `
          @page { size: Letter; margin: 0.4in; }
          html, body { background: #ffffff !important; margin: 0 !important; padding: 0 !important; }
          .preview { box-shadow: none !important; border: 0 !important; outline: none !important; margin: 0 auto !important; padding: 0 !important; width: 7.7in !important; max-width: 7.7in !important; box-sizing: border-box !important; overflow: visible !important; }
          .preview * { word-break: break-word !important; overflow-wrap: anywhere !important; hyphens: auto !important; }
          .preview::before, .preview::after { display: none !important; content: none !important; }
        `;
        
        // Debug: Log the CSS overrides to see if they're being generated
        console.log('=== PDF GENERATION DEBUG ===');
        console.log('Current template/format:', data.format || 'default');
        console.log('Current step:', step);
        console.log('Preview element found:', !!previewElement);
        console.log('Preview element classes:', previewElement ? previewElement.className : 'N/A');
        console.log('PDF Overrides being applied:', pdfOverrides);
 
        // Create complete HTML document with CSS overrides LAST
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.name || 'Resume'}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    /* Ensure same font in wkhtmltopdf */
    .preview, .preview * { font-family: 'Noto Sans', sans-serif !important; }
  </style>
  <style>
    body { margin: 0; padding: 0; background-color: white; }
    ${cleanedCssText}
  </style>
  <style>
    /* PDF-specific overrides - MUST be in separate style tag to ensure they come last */
    ${pdfOverrides}
  </style>
</head>
<body>
  ${clonedElement.outerHTML}
</body>
</html>`;

        // Debug: Log the HTML content length and preview
        console.log('=== FINAL HTML DEBUG ===');
        console.log('HTML Content Length:', htmlContent.length);
        console.log('Captured CSS Length:', cleanedCssText.length);
        console.log('Overrides CSS Length:', pdfOverrides.length);
        console.log('Preview Element HTML Length:', clonedElement.outerHTML.length);
        console.log('HTML Content Preview (first 1000 chars):', htmlContent.substring(0, 1000));
        
        // Debug: Check if our overrides are in the final HTML
        const hasOverrides = htmlContent.includes('font-size: 18pt !important');
        console.log('CSS Overrides found in HTML:', hasOverrides);
        console.log('CSS Overrides position:', htmlContent.indexOf('font-size: 18pt !important'));
        console.log('=== DEBUGGING COMPLETE ===');

        // Call the backend to generate PDF
        fetch(`${getAPIBaseURL()}/api/resume/generate-pdf`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            htmlContent: htmlContent
          })
        })
        .then(async (response) => {
          const text = await response.text();
          try {
            const json = JSON.parse(text);
            return { ok: response.ok, status: response.status, data: json, raw: text };
          } catch (e) {
            return { ok: response.ok, status: response.status, data: null, raw: text };
          }
        })
        .then(result => {
          if (result.ok && result.data && result.data.downloadURL) {
            window.open(result.data.downloadURL, '_blank');
            alert('PDF resume generated successfully!');
          } else {
            console.error('PDF generation failed response:', result);
            throw new Error((result.data && (result.data.error || result.data.message)) || `Failed to generate PDF (status ${result.status})`);
          }
        })
        .catch(error => {
          console.error('PDF generation error:', error);
          alert('Failed to generate PDF. Please try again.');
        });

      } else {
        alert('Could not find resume preview. Please try again.');
      }

    } catch (error) {
      console.error('View resume error:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      // Reset button state
      const viewButton = document.querySelector('button[onClick]');
      if (viewButton) {
        viewButton.textContent = 'View Resume';
        viewButton.disabled = false;
      }
    }
  };

  // Handler for auth button
  const handleAuthButton = () => {
    console.log('handleAuthButton called, user:', user);
    if (user) {
      console.log('Logging out user:', user);
      // Immediately clear everything and redirect to home
      localStorage.removeItem('resumeUser');
      logout();
      // Navigate to home page to avoid any modal issues
      window.location.href = '/';
    } else {
      console.log('Opening login modal');
      setShowAuthModal(true);
    }
  };

  // Handler for job description submission
  const handleJobDescSubmit = (description) => {
    setJobDescription(description);
    localStorage.setItem('jobDescription', description);
    setShowJobDescModal(false);
  };

  const handleProceedAfterChoice = () => {
    setShowJobDescModal(false);
    setShowImportModal(true);
  };

  return (
    <>
      <Helmet>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700&display=swap" rel="stylesheet" />
        <style>{`
          .preview { font-family: 'Noto Sans', sans-serif; }
          .preview * { font-family: 'Noto Sans', sans-serif; }
        `}</style>
      </Helmet>
      <SEO 
        title="Build Your Resume - HiHired AI Resume Builder"
        description="Build your professional resume step by step with our AI-powered resume builder. Create ATS-friendly resumes with personalized templates and expert guidance."
        keywords="build resume, create resume, resume builder, AI resume builder, professional resume, resume maker, write resume, resume template"
        canonical="https://hihired.org/builder"
      />
      <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
        {/* Left Side - Resume Builder */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f8fafc' }}>
          <div className="site-header" style={{ width: '100%', paddingTop: '2.5rem', paddingBottom: '1.5rem', textAlign: 'center', background: 'transparent', position: 'relative' }}>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                position: 'absolute',
                right: '2rem',
                top: '50%',
                transform: 'translateY(-50%)',
                padding: '0.75rem 1.5rem',
                border: '2px solid #d1d5db',
                borderRadius: '8px',
                background: 'white',
                color: '#374151',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                zIndex: 20,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f3f4f6';
                e.target.style.transform = 'translateY(-50%) translateX(2px)';
                e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'white';
                e.target.style.transform = 'translateY(-50%)';
                e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              }}
            >
              ← Back to Home
            </button>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              color: '#3b82f6',
              margin: 0,
              letterSpacing: '-1px'
            }}>
              HiHired - AI Resume Builder
            </h1>
          </div>

          
          {/* Stepper and Content */}
          <div style={{ display: 'flex', width: '100%', flex: 1 }}>
            <div style={{ minWidth: 140, background: '#d1d5fa', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 0, paddingBottom: 0, position: 'sticky', left: 0, top: 0, height: '100vh', zIndex: 10 }}>
              <Stepper steps={steps} currentStep={step} setStep={setStep} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem' }}>
              {step === 1 && <StepPersonal />}
              {step === 2 && <StepExperience />}
              {step === 3 && <StepEducation />}
              {step === 4 && <StepSkills />}
              {step === 5 && <StepFormat />}
              {step === 6 && <StepSummary />}
              
              {/* Navigation Buttons */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                {step > 1 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    style={{
                      padding: '1rem 2.5rem',
                      border: '2px solid #d1d5db',
                      borderRadius: '8px',
                      background: 'white',
                      color: '#374151',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '1rem',
                      transition: 'all 0.2s ease',
                      minWidth: '200px',
                      height: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#f3f4f6';
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'white';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    ← Previous
                  </button>
                )}
                {step < steps.length && (
                  <button
                    onClick={() => setStep(step + 1)}
                    style={{
                      padding: '1rem 2.5rem',
                      border: 'none',
                      borderRadius: '8px',
                      background: '#3b82f6',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '1rem',
                      transition: 'all 0.2s ease',
                      minWidth: '200px',
                      height: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 6px rgba(59, 130, 246, 0.25)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#2563eb';
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 12px rgba(59, 130, 246, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#3b82f6';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 6px rgba(59, 130, 246, 0.25)';
                    }}
                  >
                    Next →
                  </button>
                )}
                {step === steps.length && (
                  <div style={{ 
                    display: 'flex', 
                    gap: '1.5rem', 
                    width: '100%', 
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: '2rem'
                  }}>
                    <button
                                              onClick={handleViewResume}
                      style={{
                        padding: '1rem 2.5rem',
                        border: 'none',
                        borderRadius: '8px',
                        background: '#10b981',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '1rem',
                        boxShadow: '0 4px 6px rgba(16, 185, 129, 0.25)',
                        transition: 'all 0.2s ease',
                        minWidth: '200px',
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#059669';
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 12px rgba(16, 185, 129, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = '#10b981';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 6px rgba(16, 185, 129, 0.25)';
                      }}
                    >
                      📄 View Resume
                    </button>
                    <button
                      onClick={() => window.location.href = '/'}
                      style={{
                        padding: '1rem 2.5rem',
                        border: '2px solid #3b82f6',
                        borderRadius: '8px',
                        background: 'white',
                        color: '#3b82f6',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '1rem',
                        transition: 'all 0.2s ease',
                        minWidth: '200px',
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#3b82f6';
                        e.target.style.color = 'white';
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 6px 12px rgba(59, 130, 246, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'white';
                        e.target.style.color = '#3b82f6';
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      ✅ Complete & Return Home
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Live Resume Preview */}
        <div style={{ 
          flex: 1, 
          background: 'white', 
          borderLeft: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid #e5e7eb',
            background: '#f9fafb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#374151' }}>Live Resume Preview</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {user ? (
                <span style={{ color: '#3b82f6', fontWeight: 500, fontSize: '0.9rem' }}>{user}</span>
              ) : null}
              <button
                onClick={handleAuthButton}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  background: 'white',
                  color: '#3b82f6',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}
              >
                {user ? 'Logout' : 'Login / Signup'}
              </button>
              <button
                onClick={toggleFullscreen}
                className="fullscreen-button"
                title={`${isFullscreen ? 'Exit' : 'Enter'} fullscreen mode (F11)`}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  background: 'white',
                  color: '#374151',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                {isFullscreen ? 'Exit Full Screen' : 'Open Full Screen'}
              </button>
            </div>
          </div>
          <div 
            id="resume-preview-container"
            style={{ 
              flex: 1, 
              overflow: 'auto', 
              padding: '1rem',
              background: 'white'
            }}
          >
                            <StepPreview onDownload={handleViewResume} />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
              {showJobDescModal && <JobDescModal onClose={() => setShowJobDescModal(false)} onJobDescriptionSubmit={handleJobDescSubmit} onProceed={handleProceedAfterChoice} />}

      {showImportModal && <ImportResumeModal onClose={() => setShowImportModal(false)} />}
    </>
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId="978604541120-fmcim15k16vbatesna24ulke8m4buldp.apps.googleusercontent.com">
      <AuthProvider>
        <ResumeProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Home />} />
                      <Route path="/builder" element={<BuilderApp />} />
            </Routes>
          </Router>
        </ResumeProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;