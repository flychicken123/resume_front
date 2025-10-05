import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useResume } from '../context/ResumeContext';
import { useFeedback } from '../context/FeedbackContext';
import { setLastStep } from '../utils/exitTracking';
import { TEMPLATE_SLUGS, DEFAULT_TEMPLATE_ID, normalizeTemplateId } from '../constants/templates';
import Stepper from '../components/Stepper';
import StepPersonal from '../components/StepPersonal';
import StepImport from '../components/StepImport';
import StepExperience from '../components/StepExperience';
import StepEducation from '../components/StepEducation';
import StepProjects from '../components/StepProjects';
import StepSkills from '../components/StepSkills';
import StepJobDescription from '../components/StepJobDescription';
import StepFormat from '../components/StepFormat';
import StepSummary from '../components/StepSummary';
import StepCoverLetter from '../components/StepCoverLetter';
import LivePreview from '../components/LivePreview';
import AuthModal from '../components/auth/AuthModal';
import ImportResumeModal from '../components/ImportResumeModal';
import UpgradeModal from '../components/UpgradeModal';
import SubscriptionStatus from '../components/SubscriptionStatus';
import SEO from '../components/SEO';
import { trackResumeGeneration } from '../components/Analytics';
import { computeJobMatches, getJobMatches } from '../api';
import './BuilderPage.css';

const getAPIBaseURL = () => {
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8081';
    }
    return window.location.hostname === 'www.hihired.org' ? 'https://hihired.org' : window.location.origin;
  }
  return process.env.REACT_APP_API_URL || 'http://localhost:8081';
};

const derivePrimaryLocation = (resumeData) => {
  if (!resumeData || typeof resumeData !== 'object') {
    return '';
  }

  const formatLocation = (parts) => parts.filter(Boolean).join(', ');

  const experiences = Array.isArray(resumeData.experiences) ? resumeData.experiences.filter(Boolean) : [];
  for (let i = experiences.length - 1; i >= 0; i -= 1) {
    const exp = experiences[i];
    if (!exp) continue;
    if (exp.remote) {
      return 'Remote';
    }
    const loc = formatLocation([exp.city, exp.state, exp.country]);
    if (loc) {
      return loc;
    }
    if (typeof exp.location === 'string' && exp.location.trim()) {
      return exp.location.trim();
    }
  }

  const education = Array.isArray(resumeData.education) ? resumeData.education.filter(Boolean) : [];
  for (let i = education.length - 1; i >= 0; i -= 1) {
    const edu = education[i];
    if (!edu) continue;
    if (typeof edu.location === 'string' && edu.location.trim()) {
      return edu.location.trim();
    }
    const loc = formatLocation([edu.city, edu.state, edu.country]);
    if (loc) {
      return loc;
    }
  }

  return '';
};

const US_STATE_ABBREVIATIONS = new Set([
  'al', 'ak', 'az', 'ar', 'ca', 'co', 'ct', 'de', 'dc', 'fl', 'ga', 'hi', 'id', 'il', 'in', 'ia', 'ks', 'ky', 'la', 'me', 'md', 'ma', 'mi', 'mn', 'ms', 'mo', 'mt', 'ne', 'nv', 'nh', 'nj', 'nm', 'ny', 'nc', 'nd', 'oh', 'ok', 'or', 'pa', 'ri', 'sc', 'sd', 'tn', 'tx', 'ut', 'vt', 'va', 'wa', 'wv', 'wi', 'wy',
]);

const US_STATE_NAMES = [
  'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut', 'delaware', 'district of columbia', 'florida', 'georgia', 'hawaii', 'idaho', 'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana', 'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska', 'nevada', 'new hampshire', 'new jersey', 'new mexico', 'new york', 'north carolina', 'north dakota', 'ohio', 'oklahoma', 'oregon', 'pennsylvania', 'rhode island', 'south carolina', 'south dakota', 'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington', 'west virginia', 'wisconsin', 'wyoming',
];

const US_KEYWORDS = ['united states', 'usa', 'u.s.', 'u.s.a', 'america', 'us-based'];
const NON_US_KEYWORDS = ['canada', 'ontario', 'quebec', 'british columbia', 'alberta', 'saskatchewan', 'manitoba', 'new brunswick', 'nova scotia', 'pei', 'prince edward island', 'toronto', 'vancouver', 'montreal', 'ottawa', 'calgary', 'europe', 'united kingdom', 'uk', 'germany', 'france', 'spain', 'italy', 'netherlands', 'belgium', 'sweden', 'norway', 'denmark', 'finland', 'switzerland', 'poland', 'india', 'australia', 'new zealand', 'mexico', 'brazil', 'singapore'];

const sanitizeLocationToken = (token) => token.replace(/[^a-z]/g, '');

const isLikelyUSLocation = (value) => {
  if (!value || typeof value !== 'string') {
    return false;
  }
  const normalized = value.toLowerCase();
  if (NON_US_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return false;
  }
  if (US_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return true;
  }
  if (US_STATE_NAMES.some((state) => normalized.includes(state))) {
    return true;
  }
  const tokens = normalized.split(/[,/\-\s]+/).filter(Boolean);
  for (const token of tokens) {
    if (US_STATE_ABBREVIATIONS.has(sanitizeLocationToken(token))) {
      return true;
    }
  }
  return false;
};

const steps = [
  "Import Resume",
  "Personal Details",
  "Job Description (Optional)",
  "Experience",
  "Projects",
  "Education",
  "Skills",
  "Template & Format",
  "Summary",
  "Job Matches",
  "Cover Letter"
];
const STEP_IDS = {
  IMPORT: 1,
  PERSONAL: 2,
  JOB_DESCRIPTION: 3,
  EXPERIENCE: 4,
  PROJECTS: 5,
  EDUCATION: 6,
  SKILLS: 7,
  FORMAT: 8,
  SUMMARY: 9,
  JOB_MATCHES: 10,
  COVER_LETTER: 11,
};


function BuilderPage() {
  const [step, setStep] = useState(() => {
    if (typeof window !== 'undefined') {
      const seenImport = window.localStorage.getItem('resumeImportSeen');
      if (seenImport === 'true') {
        return STEP_IDS.PERSONAL;
      }
    }
    return STEP_IDS.IMPORT;
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [downloadNotice, setDownloadNotice] = useState(null);
  const [userRequestedImport, setUserRequestedImport] = useState(false);
  const [jobMatches, setJobMatches] = useState([]);
  const [jobMatchesHash, setJobMatchesHash] = useState(null);
  const [jobMatchesLoading, setJobMatchesLoading] = useState(false);
  const [jobMatchesError, setJobMatchesError] = useState(null);
  const [jobMatchesLocation, setJobMatchesLocation] = useState('');
  const [locationManuallySet, setLocationManuallySet] = useState(false);
  const { user, logout } = useAuth();
  const { triggerFeedbackPrompt, scheduleFollowUp } = useFeedback();
  const { data } = useResume();
  const displayName = typeof user === 'string' ? user : (user?.name || user?.email || '');
  const selectedFormat = normalizeTemplateId(data?.selectedFormat);
  const autoLocation = useMemo(() => derivePrimaryLocation(data), [data]);
  const hasExistingResumeData = useMemo(() => {
    if (!data) return false;
    const hasPersonal = Boolean(data.name || data.email || data.phone);
    const hasExperience = Array.isArray(data.experiences) && data.experiences.some((exp) => exp && (exp.jobTitle || exp.company || exp.description));
    const hasEducation = Array.isArray(data.education) && data.education.some((edu) => edu && (edu.degree || edu.school || edu.field || edu.graduationYear));
    const hasProjects = Array.isArray(data.projects) && data.projects.some((proj) => proj && (proj.projectName || proj.description || proj.technologies));
    const hasSummary = Boolean(data.summary);
    return hasPersonal || hasExperience || hasEducation || hasProjects || hasSummary;
  }, [data]);

  
  // Load job description from localStorage on component mount
  useEffect(() => {
    const savedJobDesc = localStorage.getItem('jobDescription');
    if (savedJobDesc) {
      setJobDescription(savedJobDesc);
    }
  }, []);

  
  useEffect(() => {
    if (!locationManuallySet) {
      setJobMatchesLocation(autoLocation || '');
    }
  }, [autoLocation, locationManuallySet]);

  useEffect(() => {
    if (!user) {
      setJobMatches([]);
      setJobMatchesHash(null);
      setJobMatchesError(null);
      setJobMatchesLocation(autoLocation || '');
      setLocationManuallySet(false);
      return;
    }

    let cancelled = false;
    setJobMatchesLoading(true);
    getJobMatches({ limit: 20 })
      .then((response) => {
        if (cancelled) return;
        const matches = Array.isArray(response.matches) ? response.matches : [];
        setJobMatches(matches);
        setJobMatchesHash(response.resumeHash || null);
        setJobMatchesError(null);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Failed to load stored job matches', error);
        setJobMatchesError(error.message || 'Unable to load job matches.');
        setJobMatches([]);
        setJobMatchesHash(null);
      })
      .finally(() => {
        if (cancelled) return;
        setJobMatchesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, autoLocation]);


  const effectiveLocation = (jobMatchesLocation && jobMatchesLocation.trim()) || autoLocation || '';
  const isUSPreferredLocation = useMemo(() => isLikelyUSLocation(effectiveLocation), [effectiveLocation]);
  const filteredJobMatches = useMemo(() => {
    if (!Array.isArray(jobMatches)) {
      return [];
    }
    if (!isUSPreferredLocation) {
      return jobMatches;
    }
    return jobMatches.filter((match) => {
      if (!match) {
        return false;
      }
      const location = typeof match.job_location === 'string' ? match.job_location : '';
      const remoteType = typeof match.job_remote_type === 'string' ? match.job_remote_type.toLowerCase() : '';
      if (isLikelyUSLocation(location)) {
        return true;
      }
      if (remoteType.includes('us') || remoteType.includes('united states')) {
        return true;
      }
      return false;
    });
  }, [jobMatches, isUSPreferredLocation]);
  const filteredOutCount = Math.max(jobMatches.length - filteredJobMatches.length, 0);
  const topMatch = filteredJobMatches.length > 0 ? filteredJobMatches[0] : null;
  const secondaryMatches = filteredJobMatches.length > 1 ? filteredJobMatches.slice(1) : [];


  useEffect(() => {
    if (step !== STEP_IDS.IMPORT || userRequestedImport) {
      return;
    }
    const seenImport = typeof window !== 'undefined' && window.localStorage.getItem('resumeImportSeen') === 'true';
    if (seenImport || hasExistingResumeData) {
      if (!seenImport && typeof window !== 'undefined') {
        window.localStorage.setItem('resumeImportSeen', 'true');
      }
      setUserRequestedImport(false);
      setStep(STEP_IDS.PERSONAL);
    }
  }, [step, hasExistingResumeData, userRequestedImport]);

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
  const handlePreferredLocationChange = (value) => {
    setJobMatchesLocation(value);
    if (!locationManuallySet) {
      setLocationManuallySet(true);
    }
    if (!value) {
      setLocationManuallySet(false);
    }
  };

  const handleUseDetectedLocation = () => {
    setJobMatchesLocation(autoLocation || '');
    setLocationManuallySet(false);
  };

  const handleUseRemoteLocation = () => {
    setJobMatchesLocation('Remote (US)');
    setLocationManuallySet(true);
  };

  const buildMatchPayload = useCallback(() => {
    if (!data) {
      return null;
    }

    const preferredLocation = (jobMatchesLocation && jobMatchesLocation.trim()) || autoLocation || '';
    return {
      resume: data,
      jobDescription,
      preferredLocation,
    };
  }, [data, jobDescription, jobMatchesLocation, autoLocation]);

  const fetchJobMatches = useCallback(async (options = {}) => {
    const { autoSwitchToStep = false } = options;

    if (!user) {
      setJobMatchesError('Log in to see matching jobs.');
      return;
    }

    const payload = buildMatchPayload();
    if (!payload) {
      setJobMatchesError('Add resume details to view matching jobs.');
      return;
    }

    try {
      setJobMatchesLoading(true);
      setJobMatchesError(null);
      const response = await computeJobMatches(payload);
      const matches = Array.isArray(response.matches) ? response.matches : [];
      setJobMatches(matches);
      setJobMatchesHash(response.resumeHash || null);
      if (autoSwitchToStep && matches.length > 0 && step !== STEP_IDS.JOB_MATCHES) {
        setStep(STEP_IDS.JOB_MATCHES);
      }

    } catch (error) {
      console.error('Failed to compute job matches', error);
      setJobMatchesError(error.message || 'Unable to compute job matches.');
    } finally {
      setJobMatchesLoading(false);
    }
  }, [user, buildMatchPayload, step]);
  useEffect(() => {
    if (step !== STEP_IDS.JOB_MATCHES) {
      return;
    }
    if (!user) {
      return;
    }
    if (jobMatchesLoading) {
      return;
    }
    if (jobMatches.length > 0) {
      return;
    }
    fetchJobMatches({ autoSwitchToStep: false }).catch((error) => {
      console.error('Automatic job match fetch failed', error);
    });
  }, [step, user, jobMatches.length, jobMatchesLoading, fetchJobMatches]);


  const handleImportComplete = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('resumeImportSeen', 'true');
    }
    setUserRequestedImport(false);
    setStep(STEP_IDS.PERSONAL);
  };
  const handleStepChange = (nextStep) => {
    if (nextStep === STEP_IDS.IMPORT) {
      setUserRequestedImport(true);
    } else {
      setUserRequestedImport(false);
    }
    setStep(nextStep);
  };

  const goToPreviousStep = () => {
    handleStepChange(Math.max(step - 1, STEP_IDS.IMPORT));
  };

  const goToNextStep = () => {
    if (step === STEP_IDS.IMPORT) {
      handleImportComplete();
      return;
    }
    handleStepChange(Math.min(step + 1, steps.length));
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
  // API base URL function
  
  // Handler for view resume action
  const handleViewResume = async () => {
    let styleOverride = null;
    try {
      // Check if user is authenticated
      if (!user) {
        alert('Please log in to view your resume.');
        setShowAuthModal(true);
        return;
      }

      const canProceed = await checkSubscriptionLimit();
      if (!canProceed) {
        if (styleOverride && styleOverride.parentNode) {
          styleOverride.parentNode.removeChild(styleOverride);
        }
        return;
      }

      setDownloadNotice(null);

      // Track resume generation
      trackResumeGeneration(selectedFormat || 'default');
      fetchJobMatches({ autoSwitchToStep: true }).catch((error) => console.error('Job match computation during download failed', error));

      // Update button state
      const viewButton = document.querySelector('button[onClick]');
      if (viewButton) {
        viewButton.textContent = 'Generating PDF...';
        viewButton.disabled = true;
      }

      // Capture the HTML content from the live preview
      // Force all pages to be visible for PDF generation
      // Remove height constraints for PDF generation
      styleOverride = document.createElement("style");
      styleOverride.innerHTML = `
        .page-wrapper {
          height: auto !important;
          max-height: none !important;
          overflow: visible !important;
        }
        .page-content {
          height: auto !important;
          max-height: none !important;
          overflow: visible !important;
        }
      `;
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
          clonedElement.style.background = '#ffffff';
          clonedElement.style.boxShadow = 'none';
          clonedElement.style.border = 'none';
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
        
        const overlaySelectors = [
          '.page-header',
          '.page-number',
          '.page-break-indicator',
          '.page-boundary-line',
          '.page-size-indicator',
          '.page-corner-indicator',
          '.page-margin-guide',
          '.page-break-line',
          '.page-content-area',
          '.page-navigation',
          '.page-info'
        ];
        overlaySelectors.forEach((selector) => {
          clonedElement.querySelectorAll(selector).forEach((el) => el.remove());
        });
        
        // Debug: Log structure to identify empty page cause

        
        // Handle both single-page and multi-page content
        const singlePageContainer = clonedElement.querySelector('.single-page-container');
        const multiPageContainer = clonedElement.querySelector('.multi-page-container');

        const normalizeElementSizing = (element) => {
          if (!element || !element.style) return;
          element.style.setProperty('height', 'auto', 'important');
          element.style.setProperty('max-height', 'none', 'important');
          element.style.setProperty('min-height', '0', 'important');
          element.style.removeProperty('transform');
          element.style.removeProperty('-webkit-transform');
          Array.from(element.children || []).forEach(child => normalizeElementSizing(child));
        };

        let workingSinglePageContainer = singlePageContainer;

        if (singlePageContainer && (!multiPageContainer || multiPageContainer.childElementCount === 0)) {
          const containerClone = singlePageContainer.cloneNode(true);
          normalizeElementSizing(containerClone);
          containerClone.style.padding = '12px 20px 20px 20px';
          containerClone.style.margin = '0';
          containerClone.style.border = 'none';
          containerClone.style.boxShadow = 'none';
          containerClone.style.borderRadius = '0';
          containerClone.style.background = '#ffffff';

          const cleanRoot = document.createElement('div');
          cleanRoot.className = 'pdf-single-page-root';
          cleanRoot.style.cssText = 'background:#ffffff;color:#000;margin:0;padding:0;box-sizing:border-box;';
          cleanRoot.appendChild(containerClone);

          clonedElement.innerHTML = '';
          clonedElement.appendChild(cleanRoot);

          workingSinglePageContainer = containerClone;
        }

        if (multiPageContainer && !workingSinglePageContainer) {
          const pageWrappers = multiPageContainer.querySelectorAll('.page-wrapper');
          console.log("HTML before processing:", clonedElement.innerHTML.includes("EDUCATION") ? "Contains EDUCATION" : "Missing EDUCATION");
          console.log("Found", pageWrappers.length, "pages in multi-page container");

          const combinedContent = document.createElement('div');
          combinedContent.className = 'multi-page-pdf-container';
          combinedContent.style.cssText = 'background: white; color: black; padding: 0; margin: 0; box-sizing: border-box;';

          const measuredPages = Array.from(pageWrappers)
            .map(wrapper => ({
              wrapper,
              pageContent: wrapper.querySelector('.page-content') || wrapper
            }))
            .filter(item => !!item.pageContent);

          measuredPages.forEach((page, index) => {
            const pageContainer = document.createElement('div');
            pageContainer.className = `pdf-page-${index + 1}`;

            let paddingTop = '20px';
            let paddingRight = '20px';
            let paddingBottom = '20px';
            let paddingLeft = '20px';

            if (page.wrapper && window.getComputedStyle) {
              const computedPadding = window.getComputedStyle(page.wrapper);
              paddingTop = computedPadding.getPropertyValue('padding-top') || paddingTop;
              paddingRight = computedPadding.getPropertyValue('padding-right') || paddingRight;
              paddingBottom = computedPadding.getPropertyValue('padding-bottom') || paddingBottom;
              paddingLeft = computedPadding.getPropertyValue('padding-left') || paddingLeft;
            }

            const parsedTop = parseFloat(paddingTop);
            let normalizedTop = Number.isNaN(parsedTop) ? 18 : Math.min(parsedTop, 18);
            if (index === 0) {
              normalizedTop = 16;
            }
            paddingTop = `${normalizedTop}px`;

            pageContainer.style.cssText = `
              width: 100%;
              padding: ${paddingTop} ${paddingRight} ${paddingBottom} ${paddingLeft};
              margin: 0;
              box-sizing: border-box;
              background: white;
              color: black;
              border: none;
              box-shadow: none;
              border-radius: 0;
              page-break-inside: avoid;
            `;

            const contentClone = page.pageContent.cloneNode(true);
            normalizeElementSizing(contentClone);
            contentClone.style.background = 'white';
            contentClone.style.color = 'black';
            pageContainer.appendChild(contentClone);

            if (index < measuredPages.length - 1) {
              pageContainer.style.pageBreakAfter = 'always';
            }

            combinedContent.appendChild(pageContainer);
          });

          multiPageContainer.parentNode.replaceChild(combinedContent, multiPageContainer);
        } else if (!singlePageContainer && !multiPageContainer) {
          // No content containers found
        } else {
          // Using existing single-page container
        }

        if (workingSinglePageContainer) {
          workingSinglePageContainer.style.paddingTop = '12px';
          workingSinglePageContainer.style.boxShadow = 'none';
          workingSinglePageContainer.style.border = 'none';
          workingSinglePageContainer.style.borderRadius = '0';
          workingSinglePageContainer.style.background = '#ffffff';
        }

        // DIFFERENT APPROACH: Clean up the HTML to prevent phantom pages
        // Remove any empty divs that might cause page breaks
        const allDivs = clonedElement.querySelectorAll('div');
        const hasStructuralStyles = (element) => {
          if (!element) {
            return false;
          }
          const inlineStyle = (element.getAttribute('style') || '').toLowerCase();
          const inlineBorder = ['border-bottom', 'border-top', 'border-left', 'border-right', 'border-width'].some(prop => inlineStyle.includes(prop)) && !inlineStyle.includes('border: none');
          const inlineBackground = inlineStyle.includes('background') && !inlineStyle.includes('background: none') && !inlineStyle.includes('background: transparent');
          const inlineShadow = inlineStyle.includes('box-shadow') && !inlineStyle.includes('box-shadow: none');
          if (inlineBorder || inlineBackground || inlineShadow) {
            return true;
          }
          if (window.getComputedStyle) {
            try {
              const computed = window.getComputedStyle(element);
              const borderProps = ['borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth'];
              const hasBorder = borderProps.some(prop => {
                const value = parseFloat(computed[prop]);
                return !Number.isNaN(value) && value > 0;
              });
              const background = computed.backgroundColor;
              const hasBackground = background && background !== 'rgba(0, 0, 0, 0)' && background !== 'transparent';
              const hasBoxShadow = computed.boxShadow && computed.boxShadow !== 'none';
              if (hasBorder || hasBackground || hasBoxShadow) {
                return true;
              }
            } catch (err) {
              // Ignore errors from detached nodes
            }
          }
          return false;
        };
        allDivs.forEach(div => {
          if (!div) return;
          const className = div.className || '';
          if (className.includes('page-wrapper') || className.includes('page-content') || className.includes('pdf-page')) {
            return;
          }
          // Remove divs that are empty or only contain whitespace
          if (!div.textContent || div.textContent.trim() === '') {
            // Check if it has no visible children
            const hasVisibleChildren = Array.from(div.children).some(child =>
              child.offsetWidth > 0 || child.offsetHeight > 0 || child.textContent.trim() !== ''
            );
            if (
              !hasVisibleChildren &&
              !hasStructuralStyles(div) &&
              !div.querySelector('img') &&
              !div.querySelector('svg')
            ) {
              div.remove();
            }
          }
        });
        
        // Remove any elements with excessive height that might push content to next page
        const containerDivs = clonedElement.querySelectorAll('[style*="height"]');
        containerDivs.forEach(div => {
          if (!div) return;
          const className = div.className || '';
          if (className.includes('page-wrapper') || className.includes('page-content') || className.includes('pdf-page')) {
            return;
          }
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

        // CRITICAL FIX: Apply font size scaling to match preview
        const selectedFontSize = data.selectedFontSize || 'medium';
        
        // Font size multipliers (must match LivePreview.jsx)
        const fontSizeMultipliers = {
          'small': 1.0,
          'medium': 1.2,
          'large': 1.5,
          'extra-large': 1.8
        };
        
        // Base scale factor for preview (2x) - same as LivePreview
        const baseScaleFactor = 2;
        const fontScale = baseScaleFactor * (fontSizeMultipliers[selectedFontSize] || 1.0);

        const getTemplateFont = () => {
          switch (selectedFormat || DEFAULT_TEMPLATE_ID) {
            case TEMPLATE_SLUGS.CLASSIC_PROFESSIONAL:
              return "'Calibri', 'Arial', sans-serif";
            case TEMPLATE_SLUGS.EXECUTIVE_SERIF:
              return "'Georgia', serif";
            case TEMPLATE_SLUGS.MODERN_CLEAN:
              return "'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', sans-serif";
            default:
              return "'Calibri', 'Arial', sans-serif";
          }
        };
        const getTemplateLineHeight = () => {
          switch (selectedFormat || DEFAULT_TEMPLATE_ID) {
            case TEMPLATE_SLUGS.CLASSIC_PROFESSIONAL:
              return 1.15; // Match preview default for classic template
            case TEMPLATE_SLUGS.MODERN_CLEAN:
              return 1.2;
            case TEMPLATE_SLUGS.EXECUTIVE_SERIF:
              return 1.25;
            default:
              return 1.2;
          }
        };
        const templateFont = getTemplateFont();
        const templateLineHeight = getTemplateLineHeight();

        normalizeElementSizing(clonedElement);

        // PDF-specific overrides to ensure consistent rendering (keep minimal)
        const pdfOverrides = `
          @page { 
            size: Letter; 
            margin: 0;
          }
          
          /* Allow natural page breaks for long content */
          body {
            orphans: 2;
            widows: 2;
            page-break-inside: auto;
            height: auto !important;
          }
          
          /* Ensure sections can break naturally if needed */
          .live-preview-container {
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
          }

          .pdf-single-page-root > :not(.single-page-container) {
            display: none !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .live-preview-container > div[style*='text-align: center'][style*='margin-bottom: 20px'] {
            display: none !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .pdf-single-page-root {
            margin: 0 !important;
            padding: 0 !important;
          }
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
            padding-top: 16px !important;
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
            max-height: none !important;
            padding-bottom: 12px !important;
            overflow: visible !important;
            box-sizing: border-box !important;
          }
          .multi-page-pdf-container > div[class^="pdf-page-"]:first-child {
            padding-top: 12px !important;
            margin-top: 0 !important;
          }

          .pdf-single-page-root > .single-page-container {
            padding-top: 12px !important;
            padding-bottom: 12px !important;
            min-height: auto !important;
          }

          .single-page-container {
            min-height: auto !important;
          }

          .multi-page-pdf-container,
          .multi-page-pdf-container * {
            font-family: ${templateFont} !important;
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
            padding: 16px 16px 8px 16px !important;
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
        

 
        console.log("Current selectedFormat:", selectedFormat);
        console.log("Current data.template:", data.template);
        console.log("Using font for template", selectedFormat, ":", templateFont);
        console.log("Template (selectedFormat):", selectedFormat);
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
    /* Fallback font for PDF generation - only apply if no font is specified */
    body {
      font-family: ${templateFont};
      line-height: ${templateLineHeight};
    }
    /* Let template-specific fonts take precedence */
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
          headers,
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
          if (result.status === 403) {
            console.log('403 detected - setting up modal');
            console.log('Result data:', result.data);

            const token = localStorage.getItem('resumeToken');
            let currentPlan = 'free';
            if (token) {
              try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                currentPlan = payload.plan || 'free';
              } catch (e) {
                console.log('Could not parse token for plan');
              }
            }

            const subscriptionInfo = {
              usage: {
                can_generate: false,
                remaining: 0,
                reset_date: result.data?.resetDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                limitReached: true
              },
              subscription: {
                plan_name: result.data?.plan?.toLowerCase() || currentPlan,
                display_name: result.data?.plan || currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1),
                resume_limit: result.data?.limit || (currentPlan === 'premium' ? 30 : currentPlan === 'ultimate' ? 200 : 1),
                resume_period: result.data?.period || (currentPlan === 'free' ? 'week' : 'month')
              }
            };

            setSubscriptionData(subscriptionInfo);
            console.log('Subscription data set:', subscriptionInfo);

            console.log('Current modal state before:', showUpgradeModal);
            setShowUpgradeModal(false);
            setTimeout(() => {
              console.log('Setting modal to true');
              setShowUpgradeModal(true);
            }, 10);

            const buttons = document.querySelectorAll('button');
            buttons.forEach(btn => {
              if (btn.textContent.includes('Generating PDF')) {
                btn.textContent = '📄 Generate Resume';
                btn.disabled = false;
              }
            });
            return;
          }

          if (result.ok && result.data && result.data.downloadURL) {
            const downloadUrl = result.data.downloadURL;
            let popupWindow = null;
            let popupBlocked = false;
            try {
              popupWindow = window.open(downloadUrl, '_blank');
              if (popupWindow) {
                try {
                  popupWindow.opener = null;
                } catch (_) { /* noop */ }
                if (typeof popupWindow.focus === 'function') {
                  popupWindow.focus();
                }
              } else {
                popupBlocked = true;
              }
            } catch (popupError) {
              console.error('Unable to open resume in new tab automatically:', popupError);
              popupBlocked = true;
            }
            if (!popupBlocked && popupWindow && popupWindow.closed === true) {
              popupBlocked = true;
            }
            setDownloadNotice({
              message: popupBlocked
                ? 'Your browser blocked the download pop-up. Please allow pop-ups for HiHired or use the direct link below.'
                : 'We opened your resume in a new tab. If it did not appear, allow pop-ups for HiHired or use the direct link below.',
              link: downloadUrl,
              blocked: popupBlocked,
            });

            setLastStep('resume_download_success');
            triggerFeedbackPrompt({
              scenario: 'resume_download',
              metadata: { template: selectedFormat },
            });
            scheduleFollowUp({
              trigger: 'resume_download',
              metadata: { template: selectedFormat },
            });
          } else {
            console.error('PDF generation failed response:', result);
            setLastStep('resume_download_error');
            triggerFeedbackPrompt({
              scenario: 'resume_download',
              metadata: { result: 'error', status: result.status || null },
              force: true,
            });
            if (result.status !== 403) {
              alert((result.data && (result.data.error || result.data.message)) || `Failed to generate PDF (status ${result.status})`);
            }
          }
        })
        .catch(error => {
          console.error('PDF generation error:', error);
          setLastStep('resume_download_error');
          triggerFeedbackPrompt({
            scenario: 'resume_download',
            metadata: { result: 'error', message: error?.message || '' },
            force: true,
          });
          if (!error.message?.includes('limit')) {
            alert('Failed to generate PDF. Please try again.');
          }
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
        viewButton.textContent = '📄 View Resume';
        viewButton.disabled = false;
      }
      if (styleOverride && styleOverride.parentNode) {
        styleOverride.parentNode.removeChild(styleOverride);
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
  const handleJobDescriptionChange = (description) => {
    setJobDescription(description);
    const trimmed = description.trim();
    if (trimmed) {
      localStorage.setItem('jobDescription', trimmed);
    } else {
      localStorage.removeItem('jobDescription');
    }
  };

  const fetchCurrentSubscriptionSafe = async () => {
    try {
      const token = localStorage.getItem('resumeToken');
      if (!token) return null;
      const resp = await fetch(`${getAPIBaseURL()}/api/subscription/current`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resp.ok) return null;
      const data = await resp.json();
      return data && data.subscription ? data.subscription : null;
    } catch (_) { return null; }
  };

  const checkSubscriptionLimit = async () => {
    try {
      const token = localStorage.getItem('resumeToken');
      if (!token) return true; // Allow non-authenticated users (server will handle limits)

      const response = await fetch(`${getAPIBaseURL()}/api/subscription/check-limit`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Legacy: some versions might use 429 to indicate limit reached
      if (response.status === 429) {
        const data = await response.json().catch(() => ({}));
        const sub = await fetchCurrentSubscriptionSafe();
        const planKey = (sub?.plan_name || 'free').toLowerCase();
        const mapped = {
          usage: {
            can_generate: false,
            remaining: 0,
            reset_date: data.reset_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            limitReached: true
          },
          subscription: sub || {
            plan_name: planKey,
            display_name: planKey.charAt(0).toUpperCase() + planKey.slice(1),
            resume_limit: planKey === 'premium' ? 30 : planKey === 'ultimate' ? 200 : 1,
            resume_period: planKey === 'free' ? 'week' : 'month'
          }
        };
        setSubscriptionData(mapped);
        setShowUpgradeModal(true);
        return false;
      }

      // New behavior: API returns 200 with can_generate flag
      if (response.ok) {
        const data = await response.json().catch(() => null);
        if (data && data.can_generate === false) {
          const sub = await fetchCurrentSubscriptionSafe();
          const planKey = (sub?.plan_name || 'free').toLowerCase();
          const mapped = {
            usage: {
              can_generate: false,
              remaining: data.remaining ?? 0,
              reset_date: data.reset_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              limitReached: true
            },
            subscription: sub || {
              plan_name: planKey,
              display_name: planKey.charAt(0).toUpperCase() + planKey.slice(1),
              resume_limit: planKey === 'premium' ? 30 : planKey === 'ultimate' ? 200 : 1,
              resume_period: planKey === 'free' ? 'week' : 'month'
            }
          };
          setSubscriptionData(mapped);
          setShowUpgradeModal(true);
          return false;
        }
        return true;
      }

      // On other non-OK statuses, allow and let server enforce at generation
      return true;
    } catch (error) {
      console.error('Error checking subscription limit:', error);
      return true; // Allow on error
    }
  };

  // Removed unused AI handler stubs that referenced undefined variables

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
            <div className="back-home-wrapper">
              <Link to="/" className="back-home-link">
                <span aria-hidden="true">←</span>
                <span>Back to Home</span>
              </Link>
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
            {user && (
              <div style={{ position: 'absolute', right: '20px', top: '80px' }}>
                <SubscriptionStatus
                  minimal={true}
                  onLimitReached={(usage, subscription) => {
                    setSubscriptionData({ usage, subscription });
                    setShowUpgradeModal(true);
                  }}
                />
              </div>
            )}
          </div>

          
          {/* Stepper and Content */}
          <div className="builder-main-section">
            <div className="stepper-container">
              <Stepper steps={steps} currentStep={step} setStep={handleStepChange} />
            </div>
            <div className="builder-content">
            {step === STEP_IDS.IMPORT && (
              <StepImport
                onSkip={handleImportComplete}
                jobDescription={jobDescription}
              />
            )}
            {step === STEP_IDS.PERSONAL && <StepPersonal />}
            {step === STEP_IDS.JOB_DESCRIPTION && (
              <StepJobDescription
                jobDescription={jobDescription}
                onJobDescriptionChange={handleJobDescriptionChange}
              />
            )}
            {step === STEP_IDS.EXPERIENCE && <StepExperience />}
            {step === STEP_IDS.PROJECTS && <StepProjects />}
            {step === STEP_IDS.EDUCATION && <StepEducation />}
            {step === STEP_IDS.SKILLS && <StepSkills />}
            {step === STEP_IDS.FORMAT && <StepFormat />}
            {step === STEP_IDS.SUMMARY && <StepSummary />}
            {step === STEP_IDS.JOB_MATCHES && (
              <section className="job-matches-wrapper" aria-live="polite">
                <div className="job-matches-panel">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#1d4ed8' }}>Matching Jobs</h3>
                      {jobMatchesHash && (
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Snapshot: {jobMatchesHash.slice(0, 8)}</span>
                      )}
                      {isUSPreferredLocation && user && (
                        <span style={{ fontSize: '0.75rem', color: '#0f172a' }}>
                          Showing US-based roles only
                          {filteredOutCount > 0
                            ? ` — filtered ${filteredOutCount} non-US listing${filteredOutCount === 1 ? '' : 's'}.`
                            : '.'}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {jobMatchesLoading && <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Updating...</span>}
                      <button
                        type="button"
                        onClick={() => fetchJobMatches({ autoSwitchToStep: false })}
                        disabled={jobMatchesLoading || !user}
                        style={{
                          padding: '0.4rem 0.9rem',
                          borderRadius: '999px',
                          border: '1px solid #bfdbfe',
                          background: jobMatchesLoading || !user ? '#e2e8f0' : '#eff6ff',
                          color: jobMatchesLoading || !user ? '#94a3b8' : '#1d4ed8',
                          fontWeight: 600,
                          cursor: jobMatchesLoading || !user ? 'not-allowed' : 'pointer',
                          fontSize: '0.85rem',
                        }}
                      >
                        {jobMatchesLoading ? 'Refreshing...' : !user ? 'Login required' : 'Refresh'}
                      </button>
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>Preferred location</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={jobMatchesLocation}
                        onChange={(e) => handlePreferredLocationChange(e.target.value)}
                        placeholder={autoLocation ? `e.g., ${autoLocation}` : 'City, State or Remote'}
                        style={{
                          flex: '1 1 200px',
                          minWidth: '160px',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid #cbd5f5',
                          fontSize: '0.9rem',
                        }}
                      />
                      {autoLocation && (
                        <button
                          type="button"
                          onClick={handleUseDetectedLocation}
                          style={{
                            padding: '0.45rem 0.9rem',
                            borderRadius: '999px',
                            border: '1px solid #bfdbfe',
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                          }}
                        >
                          Use {autoLocation}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleUseRemoteLocation}
                        style={{
                          padding: '0.45rem 0.9rem',
                          borderRadius: '999px',
                          border: '1px solid #14b8a6',
                          background: '#ecfeff',
                          color: '#0f766e',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                        }}
                      >
                        Remote OK
                      </button>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>We prioritize roles near this location or remote roles.</span>
                    {user && effectiveLocation && (
                      <span style={{ fontSize: '0.8rem', color: '#0f172a', fontWeight: 500 }}>
                        Prioritizing roles near <span style={{ color: '#1d4ed8' }}>{effectiveLocation}</span>
                      </span>
                    )}
                  </div>

                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {!user && (
                      <p style={{ color: '#475569', fontSize: '0.9rem', margin: 0 }}>Sign in to generate personalized job matches.</p>
                    )}

                    {user && jobMatchesError && (
                      <div style={{ color: '#b91c1c', fontSize: '0.9rem' }}>{jobMatchesError}</div>
                    )}

                    {user && !jobMatchesError && !jobMatchesLoading && filteredJobMatches.length === 0 && (
                      <p style={{ color: '#475569', fontSize: '0.9rem', margin: 0 }}>
                        {jobMatches.length > 0
                          ? 'No US-based matches found yet. Adjust your location or refresh to explore more roles.'
                          : 'Complete your profile or add experience, then refresh to see curated openings.'}
                      </p>
                    )}
                  </div>

                  {user && topMatch && (
                    <div
                      style={{
                        padding: '1rem',
                        borderRadius: '12px',
                        background: '#f0f9ff',
                        border: '1px solid #bae6fd',
                        boxShadow: '0 6px 12px rgba(148, 163, 184, 0.15)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                      }}
                    >
                      <span style={{ fontSize: '0.75rem', color: '#0ea5e9', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Top match</span>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>{topMatch.job_title || 'Role'}</h4>
                      <div style={{ color: '#1e293b', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span>{topMatch.company_name || 'Hiring company'}</span>
                        <span>{[topMatch.job_location, topMatch.job_remote_type].filter(Boolean).join(' • ')}</span>
                        {typeof topMatch.match_score === 'number' && (
                          <span style={{ fontWeight: 600, color: '#0284c7' }}>Match score: {topMatch.match_score.toFixed(1)}</span>
                        )}
                      </div>
                      {topMatch.job_url && (
                        <a
                          href={topMatch.job_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.45rem 0.9rem',
                            borderRadius: '999px',
                            background: '#2563eb',
                            color: '#ffffff',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            textDecoration: 'none',
                            width: 'fit-content',
                          }}
                        >
                          View job
                        </a>
                      )}
                    </div>
                  )}

                  {user && secondaryMatches.length > 0 && (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem' }}>
                      {secondaryMatches.map((match, index) => (
                        <li
                          key={`${match.id || match.job_posting_id || index}`}
                          style={{
                            padding: '0.85rem',
                            borderRadius: '10px',
                            border: '1px solid #dbeafe',
                            background: '#ffffff',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.4rem',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
                            <strong style={{ color: '#1e293b', fontSize: '0.95rem' }}>{match.job_title || 'Role'}</strong>
                            {typeof match.match_score === 'number' && (
                              <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>{match.match_score.toFixed(1)}</span>
                            )}
                          </div>
                          <span style={{ color: '#334155', fontSize: '0.85rem' }}>
                            {[match.company_name, match.job_location].filter(Boolean).join(' — ')}
                          </span>
                          {match.job_department && (
                            <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{match.job_department}</span>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {match.job_url ? (
                              <a
                                href={match.job_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#2563eb', fontWeight: 600, fontSize: '0.85rem' }}
                              >
                                View listing
                              </a>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Listing link unavailable</span>
                            )}
                            {match.job_remote_type && (
                              <span style={{ color: '#0ea5e9', fontSize: '0.75rem', fontWeight: 600 }}>{match.job_remote_type}</span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            )}
            {step === STEP_IDS.COVER_LETTER && (
              <StepCoverLetter
                onGeneratePremiumFeature={() => setShowUpgradeModal(true)}
              />
            )}

            {/* Navigation Buttons */}
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                marginTop: '2rem',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
              }}
            >
              {step > 1 && (
                <button
                  onClick={goToPreviousStep}
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
                    justifyContent: 'center',
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
                  onClick={goToNextStep}
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
                    boxShadow: '0 4px 6px rgba(59, 130, 246, 0.25)',
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
                    justifyContent: 'center',
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
              )}
            </div>
          </div>
          </div>
          )}
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
                  <span style={{ color: '#3b82f6', fontWeight: 500, fontSize: '0.9rem' }}>{displayName}</span>
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
                              {step !== STEP_IDS.COVER_LETTER && <LivePreview onDownload={handleViewResume} downloadNotice={downloadNotice} />}
                              {step === STEP_IDS.COVER_LETTER && (
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  height: '100%',
                                  color: '#6b7280',
                                  fontSize: '1.1rem'
                                }}>
                                  Resume preview not available for Cover Letter
                                </div>
                              )}
            </div>
          </div>
        )}
      </div>

             {/* Modals */}
       {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
       {showImportModal && <ImportResumeModal onClose={() => setShowImportModal(false)} />}
       {showUpgradeModal && (() => {
         console.log('Rendering UpgradeModal, showUpgradeModal=', showUpgradeModal, 'data=', subscriptionData);
         return (
           <UpgradeModal
             isOpen={true}
             onClose={() => setShowUpgradeModal(false)}
             currentPlan={(subscriptionData?.subscription?.plan_name || 'free').toLowerCase()}
             usage={subscriptionData?.usage || {}}
           />
         );
       })()}
      </>
  );
}

export default BuilderPage;



































































