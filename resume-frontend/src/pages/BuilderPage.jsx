import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '../context/AuthContext';
import { useResume } from '../context/ResumeContext';
import Stepper from '../components/Stepper';
import StepPersonal from '../components/StepPersonal';
import StepExperience from '../components/StepExperience';
import StepEducation from '../components/StepEducation';
import StepProjects from '../components/StepProjects';
import StepSkills from '../components/StepSkills';
import StepFormat from '../components/StepFormat';
import StepSummary from '../components/StepSummary';
import LivePreview from '../components/LivePreview';
import AuthModal from '../components/auth/AuthModal';
import JobDescModal from '../components/JobDescModal';
import ImportResumeModal from '../components/ImportResumeModal';
import SEO from '../components/SEO';
import { trackResumeGeneration } from '../components/Analytics';
import './BuilderPage.css';

const steps = [
  "Personal Details",
  "Experience",
  "Projects",
  "Education",
  "Skills",
  "Format",
  "Summary"
];

function BuilderPage() {
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
  const { user, login, logout, getAuthHeaders } = useAuth();
  const { data, saveToDatabaseNow, clearData } = useResume();
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
      // Force all pages to be visible for PDF generation
      // Remove height constraints for PDF generation
      const styleOverride = document.createElement("style");
      styleOverride.innerHTML = ".page-wrapper { height: auto !important; max-height: none !important; overflow: visible !important; } .page-content { height: auto !important; max-height: none !important; overflow: visible !important; }";
      document.head.appendChild(styleOverride);
      const allPageWrappers = document.querySelectorAll(".page-wrapper");
      allPageWrappers.forEach(wrapper => {
        wrapper.style.display = "block";
        wrapper.style.visibility = "visible";
        wrapper.style.opacity = "1";
      });
      const previewElement = document.querySelector('.live-preview-container');
      
      if (previewElement) {
        // Clone the preview element (no inline style expansion to keep HTML small)
        const clonedElement = previewElement.cloneNode(true);
        

        
        // Remove the download button from the cloned element
        const downloadBtns = clonedElement.querySelectorAll('button');
        downloadBtns.forEach(btn => btn.remove());
        
        // IMPORTANT: Remove the outer live-preview-container wrapper's extra spacing/padding
        // which might be causing phantom pages
        if (clonedElement.className === 'live-preview-container') {
          clonedElement.style.padding = '0';
          clonedElement.style.margin = '0';
          clonedElement.style.minHeight = 'auto';
          clonedElement.style.height = 'auto';
        }
        
        // Remove any control panels or debug elements
        const controlPanels = clonedElement.querySelectorAll('.boundary-toggle, [style*="textAlign: center"], [style*="text-align: center"]');
        controlPanels.forEach(panel => {
          // Check if this panel contains a download button
          const hasButton = panel.querySelector('button') || panel.innerHTML.includes('Download PDF');
          if (hasButton) {
            panel.remove();
          }
        });
        
        // Remove the download button container specifically
        const downloadContainer = clonedElement.querySelector('div[style*="textAlign: center"]');
        if (downloadContainer && downloadContainer.innerHTML.includes('Download PDF')) {
          downloadContainer.remove();
        }
        
        // Debug: Log structure to identify empty page cause

        
        // Handle both single-page and multi-page content
        const singlePageContainer = clonedElement.querySelector('.single-page-container');
        const multiPageContainer = clonedElement.querySelector('.multi-page-container');
        
        if (multiPageContainer && !singlePageContainer) {
          
          // Extract content from all page wrappers and combine into single container
          const pageWrappers = multiPageContainer.querySelectorAll('.page-wrapper');
          console.log("HTML before processing:", clonedElement.innerHTML.includes("EDUCATION") ? "Contains EDUCATION" : "Missing EDUCATION");
          console.log("Found", pageWrappers.length, "pages in multi-page container");
          const combinedContent = document.createElement('div');
          combinedContent.className = 'multi-page-pdf-container';
          combinedContent.style.cssText = 'background: white; color: black; padding: 0; margin: 0; box-sizing: border-box;';
          
          pageWrappers.forEach((wrapper, index) => {
            const pageContent = wrapper.querySelector('.page-content');
              if (pageContent) { console.log("Processing page", index + 1, "- Full content includes EDUCATION:", pageContent.innerHTML.includes("EDUCATION")); }
            if (pageContent) {
              // Create a page container to maintain exact page boundaries
              const pageContainer = document.createElement('div');
              pageContainer.className = `pdf-page-${index + 1}`;
              pageContainer.style.cssText = `
                padding: 20px;
                min-height: auto;
                
                overflow: visible;
                box-sizing: border-box;
                ${index > 0 ? 'page-break-before: always;' : ''}
              `;
              
              // Clone the page content
              const contentClone = pageContent.cloneNode(true);
              // Debug: Check what sections are in this page
              const sections = contentClone.querySelectorAll("[style*=fontWeight], div");
              const educationDiv = contentClone.innerHTML.includes("EDUCATION") ? "Has EDUCATION text" : "No EDUCATION text";
              console.log("Page", index + 1, "- Education check:", educationDiv);
              contentClone.style.height = "auto";
              contentClone.style.maxHeight = "none";
              contentClone.style.overflow = "visible";
              pageContainer.appendChild(contentClone);
              
              // Add the page container
              combinedContent.appendChild(pageContainer);
            }
          });
          
          // Replace the multi-page container with our combined single-page container
          multiPageContainer.parentNode.replaceChild(combinedContent, multiPageContainer);
        } else if (!singlePageContainer && !multiPageContainer) {
          // No content containers found
        } else {
          // Using existing single-page container
        }
        
        // Remove any remaining multi-page elements
        const remainingMultiPageElements = clonedElement.querySelectorAll('.multi-page-container, .page-wrapper');
        remainingMultiPageElements.forEach(el => {
          el.remove();
        });
        
        // DIFFERENT APPROACH: Clean up the HTML to prevent phantom pages
        // Remove any empty divs that might cause page breaks
        const allDivs = clonedElement.querySelectorAll('div');
        allDivs.forEach(div => {
          // Remove divs that are empty or only contain whitespace
          if (div && (!div.textContent || div.textContent.trim() === '')) {
            // Check if it has no visible children
            const hasVisibleChildren = Array.from(div.children).some(child => 
              child.offsetWidth > 0 || child.offsetHeight > 0 || child.textContent.trim() !== ''
            );
            if (!hasVisibleChildren && !div.querySelector('img') && !div.querySelector('svg')) {
              div.remove();
            }
          }
        });
        
        // Remove any elements with excessive height that might push content to next page
        const containerDivs = clonedElement.querySelectorAll('[style*="height"]');
        containerDivs.forEach(div => {
          if (div.style.height && div.style.height !== 'auto') {
            div.style.height = 'auto';
          }
          if (div.style.minHeight) {
            div.style.minHeight = 'auto';
          }
        });
        
        // Collect essential CSS for PDF generation
        const stylesheets = Array.from(document.styleSheets);
        const cssRules = [];
        
        stylesheets.forEach(sheet => {
          try {
            const rules = Array.from(sheet.cssRules);
            const relevantRules = rules.filter(rule => {
              if (rule.type === CSSRule.STYLE_RULE) {
                const selector = rule.selectorText || '';
                return selector.includes('.live-preview-container') || 
                       selector.includes('.page-wrapper') || 
                       selector.includes('.single-page-container') ||
                       selector.includes('.page-content');
              }
              return false;
            });
            
            cssRules.push(...relevantRules.map(rule => rule.cssText));
          } catch (e) {
            // Skip inaccessible stylesheets
          }
        });
        
        const filteredCssText = cssRules.join('\n');

        // Remove screen-only visual effects that cause a visible edge in PDFs
        const cleanedCssText = filteredCssText
          .replace(/box-shadow\s*:[^;]+;?/gi, '')
          .replace(/-webkit-box-shadow\s*:[^;]+;?/gi, '')
          .replace(/border-radius\s*:[^;]+;?/gi, '');

        // Detect the current template class for targeted overrides
        const previewClasses = previewElement.className.split(' ');
        const templateClass = previewClasses.find(cls => cls !== 'live-preview-container') || '';
        
        
        // Check if this is truly single-page content
        const singlePageDiv = clonedElement.querySelector('.single-page-container');
        const multiPageDiv = clonedElement.querySelector('.multi-page-container');
        const isSinglePageContent = singlePageDiv && !multiPageDiv;
        
        // CRITICAL FIX: Apply font size scaling to match preview
        const selectedFontSize = data.selectedFontSize || 'medium';
        const selectedFormat = data.selectedFormat || 'temp1';
        
        // Font size multipliers (must match LivePreview.jsx)
        const fontSizeMultipliers = {
          'small': 0.85,
          'medium': 1.0,
          'large': 1.15,
          'extra-large': 1.3
        };
        
        // Base scale factor for preview (2x) - same as LivePreview
        const baseScaleFactor = 2;
        const fontScale = baseScaleFactor * (fontSizeMultipliers[selectedFontSize] || 1.0);
        
        // Apply the scaling to the container for PDF
        if (singlePageDiv) {
          // Scale all font sizes in the container
          const scaleAllFontSizes = (element) => {
            // Process current element
            if (element.style && element.style.fontSize) {
              const currentSize = parseFloat(element.style.fontSize);
              if (!isNaN(currentSize)) {
                // Already scaled by LivePreview, no need to scale again
                // Just ensure it's preserved
              }
            }
            
            // Process all children
            Array.from(element.children).forEach(child => {
              scaleAllFontSizes(child);
            });
          };
          
          scaleAllFontSizes(singlePageDiv);
        }
        
        // PDF-specific overrides to ensure consistent rendering (keep minimal)
        const pdfOverrides = `
          @page { 
            size: Letter; 
            margin: 0.5in;
          }
          
          /* Allow natural page breaks for long content */
          body {
            orphans: 2;
            widows: 2;
            page-break-inside: auto;
            height: auto !important;
          }
          
          /* Ensure sections can break naturally if needed */
          .single-page-container {
            page-break-inside: auto;
            break-inside: auto;
            height: auto !important;
            max-height: none !important;
            min-height: auto !important;
          }
          
          /* IMPORTANT: Preserve font sizes from inline styles */
          /* Do not override fontSize that's already set inline */
          div[style*="fontSize"], 
          div[style*="font-size"],
          span[style*="fontSize"],
          span[style*="font-size"] {
            /* Their inline font-size should be preserved, not overridden */
          }
          
          /* Ensure page break elements work correctly with multiple CSS approaches */
          div[style*="page-break-before: always"], div[style*="break-before: page"] {
                page-break-before: always !important;
                break-before: page !important;
            -webkit-break-before: page !important;
                margin-top: 0 !important;
            padding-top: 0 !important;
          }
          
          /* Multi-page PDF container handling */
          .multi-page-pdf-container {
            width: 100%;
            margin: 0;
            padding: 0;
          }
          
          /* Each PDF page should be exactly one page */
          .multi-page-pdf-container > div[class^="pdf-page-"] {
            page-break-after: always !important;
            page-break-inside: avoid !important;
            min-height: auto !important;
            /* max-height: 10in !important; */
            overflow: visible !important;
            box-sizing: border-box !important;
          }
          
          /* Last page shouldn't have page break after */
          .multi-page-pdf-container > div[class^="pdf-page-"]:last-child {
            page-break-after: avoid !important;
          }
          
          /* Additional page break support */
          .page-content {
            display: block !important;
            visibility: visible !important;
            height: auto !important;
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
          }
          
          html, body { 
            background: #ffffff !important; 
            margin: 0 !important; 
            padding: 0 !important; 
            color: #000000 !important;
            width: 100% !important;
            max-width: none !important;
            min-width: 100% !important;
          }
          
          /* Ensure all containers are visible and match preview layout */
          .live-preview-container { 
            background: #ffffff !important; 
            color: #000000 !important;
            display: block !important;
            visibility: visible !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
            width: 100% !important;
            max-width: none !important;
            min-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          .single-page-container { 
            background: #ffffff !important; 
            color: #000000 !important;
            display: block !important;
            visibility: visible !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
            width: 100% !important;
            max-width: none !important;
            min-width: 100% !important;
            padding: 20px !important;
            margin: 0 !important;
            box-sizing: border-box !important;
          }
          
          /* Hide multi-page containers since we convert to single-page */
          .multi-page-container, .page-wrapper {
            display: none !important;
          }
          
          /* Remove borders from containers only */
          .live-preview-container, .single-page-container {
            border: none !important;
            box-shadow: none !important;
            outline: none !important;
          }
          
          /* Remove 3D transform effects for straight PDF boundaries */
          .single-page-container {
            transform: none !important;
            -webkit-transform: none !important;
            -moz-transform: none !important;
            -ms-transform: none !important;
          }
          
          .single-page-container:hover {
            transform: none !important;
            -webkit-transform: none !important;
            -moz-transform: none !important;
            -ms-transform: none !important;
          }
          
          /* Force all elements to use available width and prevent cutoff */
          * {
            word-wrap: break-word !important;
            word-break: normal !important;
            max-width: none !important;
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
            box-sizing: border-box !important;
          }
          
          /* Only force black color on main containers, preserve template colors */
          body, .live-preview-container, .single-page-container {
            color: #000000 !important;
          }
          
          /* Ensure all text containers have full width and proper text handling */
          /* BUT DO NOT override font sizes */
          div, p, span {
            max-width: none !important;
            width: auto !important;
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
            white-space: normal !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            hyphens: auto !important;
            /* Do NOT set font-size here - preserve inline styles */
          }
          
          /* Ensure experience and content sections don't get truncated */
          div[style*="marginBottom: 6px"], 
          div[style*="margin-bottom: 6px"],
          div[style*="lineHeight"],
          div[style*="line-height"] {
            width: 100% !important;
            max-width: none !important;
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
            word-wrap: break-word !important;
            white-space: normal !important;
          }
          
          /* Add section title borders for separators */
          div[style*="fontSize: 11px"][style*="fontWeight: bold"][style*="textTransform: uppercase"],
          div[style*="font-size: 11px"][style*="font-weight: bold"][style*="text-transform: uppercase"] {
            border-bottom: 1px solid #000000 !important;
            padding-bottom: 4px !important;
            margin-bottom: 8px !important;
            width: 100% !important;
          }
          
          /* Hide buttons only */
          button {
            display: none !important;
          }
        `;
        

 
        // Get the font based on template
        console.log("Current data.selectedFormat:", data.selectedFormat);
        console.log("Current data.template:", data.template);
        const getTemplateFont = () => {
          switch(data.selectedFormat || 'temp1') {
            case 'temp1':
              return "'Calibri', 'Arial', sans-serif";
            case 'industry-manager':
              return "'Georgia', serif";
            case 'modern':
              return "'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', sans-serif";
            default:
              return "'Calibri', 'Arial', sans-serif";
          }
        };
        const templateFont = getTemplateFont();
        console.log("Using font for template", data.selectedFormat, ":", templateFont);
        
        // Create complete HTML document with CSS overrides LAST
        // Comprehensive font debugging
        console.log("Template (selectedFormat):", data.selectedFormat);
        console.log("Font selected:", templateFont);
        console.log("All data keys:", Object.keys(data));
        
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.name || 'Resume'}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    /* Use a consistent font for PDF generation */
    body, * {
      font-family: 'Arial', 'Helvetica', sans-serif !important;
      line-height: 1.2 !important;
    }
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
    /* CRITICAL: Remove any font-size overrides that might interfere with inline styles */
    /* Inline styles should always win for font sizes */
    * {
      /* Reset any font-size !important that might override inline styles */
    }
    
    /* Ensure font size scaling from selected size (${selectedFontSize}) is preserved */
    /* The preview scales fonts by ${fontScale}x which should be in inline styles */
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
             
             // Just open the S3 URL directly - it's pre-signed
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
          .preview { font-family: 'Segoe UI', 'Tahoma', sans-serif; }
          .preview * { font-family: 'Segoe UI', 'Tahoma', sans-serif; }
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
                         <div style={{ position: 'absolute', right: '2rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '1rem', zIndex: 20 }}>
              <button
                onClick={() => window.location.href = '/'}
                style={{
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
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease'
                }}
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
            <div className="stepper-container">
              <Stepper steps={steps} currentStep={step} setStep={setStep} />
            </div>
            <div className="builder-content">
              {step === 1 && <StepPersonal />}
              {step === 2 && <StepExperience />}
              {step === 3 && <StepProjects />}
              {step === 4 && <StepEducation />}
              {step === 5 && <StepSkills />}
              {step === 6 && <StepFormat />}
              {step === 7 && <StepSummary />}
              
                             {/* Navigation Buttons */}
               <div style={{ 
                 display: 'flex', 
                 gap: '1rem', 
                 marginTop: '2rem',
                 alignItems: 'center',
                 justifyContent: 'center',
                 width: '100%'
               }}>
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
                   <>
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
                   </>
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
          minHeight: '100vh',
          overflow: 'auto'
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
              overflow: 'visible', 
              padding: '1rem',
              background: 'white',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
                            <LivePreview onDownload={handleViewResume} />
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

export default BuilderPage;
