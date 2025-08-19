import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '../context/AuthContext';
import { useResume } from '../context/ResumeContext';
import Stepper from '../components/Stepper';
import StepPersonal from '../components/StepPersonal';
import StepExperience from '../components/StepExperience';
import StepEducation from '../components/StepEducation';
import StepSkills from '../components/StepSkills';
import StepSummary from '../components/StepSummary';
import StepFormat from '../components/StepFormat';
import StepPreview from '../components/StepPreview';
import AuthModal from '../components/auth/AuthModal';
import JobDescModal from '../components/JobDescModal';
import ImportResumeModal from '../components/ImportResumeModal';
import SEO from '../components/SEO';
import { trackResumeGeneration, trackReferrer, trackBuilderStart, trackStepCompletion } from '../components/Analytics';
import { generateResumeAdviceAI, generateCoverLetterAI } from '../api';
import './BuilderPage.css';

const steps = [
  "Personal Details",
  "Experience",
  "Education", 
  "Skills",
  "Summary",
  "Format"
];

function BuilderPage() {
  const [step, setStep] = useState(1); // Start with Personal Details step
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showJobDescModal, setShowJobDescModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [showAdvice, setShowAdvice] = useState(false);
  const [showCoverLetter, setShowCoverLetter] = useState(false);
  const [resumeAdvice, setResumeAdvice] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [coverLetterLoading, setCoverLetterLoading] = useState(false);
  const [companyName, setCompanyName] = useState('');
  
  // Load job description from localStorage on component mount
  useEffect(() => {
    const savedJobDesc = localStorage.getItem('jobDescription');
    if (savedJobDesc) {
      setJobDescription(savedJobDesc);
    }
  }, []);
  
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, login, logout, getAuthHeaders } = useAuth();
  const { data, saveToDatabaseNow, clearData } = useResume();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [startTime] = useState(Date.now());

  // Track referrer and builder start when component loads
  useEffect(() => {
    trackReferrer();
    trackBuilderStart('builder_page');
  }, []);

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
      // In production, use same-origin to avoid CORS
      return '';
    }
    // Fallback for server-side rendering
    return process.env.REACT_APP_API_URL || 'http://localhost:8081';
  };

  // Handler for view resume action
  const handleViewResume = async () => {
    try {
      // Check if user is authenticated
      if (!user) {
        alert('Please log in to view your resume.');
        setShowAuthModal(true);
        return;
      }

      // Track resume generation
      trackResumeGeneration(data.selectedFormat || 'default');

      // Update button state
      const viewButton = document.querySelector('button[onClick]');
      if (viewButton) {
        viewButton.textContent = 'Generating PDF...';
        viewButton.disabled = true;
      }

      // Capture the HTML content from the live preview
      const previewElement = document.querySelector('.preview');
      
      if (previewElement) {
        // Clone the preview element (no inline style expansion to keep HTML small)
        const clonedElement = previewElement.cloneNode(true);
        
        // Remove the view button from the cloned element
        const viewBtn = clonedElement.querySelector('button');
        if (viewBtn) {
          viewBtn.remove();
        }
        
        // Font size scaling for PDF - MUST be defined before any functions that use it
        // Match StepPreview scaling factors exactly
        const fontSizeScaling = {
          'small': 0.9,   // Increased from 0.8
          'medium': 1.1,  // Increased from 1.0
          'large': 1.2,
          'extra-large': 1.4
        };
        const scale = fontSizeScaling[data.selectedFontSize || 'medium'] || 1.0;
        
        // Define scaleFont function immediately after scale is defined
        // This should match exactly with StepPreview.jsx scaleFont function
        const scaleFont = (baseSize) => {
          const size = parseInt(baseSize);
          return `${Math.round(size * scale)}pt`; // Use pt to match CSS custom properties
        };
        

        
        // Directly modify the cloned element's inline styles to match the selected font size
        const applyScaledFontSizes = (element, depth = 0) => {
          
          // Get the current font size or determine what it should be based on element properties
          let currentFontSize = element.style.fontSize;
          let newFontSize = scaleFont('9pt'); // default base size (match CSS --font-size-base)
          
          // Determine appropriate font size based on element characteristics
          if (element.style.fontSize) {
            // If element already has a font size, scale it (convert px to pt if needed)
            const currentSize = parseInt(element.style.fontSize);
            if (currentSize === 18 || currentSize === 22) newFontSize = scaleFont('18pt'); // Header
            else if (currentSize === 12 || currentSize === 14) newFontSize = scaleFont('12pt'); // Section titles
            else if (currentSize === 10 || currentSize === 12) newFontSize = scaleFont('10pt'); // Company/job titles
            else if (currentSize === 9 || currentSize === 11) newFontSize = scaleFont('9pt'); // Base/contact/details
            else newFontSize = scaleFont('9pt'); // Default fallback
          } else {
            // No font size set, determine based on other styles
            if (element.style.fontWeight === 'bold' && element.style.textTransform === 'uppercase') {
              newFontSize = scaleFont('12pt'); // Section titles (match --font-size-section)
            } else if (element.style.fontWeight === 'bold' || element.style.fontWeight === '600') {
              newFontSize = scaleFont('10pt'); // Company/job titles (match --font-size-content)
            } else if (element.style.color === '#7f8c8d' || element.style.color === 'rgb(127, 140, 141)') {
              newFontSize = scaleFont('9pt'); // Dates and details (match --font-size-details)
            } else if (element.style.marginLeft === '15px') {
              newFontSize = scaleFont('9pt'); // Bullet points (match --font-size-list)
            } else {
              newFontSize = scaleFont('9pt'); // Default base (match --font-size-base)
            }
          }
          
          // Apply the new font size
          element.style.fontSize = newFontSize;
          
          // Recursively process child elements
          Array.from(element.children).forEach(child => applyScaledFontSizes(child, depth + 1));
        };
        
        // Check if it's the first child (header/name)
        if (clonedElement.children.length > 0) {
          clonedElement.children[0].style.fontSize = scaleFont('18pt');
        }
        

        
        // Apply scaled font sizes to all elements
        applyScaledFontSizes(clonedElement);
        

        

        
        // Capture CSS rules for the PDF
        const filteredCssText = Array.from(document.styleSheets).map((sheet) => {
          try {
            const rules = Array.from(sheet.cssRules);
            const previewRules = rules.filter(rule => {
              if (rule.type === CSSRule.STYLE_RULE) {
                const sel = rule.selectorText || '';
                return sel.includes('.preview');
              }
              return false;
            });
            return previewRules.map(rule => rule.cssText).join('\n');
          } catch (e) {
            return '';
          }
        }).filter(Boolean).join('\n');

        // Remove screen-only visual effects that cause a visible edge in PDFs
        const cleanedCssText = filteredCssText
          .replace(/box-shadow\s*:[^;]+;?/gi, '')
          .replace(/-webkit-box-shadow\s*:[^;]+;?/gi, '')
          .replace(/border-radius\s*:[^;]+;?/gi, '');

        // Detect the current template class for targeted overrides
        const previewClasses = previewElement.className.split(' ');
        const templateClass = previewClasses.find(cls => cls !== 'preview') || '';

        
        // PDF-specific overrides to ensure consistent rendering (keep minimal)
        const pdfOverrides = `
          @page { size: Letter; margin: 0; }
          html, body { background: #ffffff !important; margin: 0 !important; padding: 0 !important; }
          /* Keep the preview's own width/padding/margins exactly as in the live DOM */
          .preview { box-shadow: none !important; border: 0 !important; outline: none !important; }
          .preview::before, .preview::after { display: none !important; content: none !important; }
          
          /* CSS Custom Properties for font size scaling (matching StepPreview exactly) */
          :root {
            --font-size-base: ${scaleFont('9pt')} !important;
            --font-size-header: ${scaleFont('18pt')} !important;
            --font-size-section: ${scaleFont('12pt')} !important;
            --font-size-content: ${scaleFont('10pt')} !important;
            --font-size-details: ${scaleFont('9pt')} !important;
            --font-size-list: ${scaleFont('9pt')} !important;
            --font-size-contact: ${scaleFont('9pt')} !important;
          }
          
          /* Root level font size override */
          html { font-size: var(--font-size-base) !important; }
          body { font-size: var(--font-size-base) !important; }
          
          /* Font size overrides using exact LivePreview styling */
          .preview { font-size: var(--font-size-base) !important; }
          .preview > div:first-child { font-size: var(--font-size-header) !important; } /* Header/Name */
          .preview > div:nth-child(2) { font-size: var(--font-size-contact) !important; } /* Contact info */
          
          /* Section titles - multiple ways to target them */
          .preview div[style*="text-transform: uppercase"] { font-size: var(--font-size-section) !important; }
          .preview div[style*="TEXT-TRANSFORM: UPPERCASE"] { font-size: var(--font-size-section) !important; }
          .preview div[style*="letter-spacing"] { font-size: var(--font-size-section) !important; }
          
          /* Company/job titles - multiple ways to target them */
          .preview div[style*="font-weight: bold"] { font-size: var(--font-size-content) !important; }
          .preview div[style*="font-weight:bold"] { font-size: var(--font-size-content) !important; }
          .preview div[style*="fontWeight: bold"] { font-size: var(--font-size-content) !important; }
          .preview div[style*="font-weight: 600"] { font-size: var(--font-size-content) !important; }
          
          /* Dates and details - multiple ways to target them */
          .preview div[style*="color: #7f8c8d"] { font-size: var(--font-size-details) !important; }
          .preview div[style*="color:#7f8c8d"] { font-size: var(--font-size-details) !important; }
          .preview div[style*="color: rgb(127, 140, 141)"] { font-size: var(--font-size-details) !important; }
          
          /* Bullet points - multiple ways to target them */
          .preview div[style*="margin-left: 15px"] { font-size: var(--font-size-list) !important; }
          .preview div[style*="marginLeft: 15px"] { font-size: var(--font-size-list) !important; }
          .preview div[style*="margin-left:15px"] { font-size: var(--font-size-list) !important; }
          
          /* Force font size on all elements as backup */
          .preview * { font-size: var(--font-size-base) !important; }
          .preview div { font-size: var(--font-size-base) !important; }
          .preview span { font-size: var(--font-size-base) !important; }
          
          /* Override any inline styles with maximum specificity */
          .preview [style*="font-size"] { font-size: var(--font-size-base) !important; }
          .preview [style*="fontSize"] { font-size: var(--font-size-base) !important; }
          
          /* Completely natural page flow - no page break rules */
          @page {
            size: Letter;
            margin: 0.5in;
          }
        `;
        

 
        // Create complete HTML document with CSS overrides LAST
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.name || 'Resume'}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700&display=swap" rel="stylesheet">
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
  <style>
              /* Direct inline style overrides - highest specificity */
          .preview [style*="font-size"] { font-size: var(--font-size-base) !important; }
          .preview [style*="font-size:"] { font-size: var(--font-size-base) !important; }
          
          /* Override specific inline styles with matching selectors */
          .preview div[style*="font-size: 18px"] { font-size: var(--font-size-header) !important; }
          .preview div[style*="font-size: 12px"] { font-size: var(--font-size-section) !important; }
          .preview div[style*="font-size: 10px"] { font-size: var(--font-size-content) !important; }
          .preview div[style*="font-size: 9px"] { font-size: var(--font-size-details) !important; }
  </style>
</head>
<body>
  ${clonedElement.outerHTML}
</body>
</html>`;

        // Minify HTML to keep payload very small
        const minifyHtml = (html) => html
          .replace(/>\s+</g, '><')
          .replace(/\n+/g, '')
          .replace(/\s{2,}/g, ' ');
        const minHtmlContent = minifyHtml(htmlContent);

        // Debug: Log the HTML content length and preview


        // Call the backend to generate PDF using multipart upload (smaller, proxy-friendly)
        const htmlBlob = new Blob([minHtmlContent], { type: 'text/html' });
        const formData = new FormData();
        formData.append('html', htmlBlob, 'resume.html');
        
        // Add contact info to save in database
        formData.append('name', data.name || '');
        formData.append('email', data.email || '');
        formData.append('phone', data.phone || '');
        
        // Debug: Check FormData contents
        for (let [key, value] of formData.entries()) {
          console.log('FormData entry:', key, value);
        }

        // Get token directly and only set Authorization header
        const token = localStorage.getItem('resumeToken');
        console.log('Token for PDF generation:', token); // Debug log
        
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        console.log('Headers being sent:', headers); // Debug log
        
        fetch(`${getAPIBaseURL()}/api/resume/generate-pdf-file`, {
          method: 'POST',
          headers: headers,
          body: formData
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
             // Extract filename from the downloadURL
             const url = new URL(result.data.downloadURL);
             const pathParts = url.pathname.split('/');
             const filename = pathParts[pathParts.length - 1];
             
             // Use our download endpoint to record the history
             const downloadEndpoint = `${getAPIBaseURL()}/api/resume/download/${filename}`;
             
             // Use the direct S3 URL since CORS prevents us from using fetch()
             // The backend has already generated the PDF and returned a signed URL

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

    if (user) {

      // Immediately clear everything and redirect to home
      localStorage.removeItem('resumeUser');
      logout();
      // Navigate to home page to avoid any modal issues
      window.location.href = '/';
    } else {

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

  const handleNext = () => {
    if (step < steps.length) {
      trackStepCompletion(steps[step - 1], step);
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleStepClick = (stepId) => {
    if (stepId <= step) {
      setStep(stepId);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch('/api/resume/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('resumeToken')}`
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${data.name || 'resume'}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleStartOver = () => {
    clearData();
    setStep(1);
  };

  // AI Resume Advice Handler
  const handleGetResumeAdvice = async () => {
    try {
      setAdviceLoading(true);
      const advice = await generateResumeAdviceAI(data, jobDescription);
      setResumeAdvice(advice);
      setShowAdvice(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setAdviceLoading(false);
    }
  };

  // AI Cover Letter Handler
  const handleGenerateCoverLetter = async () => {
    try {
      setCoverLetterLoading(true);
      const letter = await generateCoverLetterAI(data, jobDescription, companyName);
      setCoverLetter(letter);
      setShowCoverLetter(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setCoverLetterLoading(false);
    }
  };

  const CurrentStepComponent = steps[step - 1];

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
      <div className="builder-layout">
        {/* Left Side - Resume Builder */}
        <div className="builder-left">
          <div className="site-header">
            <h1>
              HiHired - AI Resume Builder
            </h1>
            <div className="header-controls">
              <button
                onClick={() => window.location.href = '/'}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f3f4f6';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                }}
              >
                ← Back to Home
              </button>
            </div>
          </div>

          
          {/* Stepper and Content */}
          <div className="builder-main-section">
            <div className="stepper-container">
              <Stepper steps={steps} currentStep={step} setStep={setStep} />
            </div>
            <div className="builder-content">
              {step === 1 && <StepPersonal />}
              {step === 2 && <StepExperience />}
              {step === 3 && <StepEducation />}
              {step === 4 && <StepSkills />}
              {step === 5 && <StepSummary />}
              {step === 6 && <StepFormat onNext={handleNext} />}
              
              {/* Navigation Buttons */}
              <div className="navigation-buttons">
                {step < steps.length && (
                  <button
                    className="btn-next"
                    onClick={() => setStep(step + 1)}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#2563eb';
                      e.target.style.transform = 'translateY(-1px)';
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
                  <>
                    {/* All Buttons Section */}
                    <div style={{ 
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.5rem',
                      justifyContent: 'center',
                      margin: '0 auto',
                      maxWidth: '500px'
                    }}>
                      {/* Row 1: Navigation Buttons */}
                      <button
                        onClick={() => setStep(step - 1)}
                        style={{
                          background: 'white',
                          color: '#374151',
                          border: '2px solid #d1d5db',
                          borderRadius: '6px',
                          padding: '0.6rem 1rem',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          fontWeight: 600,
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          height: '42px',
                          width: '100%'
                        }}
                      >
                        ← Previous
                      </button>
                      
                      <button
                        className="btn-view-resume"
                        onClick={handleViewResume}
                        style={{
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.6rem 1rem',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          fontWeight: 600,
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          height: '42px',
                          width: '100%'
                        }}
                      >
                        📄 View Resume
                      </button>
                      
                      {/* Row 2: AI Buttons */}
                      <button
                        onClick={handleGetResumeAdvice}
                        disabled={adviceLoading}
                        style={{
                          background: '#8b5cf6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.6rem 1rem',
                          fontSize: '0.875rem',
                          cursor: adviceLoading ? 'not-allowed' : 'pointer',
                          opacity: adviceLoading ? 0.7 : 1,
                          fontWeight: 600,
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          height: '42px',
                          width: '100%'
                        }}
                      >
                        {adviceLoading ? '🔍 Analyzing...' : '🔍 AI Resume Advice'}
                      </button>
                      
                      <button
                        onClick={handleGenerateCoverLetter}
                        disabled={coverLetterLoading}
                        style={{
                          background: '#ec4899',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.6rem 1rem',
                          fontSize: '0.875rem',
                          cursor: coverLetterLoading ? 'not-allowed' : 'pointer',
                          opacity: coverLetterLoading ? 0.7 : 1,
                          fontWeight: 600,
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          height: '42px',
                          width: '100%'
                        }}
                      >
                        {coverLetterLoading ? '📝 Generating...' : '📝 AI Cover Letter'}
                      </button>
                    </div>
                    
                    {(!jobDescription || !jobDescription.trim()) && (
                      <div style={{ 
                        background: '#fef3c7', 
                        border: '1px solid #f59e0b', 
                        borderRadius: '4px', 
                        padding: '0.5rem',
                        fontSize: '0.8rem',
                        color: '#92400e',
                        textAlign: 'center',
                        marginTop: '0.75rem',
                        maxWidth: '500px',
                        margin: '0.75rem auto 0'
                      }}>
                        💡 <strong>Tip:</strong> For personalized AI features, start with a job description!
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Live Resume Preview */}
        <div className="builder-right">
          <div className="preview-header">
            <h2>Live Resume Preview</h2>
            <div className="preview-controls">
              {user ? (
                <span>{user}</span>
              ) : null}
              <button
                onClick={handleAuthButton}
              >
                {user ? 'Logout' : 'Login / Signup'}
              </button>
              <button
                onClick={toggleFullscreen}
                className="fullscreen-button"
                title={`${isFullscreen ? 'Exit' : 'Enter'} fullscreen mode (F11)`}
              >
                {isFullscreen ? 'Exit Full Screen' : 'Open Full Screen'}
              </button>
            </div>
          </div>
          <div 
            id="resume-preview-container"
            className="preview-content"
          >
            <StepPreview onDownload={handleViewResume} />
          </div>
        </div>
      </div>

             {/* Modals */}
       {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
       {showJobDescModal && <JobDescModal onClose={() => setShowJobDescModal(false)} onJobDescriptionSubmit={handleJobDescSubmit} onProceed={handleProceedAfterChoice} />}
       {showImportModal && <ImportResumeModal onClose={() => setShowImportModal(false)} />}
       
       {/* AI Advice Modal */}
       {showAdvice && (
         <div style={{
           position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
           background: 'rgba(0,0,0,0.25)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center'
         }}>
           <div style={{
             background: 'white', borderRadius: '12px', maxWidth: '600px', width: '90%', maxHeight: '80%',
             overflow: 'auto', padding: '2rem', position: 'relative'
           }}>
             <button
               onClick={() => setShowAdvice(false)}
               style={{
                 position: 'absolute', top: '16px', right: '16px', background: 'transparent',
                 border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999'
               }}
             >×</button>
             <h2 style={{ marginBottom: '1rem', color: '#374151' }}>🔍 AI Resume Advice</h2>
             <div style={{
               background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px',
               padding: '1rem', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '0.95rem'
             }}>
               {resumeAdvice}
             </div>
           </div>
         </div>
       )}
       
       {/* AI Cover Letter Modal */}
       {showCoverLetter && (
         <div style={{
           position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
           background: 'rgba(0,0,0,0.25)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center'
         }}>
           <div style={{
             background: 'white', borderRadius: '12px', maxWidth: '700px', width: '90%', maxHeight: '80%',
             overflow: 'auto', padding: '2rem', position: 'relative'
           }}>
             <button
               onClick={() => setShowCoverLetter(false)}
               style={{
                 position: 'absolute', top: '16px', right: '16px', background: 'transparent',
                 border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999'
               }}
             >×</button>
             <h2 style={{ marginBottom: '1rem', color: '#374151' }}>📝 AI Generated Cover Letter</h2>
             {jobDescription && jobDescription.trim() && (
               <div style={{ marginBottom: '1rem' }}>
                 <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#374151' }}>
                   Company Name (Optional):
                 </label>
                 <input
                   type="text"
                   value={companyName}
                   onChange={(e) => setCompanyName(e.target.value)}
                   placeholder="Enter company name for personalized cover letter"
                   style={{
                     width: '100%', padding: '0.5rem', border: '1px solid #d1d5db',
                     borderRadius: '4px', fontSize: '0.95rem'
                   }}
                 />
               </div>
             )}
             <div style={{
               background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px',
               padding: '1rem', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '0.95rem',
               minHeight: '200px'
             }}>
               {coverLetter}
             </div>
             <div style={{ marginTop: '1rem', textAlign: 'right' }}>
               <button
                 onClick={() => {
                   navigator.clipboard.writeText(coverLetter);
                   alert('Cover letter copied to clipboard!');
                 }}
                 style={{
                   background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px',
                   padding: '0.5rem 1rem', fontSize: '0.875rem', cursor: 'pointer'
                 }}
               >
                 📋 Copy to Clipboard
               </button>
             </div>
           </div>
         </div>
       )}
    </>
  );
}

export default BuilderPage;
