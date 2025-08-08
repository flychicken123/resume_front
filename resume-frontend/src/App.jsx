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
  

  


  // Handler for download action
  const handleDownload = async () => {
    try {
      // Check if user is authenticated
      if (!user) {
        alert('Please log in to download your resume.');
        setShowAuthModal(true);
        return;
      }

      // Function to format date
      const formatDate = (dateString) => {
        if (!dateString || dateString === 'Present') return dateString;
        const date = new Date(dateString);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getFullYear()}`;
      };

      // Update button state
      const downloadButton = document.querySelector('button[onClick]');
      if (downloadButton) {
        downloadButton.textContent = 'Generating PDF...';
        downloadButton.disabled = true;
      }

      // Capture the HTML content from the live preview
      const previewElement = document.querySelector('.preview');
      let htmlContent = '';
      
      if (previewElement) {
        // Clone the preview element
        const clonedElement = previewElement.cloneNode(true);
        
        // Remove the download button from the cloned element
        const downloadBtn = clonedElement.querySelector('button');
        if (downloadBtn) {
          downloadBtn.remove();
        }
        
        // Fit the cloned element to a single page height if needed
        const inchesToPx = (inches) => inches * 96; // wkhtmltopdf uses ~96 DPI
        const pageHeightPx = inchesToPx(11);
        
        // Temporarily attach to DOM to measure
        const measureHost = document.createElement('div');
        measureHost.style.position = 'fixed';
        measureHost.style.left = '-10000px';
        measureHost.style.top = '0';
        measureHost.style.width = '8.5in';
        measureHost.style.zIndex = '-1';
        measureHost.appendChild(clonedElement);
        document.body.appendChild(measureHost);
        
        // Measure full height
        const fullHeight = clonedElement.scrollHeight || clonedElement.getBoundingClientRect().height;
        
        // Only scale down when overflow is tiny (e.g., < 0.5in) to remove a blank trailing page
        const overflowPx = fullHeight - pageHeightPx;
        const smallOverflowThreshold = inchesToPx(0.5); // 0.5in threshold
        if (overflowPx > 0 && overflowPx <= smallOverflowThreshold) {
          const scale = (pageHeightPx - 2) / fullHeight; // leave 2px buffer
          clonedElement.style.transform = `scale(${scale})`;
          clonedElement.style.transformOrigin = 'top left';
          // Do NOT clamp height or hide overflow so real multi-page content is preserved
        }
        
        // Detach the measure host; the clonedElement stays referenced
        measureHost.remove();
        
        // Simply capture the live preview HTML with its current styles
        const cssText = Array.from(document.styleSheets)
          .map(sheet => {
            try {
              return Array.from(sheet.cssRules)
                .map(rule => rule.cssText)
                .join('\n');
            } catch (e) {
              // Handle cross-origin stylesheets
              return '';
            }
          })
          .join('\n');
        
        // Build filtered CSS: include only rules that target `.preview` (including template variants)
        const filteredCssText = Array.from(document.styleSheets)
          .map(sheet => {
            try {
              return Array.from(sheet.cssRules)
                .map(rule => {
                  // STYLE RULES
                  if (rule.type === CSSRule.STYLE_RULE) {
                    const sel = rule.selectorText || '';
                    return sel.includes('.preview') ? rule.cssText : '';
                  }
                  // MEDIA RULES
                  if (rule.type === CSSRule.MEDIA_RULE) {
                    const inner = Array.from(rule.cssRules)
                      .map(r => {
                        const s = r.selectorText || '';
                        return s.includes('.preview') ? r.cssText : '';
                      })
                      .filter(Boolean)
                      .join('\n');
                    return inner ? `@media ${rule.media.mediaText} {\n${inner}\n}` : '';
                  }
                  return '';
                })
                .filter(Boolean)
                .join('\n');
            } catch (e) {
              return '';
            }
          })
          .filter(Boolean)
          .join('\n');
        
        // Force cache refresh by adding timestamp to CSS
        const timestamp = Date.now();
        const cacheBustedCssText = filteredCssText.replace(/\.preview\s*\{/g, `.preview { /* Cache-busted at ${timestamp} */`);
        
        // Remove old CSS values completely and simplify
        const cleanedCssText = cacheBustedCssText
          .replace(/padding:\s*0\.75in/g, 'padding: 0.5in')
          .replace(/margin-top:\s*15pt/g, 'margin-top: 10pt')
          .replace(/margin-bottom:\s*8pt/g, 'margin-bottom: 6pt')
          // Remove any external CSS that might interfere
          .replace(/@import[^;]+;/g, '')
          .replace(/@media[^{}]*\{\s*\}/g, '')
          // Prevent blank extra page by removing properties that can force tiny overflow
          .replace(/min-height:\s*[^;]+;?/g, '')
          .replace(/aspect-ratio:\s*[^;]+;?/g, '')
          .replace(/overflow-y:\s*[^;]+;?/g, '')
          .replace(/box-shadow:\s*[^;]+;?/g, '');

        // Extra PDF tuning to ensure single page
        const pdfTuningCss = `
          @page { size: Letter; margin: 0; }
          .preview { min-height: auto !important; height: auto !important; box-shadow: none !important; overflow: visible !important; }
          .preview > *:last-child { margin-bottom: 0 !important; padding-bottom: 0 !important; }
        `;
        
        // Debug: Check what CSS is being captured after cleaning
        console.log('Cleaned CSS includes padding 0.5in:', cleanedCssText.includes('padding: 0.5in'));
        console.log('Cleaned CSS includes padding 0.75in:', cleanedCssText.includes('padding: 0.75in'));
        console.log('Cleaned CSS includes margin-top 10pt:', cleanedCssText.includes('margin-top: 10pt'));
        console.log('Cleaned CSS includes margin-top 15pt:', cleanedCssText.includes('margin-top 15pt'));
        
        // Debug: Check for other spacing issues
        console.log('CSS includes margin:', cleanedCssText.includes('margin:'));
        console.log('CSS includes padding:', cleanedCssText.includes('padding:'));
        console.log('CSS includes line-height:', cleanedCssText.includes('line-height:'));
        
        // Debug: Show actual CSS for .preview class
        const previewCssMatch = cleanedCssText.match(/\.preview\s*\{[^}]*\}/g);
        if (previewCssMatch) {
          console.log('Preview CSS rules:', previewCssMatch);
        }
        
        // Debug: Show the actual HTML being sent
        console.log('HTML Content length:', htmlContent.length);
        console.log('HTML Content preview:', htmlContent.substring(0, 500));
        
        // Create HTML document with filtered, cleaned CSS
        const pdfOverrides = `
          /* PDF-only overrides to avoid blank trailing pages */
          .preview { min-height: auto !important; box-shadow: none !important; border: none !important; }
          .preview * { page-break-inside: avoid; }
          .preview::after { display: none !important; content: none !important; }
        `;
        htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.name || 'Resume'}</title>
  <style>
    body { margin: 0; padding: 0; background-color: white; }
    ${cleanedCssText}
    ${pdfOverrides}
  </style>
</head>
<body>
  ${clonedElement.outerHTML}
</body>
</html>`;
      }

      const resumeData = {
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        summary: data.summary || '',
        experience: Array.isArray(data.experiences) 
          ? data.experiences.map(exp => {
              let formatted = `${exp.jobTitle} at ${exp.company}`;
              if (exp.remote) {
                formatted += ` • Remote`;
              } else if (exp.city && exp.state) {
                formatted += ` • ${exp.city}, ${exp.state}`;
              } else if (exp.city || exp.state) {
                formatted += ` • ${exp.city || exp.state}`;
              }
              if (exp.startDate || exp.endDate) {
                const startDate = formatDate(exp.startDate);
                const endDate = formatDate(exp.endDate);
                formatted += ` • ${startDate} - ${endDate}`;
              }
              if (exp.description) {
                // Split description into individual bullet points
                const bulletPoints = exp.description.split('\n').filter(point => point.trim());
                formatted += '\n' + bulletPoints.join('\n');
              }
              return formatted;
            }).join('\n\n')
          : data.experiences || '',
        education: Array.isArray(data.education) 
          ? data.education.map(edu => 
              `${edu.degree}${edu.field ? ` in ${edu.field}` : ''} from ${edu.school}${edu.graduationYear ? ` (${edu.graduationYear})` : ''}${edu.gpa ? ` - GPA: ${edu.gpa}` : ''}${edu.honors ? ` - ${edu.honors}` : ''}`
            ).join('\n\n')
          : data.education || '',
        skills: data.skills ? data.skills.split(',').map(s => s.trim()).filter(s => s.length > 0) : [],
        format: data.selectedFormat || 'temp1',
        htmlContent: htmlContent
      };

      // Debug: Log the actual data being sent
      console.log('Raw data:', data);
      console.log('Raw experiences:', data.experiences);
      console.log('Selected format:', data.selectedFormat);
      console.log('Formatted experience:', resumeData.experience);
      console.log('Formatted education:', resumeData.education);
      console.log('Formatted skills:', resumeData.skills);

      // Get auth token
      const token = localStorage.getItem('resumeToken');
      if (!token) {
        alert('Authentication token not found. Please log in again.');
        setShowAuthModal(true);
        return;
      }

      // Call the backend API to generate PDF resume
      console.log('Sending resume data for PDF generation:', resumeData);
      console.log('Using token:', token.substring(0, 20) + '...');
      
      const requestHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      console.log('Request headers:', requestHeaders);
      
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';
      
      console.log('API_BASE_URL:', API_BASE_URL);
      
      const response = await fetch(`${API_BASE_URL}/api/resume/generate-pdf`, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(resumeData),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Backend error:', errorData);
        
        if (response.status === 401) {
          alert('Authentication failed. Please log in again.');
          setShowAuthModal(true);
          return;
        }
        
        throw new Error(errorData.message || 'Failed to generate resume');
      }

      const result = await response.json();
      
      // Use S3 download URL if available, otherwise fallback to local endpoint
      let downloadUrl;
      if (result.downloadURL) {
        // Use S3 URL directly - no authorization needed for public S3 files
        downloadUrl = result.downloadURL;
        console.log('Using S3 download URL:', downloadUrl);
      } else {
        // Fallback to local download endpoint
        downloadUrl = `${API_BASE_URL}${result.filePath}`;
        console.log('Using local download URL:', downloadUrl);
      }
      
      console.log('Final download URL:', downloadUrl);
      
      // Fetch the PDF file as a blob
      // S3 files are public, local files need authorization
      const fetchOptions = result.downloadURL ? {} : {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const pdfResponse = await fetch(downloadUrl, fetchOptions);
      
      if (!pdfResponse.ok) {
        throw new Error('Failed to download PDF file');
      }
      
      const pdfBlob = await pdfResponse.blob();
      
      // Create download link
      const link = document.createElement('a');
      link.href = URL.createObjectURL(pdfBlob);
      link.download = `resume_${data.name || 'resume'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      URL.revokeObjectURL(link.href);

      // Show success message
      alert('PDF resume generated successfully! Your resume has been downloaded.');

    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download resume. Please try again.');
    } finally {
      // Reset button state
      const downloadButton = document.querySelector('button[onClick]');
      if (downloadButton) {
        downloadButton.textContent = 'Download PDF Resume';
        downloadButton.disabled = false;
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

  return (
    <>
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
                      onClick={handleDownload}
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
                      📄 Download PDF Resume
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
            <StepPreview onDownload={handleDownload} />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
              {showJobDescModal && <JobDescModal onClose={() => setShowJobDescModal(false)} onJobDescriptionSubmit={handleJobDescSubmit} />}
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