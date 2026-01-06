import React, { useMemo, useState, useCallback } from 'react';
import './ChatWidget.css';
import {
  getAPIBaseURL,
  generateSummaryAI,
  fetchResumeHistoryList,
  fetchJobCount,
  computeJobMatches,
  parsePersonalDetailsAI,
  inferTemplatePreference,
  inferJobIntent,
  parseExperienceAI,
  parseProjectsAI,
  parseEducationAI,
  parseJobDescriptionAI,
  parseSkillsAI,
  generateSkillsAI,
} from '../api';
import { setLastStep } from '../utils/exitTracking';
import { useAuth } from '../context/AuthContext';
import { useResume } from '../context/ResumeContext';
import { TEMPLATE_OPTIONS } from '../constants/templates';
import { BUILDER_TARGET_STEP_KEY, BUILDER_TARGET_TEMPLATE, BUILDER_TARGET_JOB_MATCHES } from '../constants/builder';
import { useNavigate } from 'react-router-dom';
import { useLocation } from "react-router-dom";

const INITIAL_MESSAGES = [
  {
    sender: 'bot',
    text: "Hey! I'm the HiHired assistant. Ask me anything about building resumes or using our AI tools.",
  },
  {
    sender: 'bot',
    text: 'Here are some quick actions to get started:',
    buttons: [
      { label: 'Build Resume', value: 'build resume' },
      { label: 'Download Resume', value: 'download resume' },
      { label: 'Job Matches', value: 'job matches' },
      { label: 'Analysis my background', value: 'analysis my background' },
    ],
  },
];

const FALLBACK_REPLY =
  "I'm having trouble reaching our AI right now. Please use the Help bubble or contact us at hihired.org/contact and we'll help right away.";

const RESUME_FLOW_SEQUENCE = [
  'importChoice',
  'template',
  'personal',
  'jobDescription',
  'experience',
  'projects',
  'education',
  'skills',
  'summary',
];

const RESUME_FLOW_PROMPTS = {
  importChoice:
    'Choose whether you want to Import Resume or reuse one from Resume History. Use those buttons in the builder, then click Next to continue. You can also just tell me in plain language what you want to do, and I’ll guide you.',
  template:
    'Open the Template & Format section to pick your design. Tap a template (Classic Professional, Modern Clean, Executive Serif, or Attorney Professional), adjust the font size if needed, then click Next. Or simply describe your ideal resume style here in chat and I’ll use AI to pick a template and font size for you.',
  personal:
    'Open the Personal Details card and fill in your full name, primary email, and phone number. Click Next when the Personal Details section looks good. You can also type your details in one natural sentence (e.g. “My name is X, email Y, phone Z”) and I’ll use AI to fill the fields for you.',
  jobDescription:
    'Paste the target Job Description into its field so the AI knows what role to target. Click Next when you are ready. You can also paste a job URL or description into chat and I’ll use AI to store it for the builder.',
  experience:
    'Add each role in the Experience section (job title, company, dates, location, and bullet points). Click Next after your latest role is entered. If you prefer, describe a role in plain language here and I’ll help turn it into structured experience entries.',
  projects:
    'Scroll to the Projects section and enter each project name, description, technologies, and any relevant links. You can also describe a project in your own words in chat and I’ll help convert it into structured project details.',
  education:
    'Fill in the Education section with degree, school, location, and graduation info. Or tell me about your education in a sentence or two here and I’ll help map it into the Education section.',
  skills:
    'Tell me your skills (e.g., "I know Python, React, and AWS") or say "generate skills from my experience" and I\'ll create a list based on your resume.',
  summary:
    'Write a concise Summary/Elevator Pitch at the top (2-3 sentences). Or describe your background in your own words here and I’ll help you turn it into a polished summary using AI.',
};

const RESUME_FLOW_STEP_RESPONSES = {
  importChoice:
    'Tell me what you’d like to do (for example “start from my PDF” or “reuse a previous resume”), and I’ll explain which Import vs Resume History option to click in the builder.',
  template:
    'Describe your ideal resume look (e.g. “modern, clean, medium font”) and I’ll use AI to set a matching template and font size. You can always fine-tune it in the Template & Format section and then click Next.',
  personal:
    'Share your name, email, and phone in a single sentence (for example “My name is X, email Y, phone Z”) and I’ll use AI to fill in the Personal Details for you.',
  jobDescription:
    'Paste a job URL or the full job description into chat and I’ll store it for the Job Description step, and when possible extract the text for you.',
  experience:
    'Describe one of your roles (title, company, what you did, impact) in natural language and I’ll help transform it into structured experience content.',
  projects:
    'Tell me about a project in your own words and I’ll help rewrite it into a clear, resume-ready project entry.',
  education:
    'Share your degree, school, and graduation details in a sentence or two and I’ll help shape them into a structured Education entry.',
  skills:
    'List your skills naturally (e.g., "I know Python, React, AWS") or ask me to generate them from your experience and projects.',
  summary:
    'Tell me about your background, strengths, and target role in natural language and I’ll help you craft a concise, polished summary.',
};

const DEFAULT_RESUME_FLOW_STATE = {
  active: false,
  stage: null,
  data: {
    templateId: null,
    personal: {
      name: '',
      email: '',
      phone: '',
      dateOfBirth: '',
    },
    jobDescription: '',
    experience: '',
    projects: '',
    education: '',
    skills: '',
    summary: '',
  },
};

const hasResumeIntent = (message) => {
  if (!message) return false;
  const normalized = message.toLowerCase();
  const triggers = [
    'create my resume',
    'create resume',
    'build resume',
    'build my resume',
    'generate resume',
    'resume copilot',
    'resume builder',
    'start resume',
    'ai resume',
  ];
  if (triggers.some((phrase) => normalized.includes(phrase))) {
    return true;
  }
  return (
    normalized.includes('resume') &&
    (normalized.includes('build') ||
      normalized.includes('create') ||
      normalized.includes('generate') ||
      normalized.includes('make'))
  );
};

const isAffirmative = (text) => /\b(yes|yep|sure|please|ok|okay|absolutely|let's do it)\b/i.test(text);
const isNegative = (text) => /\b(no|nope|not now|maybe later|stop|don't)\b/i.test(text);
const hasDownloadIntent = (text = '') =>
  DOWNLOAD_KEYWORDS.some((phrase) => text.toLowerCase().includes(phrase));

const normalizePhone = (value = '') => {
  const digits = value.replace(/[^\d+]/g, '');
  if (!digits) {
    return '';
  }
  if (digits.startsWith('+')) {
    return `+${digits.slice(1)}`;
  }
  return digits;
};

const cleanExtractedName = (value = '') => {
  let cleaned = value;
  cleaned = cleaned.split(/[,.;]/)[0];
  cleaned = cleaned.split(/\band\b/i)[0];
  cleaned = cleaned.replace(/my number is.*$/i, '');
  cleaned = cleaned.replace(/my email is.*$/i, '');
  cleaned = cleaned.replace(/my name is/i, '');
  cleaned = cleaned.trim();
  if (!cleaned) {
    return '';
  }
  return cleaned.replace(/\s+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};

const detectSectionRequest = (text = '') => {
  const normalized = text.toLowerCase();
  for (const entry of SECTION_KEYWORDS) {
    if (entry.phrases.some((phrase) => normalized.includes(phrase))) {
      return entry.key;
    }
  }
  return null;
};

const detectSectionUpdateIntent = (text = '') => {
  if (!text) return null;
  for (const pattern of SECTION_UPDATE_PATTERNS) {
    const match = text.match(pattern.regex);
    if (match && match[2]) {
      return { key: pattern.key, value: sanitizeFreeformInput(match[2]) };
    }
  }
  return null;
};

const sanitizeFreeformInput = (value = '') =>
  value.replace(/^[:\s-]+/, '').trim();

const includesAll = (value, keywords = []) => {
  if (!value) return false;
  return keywords.every((term) => value.includes(term));
};

const hasInterviewProcessIntent = (text = '') => {
  if (!text) return false;
  const normalized = text.toLowerCase();
  if (!normalized.includes('interview')) {
    return false;
  }
  const intentHints = ['process', 'how', 'difficult', 'tips', 'looks like', 'expect'];
  const companyHints = ['google', 'meta', 'amazon', 'microsoft', 'apple', 'sde', 'engineer', 'interview'];
  return (
    intentHints.some((hint) => normalized.includes(hint)) ||
    companyHints.some((hint) => normalized.includes(hint))
  );
};

const START_NEW_SESSION_KEYWORDS = [
  'start over',
  'restart',
  'restart chat',
  'restart session',
  'new session',
  'new chat',
  'reset chat',
  'reset conversation',
  'clear chat',
  'fresh start',
];

const QUIT_FLOW_KEYWORDS = [
  'quit step',
  'quit the step',
  'cancel step',
  'stop step',
  'exit step',
  'end step',
  'stop walkthrough',
  'stop the walkthrough',
  'stop the flow',
  'cancel flow',
  'quit flow',
  'exit flow',
  'end flow',
  'stop this flow',
  'never mind',
  'nevermind',
  'forget it',
  'do this later',
];

const JOB_MATCH_TRIGGERS = [
  'job match',
  'job matches',
  'matching jobs',
  'see job matches',
  'show job matches',
  'open job matches',
  'ai job matches',
];

const CLOSED_WIDGET_SIZE = { width: 90, height: 90 };
const CHAT_PANEL_SIZE = {
  regular: { width: 420, height: 520 },
  large: { width: 620, height: 640 },
};
const VIEWPORT_PADDING = 12;

const hasStartNewSessionIntent = (text = '') => {
  if (!text) return false;
  const normalized = text.toLowerCase();
  if (START_NEW_SESSION_KEYWORDS.some((phrase) => normalized.includes(phrase))) {
    return true;
  }
  return (
    includesAll(normalized, ['start', 'new', 'session']) ||
    includesAll(normalized, ['start', 'new', 'chat']) ||
    includesAll(normalized, ['begin', 'new', 'session'])
  );
};

const hasQuitFlowIntent = (text = '') => {
  if (!text) return false;
  const normalized = text.toLowerCase();
  if (QUIT_FLOW_KEYWORDS.some((phrase) => normalized.includes(phrase))) {
    return true;
  }
  const cancelWords = ['stop', 'cancel', 'quit', 'exit', 'end'];
  const flowTargets = ['step', 'flow', 'walkthrough', 'process', 'session'];
  return (
    cancelWords.some((word) => normalized.includes(word)) &&
    flowTargets.some((word) => normalized.includes(word))
  );
};

const hasBackgroundAnalysisIntent = (text = '') => {
  if (!text) return false;
  const normalized = text.toLowerCase();
  return (
    normalized.includes('analysis my background') ||
    normalized.includes('analyze my background') ||
    normalized.includes('background analysis')
  );
};

const isJobMatchShortcutIntent = (text = '') => {
  if (!text) return false;
  const normalized = text.toLowerCase();
  return JOB_MATCH_TRIGGERS.some((phrase) => normalized.includes(phrase));
};

const hasSoftwareEngineerJobCountIntent = (text = '') => {
  if (!text) return false;
  const normalized = text.toLowerCase();
  return (
    normalized.includes('software engineer') &&
    normalized.includes('job') &&
    normalized.includes('how many')
  );
};

const createEmptyExperience = () => ({
  jobTitle: '',
  company: '',
  city: '',
  state: '',
  startDate: '',
  endDate: '',
  currentlyWorking: false,
  description: '',
});

const createEmptyProject = () => ({
  projectName: '',
  description: '',
  technologies: '',
  projectUrl: '',
});

const createEmptyEducation = () => ({
  degree: '',
  school: '',
  field: '',
  startMonth: '',
  startYear: '',
  graduationMonth: '',
  graduationYear: '',
  gpa: '',
  honors: '',
  location: '',
});

const STORAGE_KEY = 'chatWidgetState';
const DOWNLOAD_KEYWORDS = [
  'generate resume',
  'generate the resume',
  'download resume',
  'download my resume',
  'export resume',
  'export my resume',
  'create pdf',
  'get pdf',
  'resume pdf',
];

const generateSessionId = () => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch (err) {
    // Ignore and fall back to timestamp-based id.
  }
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const readStoredUserEmail = () => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return '';
  }
  try {
    const rawUser = window.localStorage.getItem('resumeUser');
    if (!rawUser) return '';
    const parsed = JSON.parse(rawUser);
    return typeof parsed?.email === 'string' ? parsed.email : '';
  } catch {
    return '';
  }
};

const parseEnvBoolean = (value) => {
  if (typeof value !== 'string') {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  if (['1', 'true', 'yes', 'on', 'enable', 'enabled'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'off', 'disable', 'disabled'].includes(normalized)) {
    return false;
  }
  return null;
};

const isLocalDevHost = () => {
  if (typeof window === 'undefined' || !window.location) {
    return false;
  }
  const hostname = (window.location.hostname || '').toLowerCase();
  if (!hostname) {
    return false;
  }
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '0.0.0.0') {
    return true;
  }
  if (hostname.endsWith('.local')) {
    return true;
  }
  if (/^10\./.test(hostname) || /^192\.168\./.test(hostname) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)) {
    return true;
  }
  return false;
};

const computeChatWidgetEnabled = () => {
  const envFlag =
    typeof process !== 'undefined' && process.env
      ? parseEnvBoolean(process.env.REACT_APP_CHAT_WIDGET_ENABLED)
      : null;
  if (envFlag !== null) {
    return envFlag;
  }
  // Default to enabled when no explicit override is provided.
  // Visibility for production is controlled by ChatWidgetGate in App.jsx.
  return true;
};

const CHAT_WIDGET_ENABLED = computeChatWidgetEnabled();

const TEMPLATE_STAGE_BUTTONS_ENABLED = false;

const buildTemplateStageButtons = () => {
  if (!TEMPLATE_STAGE_BUTTONS_ENABLED) {
    return [];
  }
  return [
    ...TEMPLATE_OPTIONS.map(({ id, name }) => ({
      label: name,
      value: `template:${id}`,
    })),
    {
      label: 'Open Template & Format',
      action: 'jump_template_section',
    },
  ];
};

const ChatWidgetInner = () => {
  const { user, token } = useAuth();
  const { data: resumeData, setData: updateResume } = useResume();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isLarge, setIsLarge] = useState(false);
  const [aiEnhanced, setAiEnhanced] = useState(true);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);
  const [resumeFlowState, setResumeFlowState] = useState(DEFAULT_RESUME_FLOW_STATE);
  const [awaitingJobMatchAnswer, setAwaitingJobMatchAnswer] = useState(false);
  const [showIntroTooltip, setShowIntroTooltip] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [launcherPosition, setLauncherPosition] = useState({ top: 24, left: 24 });
  const apiBaseUrl = useMemo(() => getAPIBaseURL(), []);
  const inputRef = React.useRef(null);
  const launcherPositionRef = React.useRef(launcherPosition);
  const dragStateRef = React.useRef(null);
  const clickSuppressedRef = React.useRef(false);
  const location = useLocation();
  const notifyBuilderStage = useCallback((stage) => {
    if (location.pathname === "/") {
      navigate("/builder");

      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("builder:focus-stage", { detail: { stage } })
        );
      }, 0);

      return;
    }

    if (typeof window === 'undefined') {
      return;
    }
    if (!stage || !RESUME_FLOW_SEQUENCE.includes(stage)) {
      return;
    }
    window.dispatchEvent(new CustomEvent('builder:focus-stage', { detail: { stage } }));
  }, [location.pathname, navigate]);

const clampLauncherPosition = useCallback(
    (pos, overrides = {}) => {
      if (typeof window === 'undefined') {
        return pos;
      }
      const openState = overrides.open ?? isOpen;
      const largeState = overrides.large ?? isLarge;
      const size = openState
        ? largeState
          ? CHAT_PANEL_SIZE.large
          : CHAT_PANEL_SIZE.regular
        : CLOSED_WIDGET_SIZE;
      const maxLeft = Math.max(window.innerWidth - size.width - VIEWPORT_PADDING, VIEWPORT_PADDING);
      const maxTop = Math.max(window.innerHeight - size.height - VIEWPORT_PADDING, VIEWPORT_PADDING);
      return {
        top: Math.min(Math.max(pos.top ?? VIEWPORT_PADDING, VIEWPORT_PADDING), maxTop),
        left: Math.min(Math.max(pos.left ?? VIEWPORT_PADDING, VIEWPORT_PADDING), maxLeft),
      };
    },
    [isOpen, isLarge]
  );

  const saveLauncherPosition = useCallback(
    (pos, overrides = {}) => {
      const next = clampLauncherPosition(pos, overrides);
      setLauncherPosition(next);
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('chatLauncherPosition', JSON.stringify(next));
        } catch (error) {
          console.warn('Failed to persist chat button position', error);
        }
      }
    },
    [clampLauncherPosition]
  );

  React.useEffect(() => {
    launcherPositionRef.current = launcherPosition;
  }, [launcherPosition]);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const defaultTop = Math.max(
      (window.innerHeight - CLOSED_WIDGET_SIZE.height) / 2,
      VIEWPORT_PADDING
    );
    const defaultLeft = Math.max(
      window.innerWidth - CLOSED_WIDGET_SIZE.width - VIEWPORT_PADDING,
      VIEWPORT_PADDING
    );
    let next = {
      top: defaultTop,
      left: defaultLeft,
    };
    try {
      const stored = window.localStorage.getItem('chatLauncherPosition');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed?.top === 'number' && typeof parsed?.left === 'number') {
          next = parsed;
        }
      }
    } catch (error) {
      console.warn('Unable to read stored chat position', error);
    }
    saveLauncherPosition(next, { open: false });
  }, [saveLauncherPosition]);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const handleResize = () => {
      setLauncherPosition((prev) => clampLauncherPosition(prev, { open: isOpen, large: isLarge }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [clampLauncherPosition, isOpen, isLarge]);

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    setLauncherPosition((prev) => {
      const next = clampLauncherPosition(prev, { open: isOpen, large: isLarge });
      if (next.top === prev.top && next.left === prev.left) {
        return prev;
      }
      try {
        window.localStorage.setItem('chatLauncherPosition', JSON.stringify(next));
      } catch (error) {
        console.warn('Failed to persist clamped chat position', error);
      }
      return next;
    });
  }, [clampLauncherPosition, isOpen, isLarge]);

  const resetChatState = React.useCallback((options = {}) => {
    const { keepOpen = false } = options;
    if (!keepOpen) {
      setIsOpen(false);
    }
    setIsLarge(false);
    setAwaitingJobMatchAnswer(false);
    setInput('');
    setIsLoading(false);
    setMessages(INITIAL_MESSAGES);
    setResumeFlowState(DEFAULT_RESUME_FLOW_STATE);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('Failed to clear chat state:', err);
    }
  }, []);

  const appendBotMessage = (text, extras = {}) => {
    setMessages((prev) => [...prev, { sender: 'bot', text, ...extras }]);
  };

  const getProgressInfo = useCallback((progress) => {
    if (!progress || typeof progress.total !== 'number' || progress.total <= 0) {
      return null;
    }
    const total = Math.max(1, progress.total);
    const current = Math.min(Math.max(progress.current || 0, 0), total);
    const percent = Math.min(100, Math.max(0, (current / total) * 100));
    return { current, total, percent };
  }, []);

  const dismissIntroTooltip = React.useCallback(() => {
    setShowIntroTooltip(false);
  }, []);

  React.useEffect(() => {
    try {
    const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return;
      }
      const parsed = JSON.parse(stored);
      if (parsed && Array.isArray(parsed.messages) && parsed.messages.length > 0) {
        setMessages(parsed.messages);
      }
      if (parsed && typeof parsed.resumeFlowState === 'object') {
        setResumeFlowState({
          ...DEFAULT_RESUME_FLOW_STATE,
          ...parsed.resumeFlowState,
          data: {
            ...DEFAULT_RESUME_FLOW_STATE.data,
            ...(parsed.resumeFlowState?.data || {}),
          },
        });
      }
      if (parsed && typeof parsed.isOpen === 'boolean') {
        setIsOpen(parsed.isOpen);
      }
      if (parsed && typeof parsed.isLarge === 'boolean') {
        setIsLarge(parsed.isLarge);
      }
      if (typeof parsed.awaitingJobMatchAnswer === 'boolean') {
        setAwaitingJobMatchAnswer(parsed.awaitingJobMatchAnswer);
      }
    } catch (error) {
      console.error('Failed to load chat state:', error);
    }
  }, []);

  React.useEffect(() => {
    try {
      const snapshot = {
        messages,
        isOpen,
        isLarge,
        resumeFlowState,
        awaitingJobMatchAnswer,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch (error) {
      console.error('Failed to persist chat state:', error);
    }
  }, [messages, isOpen, isLarge, resumeFlowState, awaitingJobMatchAnswer]);

  React.useEffect(() => {
    if (!user) {
      resetChatState();
    }
  }, [user, resetChatState]);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  const handleVoiceInput = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      appendBotMessage('Voice input is not supported in your browser. Please try Chrome or Edge.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? prev + ' ' + transcript : transcript));
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        appendBotMessage('Microphone access was denied. Please allow microphone access to use voice input.');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [isListening, appendBotMessage]);

  const sessionId = useMemo(() => generateSessionId(), []);

  const toggleOpen = () => {
    const next = !isOpen;
    setIsOpen(next);
    setLauncherPosition((prev) => clampLauncherPosition(prev, { open: next }));
    setLastStep(next ? 'chat_opened' : 'chat_closed');
    if (!next) {
      setAwaitingJobMatchAnswer(false);
      setShowIntroTooltip(true);
    } else {
      dismissIntroTooltip();
    }
  };

  const toggleSize = () => {
    setIsLarge((prev) => {
      const next = !prev;
      setLauncherPosition((pos) => clampLauncherPosition(pos, { open: isOpen, large: next }));
      return next;
    });
  };

  const minimizeChat = () => {
    setIsOpen(false);
    setLauncherPosition((prev) => clampLauncherPosition(prev, { open: false }));
    setShowIntroTooltip(true);
    setLastStep('chat_closed');
  };

  const handleStartNewSession = () => {
    resetChatState({ keepOpen: true });
    setIsOpen(true);
    setLastStep('chat_session_restart');
  };

  const handleLauncherPointerMove = useCallback(
    (event) => {
      const dragState = dragStateRef.current;
      if (!dragState) {
        return;
      }
      const deltaX = event.clientX - dragState.startX;
      const deltaY = event.clientY - dragState.startY;
      if (!dragState.moved && Math.abs(deltaX) + Math.abs(deltaY) > 4) {
        dragState.moved = true;
        clickSuppressedRef.current = true;
      }
      if (!dragState.moved) {
        return;
      }
      saveLauncherPosition(
        {
          top: dragState.startTop + deltaY,
          left: dragState.startLeft + deltaX,
        },
        { open: isOpen, large: isLarge }
      );
    },
    [saveLauncherPosition, isOpen, isLarge]
  );

  const handleLauncherPointerUp = useCallback(() => {
    const dragged = Boolean(dragStateRef.current?.moved);
    dragStateRef.current = null;
    if (typeof window !== 'undefined') {
      window.removeEventListener('pointermove', handleLauncherPointerMove);
      window.removeEventListener('pointerup', handleLauncherPointerUp);
      window.removeEventListener('pointercancel', handleLauncherPointerUp);
    }
    if (dragged) {
      setTimeout(() => {
        clickSuppressedRef.current = false;
      }, 0);
    }
  }, [handleLauncherPointerMove]);

  const handleLauncherPointerDown = useCallback(
    (event) => {
      if (event.button !== 0) {
        return;
      }
      event.preventDefault();
      const current = launcherPositionRef.current || { top: 24, left: 24 };
      dragStateRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        startTop: current.top,
        startLeft: current.left,
        moved: false,
      };
      clickSuppressedRef.current = false;
      if (typeof window !== 'undefined') {
        window.addEventListener('pointermove', handleLauncherPointerMove);
        window.addEventListener('pointerup', handleLauncherPointerUp);
        window.addEventListener('pointercancel', handleLauncherPointerUp);
      }
    },
    [handleLauncherPointerMove, handleLauncherPointerUp]
  );

  const handleDialogHeaderPointerDown = useCallback(
    (event) => {
      if (!(event.target instanceof Element)) {
        return;
      }
      if (event.target.closest('.chat-header-actions')) {
        return;
      }
      handleLauncherPointerDown(event);
    },
    [handleLauncherPointerDown]
  );

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    return () => {
      window.removeEventListener('pointermove', handleLauncherPointerMove);
      window.removeEventListener('pointerup', handleLauncherPointerUp);
      window.removeEventListener('pointercancel', handleLauncherPointerUp);
    };
  }, [handleLauncherPointerMove, handleLauncherPointerUp]);

  const handleLauncherClick = useCallback(
    (event) => {
      if (clickSuppressedRef.current) {
        event.preventDefault();
        event.stopPropagation();
        clickSuppressedRef.current = false;
        return;
      }
      toggleOpen();
    },
    [toggleOpen]
  );

  const handleLauncherKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleOpen();
      }
    },
    [toggleOpen]
  );

  const widgetStyle = useMemo(
    () => ({
      position: 'fixed',
      top: `${launcherPosition.top}px`,
      left: `${launcherPosition.left}px`,
    }),
    [launcherPosition]
  );

  const buildResumeSummaryInput = useCallback(() => {
    if (!resumeData) {
      return null;
    }
    const experienceText = flattenExperienceText(resumeData.experiences || []);
    const educationText = flattenEducationText(resumeData.education || []);
    const skillsArray = (resumeData.skills || '')
      .split(/[\n,]/)
      .map((skill) => skill.trim())
      .filter(Boolean);

    if (!experienceText && !educationText && skillsArray.length === 0) {
      return null;
    }
    return {
      experience: experienceText,
      education: educationText,
      skills: skillsArray,
    };
  }, [resumeData]);

  const handleBackgroundAnalysis = async () => {
    appendBotMessage('Let me review your latest resume from history...');
    setLastStep('chat_resume_analysis_start');
    try {
      const response = await fetchResumeHistoryList();
      const entries = Array.isArray(response?.history) ? response.history : [];
      if (!entries || entries.length === 0) {
        appendBotMessage('I could not find any resumes in your history yet. Please build or import one, then ask me again.');
        setLastStep('chat_resume_analysis_missing_history');
        return;
      }
      const summaryInput = buildResumeSummaryInput();
      if (!summaryInput) {
        appendBotMessage("I found a resume in your history, but I still need more details in the builder (experience, education, or skills) before I can analyze it. Please complete your resume and try again.");
        setLastStep('chat_resume_analysis_missing_data');
        return;
      }
      const aiSummary = await generateSummaryAI(summaryInput);
      const cleanedSummary = (aiSummary || '').trim();
      if (!cleanedSummary) {
        appendBotMessage("I couldn't summarize your background this time. Please try again later.");
        setLastStep('chat_resume_analysis_error');
        return;
      }
      appendBotMessage(`Here's what stands out in your background:\n${cleanedSummary}`);
      setLastStep('chat_resume_analysis_complete');
    } catch (error) {
      console.error('Background analysis failed', error);
      appendBotMessage("I couldn't analyze your resume right now. Please try again later.");
      setLastStep('chat_resume_analysis_error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSoftwareEngineerJobCount = async () => {
    appendBotMessage('Let me check how many software engineer roles we have archived...');
    setLastStep('chat_job_count_start');
    try {
      const response = await fetchJobCount('software engineer');
      const count = typeof response?.count === 'number' ? response.count : 0;
      appendBotMessage(
        `We currently have ${count} software engineer job${count === 1 ? '' : 's'} archived in our system.`
      );
      setLastStep('chat_job_count_success');
    } catch (error) {
      console.error('Software engineer job count lookup failed', error);
      appendBotMessage("I couldn't look up that job count right now. Please try again later.");
      setLastStep('chat_job_count_error');
    } finally {
      setIsLoading(false);
    }
  };

  const jumpToTemplateSection = React.useCallback(() => {
    const isBrowser = typeof window !== 'undefined';
    if (isBrowser) {
      try {
        window.localStorage.setItem(BUILDER_TARGET_STEP_KEY, BUILDER_TARGET_TEMPLATE);
      } catch (error) {
        console.error('Failed to store template target step', error);
      }
      if (window.location.pathname.includes('/builder')) {
        window.dispatchEvent(new Event('builder:jump-template'));
        setLastStep('chat_template_section_jump');
        return;
      }
    }
    navigate('/builder#template-format');
    setLastStep('chat_template_section_jump');
  }, [navigate]);

  const redirectToJobMatchesSection = () => {
    const isBrowser = typeof window !== 'undefined';
    if (isBrowser) {
      try {
        window.localStorage.setItem(BUILDER_TARGET_STEP_KEY, BUILDER_TARGET_JOB_MATCHES);
      } catch (error) {
        console.error('Failed to store job matches redirect flag', error);
      }
      if (window.location.pathname.includes('/builder')) {
        window.dispatchEvent(new CustomEvent('builder:focus-job-matches'));
      }
    }
    navigate('/builder#job-matches');
  };

  const inferPersonalDetailsAI = useCallback(async (text) => {
    try {
      // Pass existing resume data to enable partial updates (only update mentioned fields)
      const existingData = {
        name: resumeData?.name || '',
        email: resumeData?.email || '',
        phone: resumeData?.phone || '',
        summary: resumeData?.summary || ''
      };

      const response = await parsePersonalDetailsAI(text, existingData);
      if (response && typeof response === 'object') {
        const normalized = {};
        if (typeof response.name === 'string' && response.name.trim()) {
          normalized.name = cleanExtractedName(response.name.trim());
        }
        if (typeof response.email === 'string') {
          normalized.email = response.email.trim();
        }
        if (typeof response.phone === 'string') {
          const normalizedPhone = normalizePhone(response.phone);
          normalized.phone = normalizedPhone || '';
        }
        if (typeof response.summary === 'string') {
          normalized.summary = response.summary.trim();
        }
        return normalized;
      }
    } catch (error) {
      console.error('AI personal info parse failed', error);
    }
    return {};
  }, [resumeData]);

  const applyPersonalDetailsFromAI = useCallback(
    async (inputText, options = {}) => {
      const { promptIfEmpty = true } = options;
      const aiParsed = await inferPersonalDetailsAI(inputText);
      const resumeUpdates = {};
      const personalStateUpdates = {};
      const confirmations = [];
      let hasUpdate = false;

      if (aiParsed.name) {
        const cleanedName = cleanExtractedName(aiParsed.name);
        if (cleanedName) {
          resumeUpdates.name = cleanedName;
          personalStateUpdates.name = cleanedName;
          confirmations.push(`name as ${cleanedName}`);
          hasUpdate = true;
        }
      }

      if (Object.prototype.hasOwnProperty.call(aiParsed, 'email')) {
        const emailValue = aiParsed.email ? aiParsed.email.trim() : '';
        resumeUpdates.email = emailValue;
        personalStateUpdates.email = emailValue;
        confirmations.push(emailValue ? `email as ${emailValue}` : 'removed email');
        hasUpdate = true;
      }

      if (Object.prototype.hasOwnProperty.call(aiParsed, 'phone')) {
        const normalizedPhone = normalizePhone(aiParsed.phone || '');
        resumeUpdates.phone = normalizedPhone;
        personalStateUpdates.phone = normalizedPhone;
        confirmations.push(normalizedPhone ? `phone as ${normalizedPhone}` : 'removed phone number');
        hasUpdate = true;
      }

      if (Object.prototype.hasOwnProperty.call(aiParsed, 'summary')) {
        const summaryValue = aiParsed.summary || '';
        resumeUpdates.summary = summaryValue;
        personalStateUpdates.summary = summaryValue;
        confirmations.push(summaryValue ? 'professional summary updated' : 'cleared summary');
        hasUpdate = true;
      }

      if (!hasUpdate) {
        if (promptIfEmpty) {
          appendBotMessage(
            'I can record your personal info here. Try phrasing it naturally, e.g. "My name is Jane Doe, email me at jane@example.com, my phone is 555-123-4567, and my summary is Passionate product manager...".'
          );
        }
        return false;
      }

      updateResume((prev) => ({
        ...prev,
        ...resumeUpdates,
      }));
      setResumeFlowState((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          personal: {
            ...prev.data.personal,
            ...personalStateUpdates,
          },
          summary: resumeUpdates.summary ?? prev.data.summary,
        },
      }));

      const confirmationText =
        confirmations.length > 0
          ? `Got it! I saved your ${confirmations.join(', ')}.`
          : "Got it! I've saved that info.";
      appendBotMessage(`${confirmationText} Let me know if anything needs changes or tap Next when you're ready.`);
      setLastStep('chat_resume_flow_personal_saved');
      return true;
    },
    [appendBotMessage, inferPersonalDetailsAI, setLastStep, setResumeFlowState, updateResume]
  );

  const applyExperienceFromAI = useCallback(
    async (inputText, options = {}) => {
      const { promptIfEmpty = true } = options;
      const trimmed = (inputText || '').trim();
      if (!trimmed) {
        return false;
      }

      try {
        const loweredInput = trimmed.toLowerCase();
        const allowEmptyOverride = ['remove', 'delete', 'clear'].some((keyword) =>
          loweredInput.includes(keyword)
        );
        const normalizedInput = loweredInput.split('-').join(' ').split('_').join(' ');
        const normalizedInputSpaced = normalizedInput.split(' ').filter(Boolean).join(' ');

        const getRemoteIntent = (value) => {
          if (!value) {
            return null;
          }
          const negativePhrases = ['not remote', 'on site', 'onsite', 'in person', 'hybrid'];
          if (negativePhrases.some((phrase) => value.includes(phrase))) {
            return false;
          }
          if (value.includes('remote')) {
            return true;
          }
          return null;
        };

        const remoteIntent = getRemoteIntent(normalizedInputSpaced);

        const normalizeToken = (value) => {
          if (!value || typeof value !== 'string') {
            return '';
          }
          const lowered = value.toLowerCase();
          let out = '';
          for (const char of lowered) {
            if ((char >= 'a' && char <= 'z') || (char >= '0' && char <= '9')) {
              out += char;
            }
          }
          return out;
        };

        const matchesKey = (left, right) => {
          if (!left || !right) {
            return false;
          }
          return left === right || left.includes(right) || right.includes(left);
        };

        const resolveStringField = (currentValue, incomingValue) => {
          const incomingTrimmed = typeof incomingValue === 'string' ? incomingValue.trim() : '';
          if (incomingTrimmed) {
            return incomingTrimmed;
          }
          if (allowEmptyOverride && typeof incomingValue === 'string') {
            return '';
          }
          return typeof currentValue === 'string' ? currentValue : '';
        };

        const resolveBooleanField = (currentValue, incomingValue) => {
          if (typeof incomingValue === 'boolean') {
            return incomingValue;
          }
          if (typeof currentValue === 'boolean') {
            return currentValue;
          }
          return false;
        };

        const resolveRemoteField = (currentValue) => {
          if (remoteIntent === true) {
            return true;
          }
          if (remoteIntent === false) {
            return false;
          }
          if (typeof currentValue === 'boolean') {
            return currentValue;
          }
          return false;
        };

        // Pass existing resume experiences to enable partial updates
        const existingData = resumeData?.experiences ? { experiences: resumeData.experiences } : null;
        const payload = await parseExperienceAI(trimmed, existingData);
        const parsedExperiences = Array.isArray(payload.experiences) ? payload.experiences : [];
        if (!parsedExperiences.length) {
          if (promptIfEmpty) {
            appendBotMessage(
              'I can help turn your work history into structured experience entries. For example: "I worked at Microsoft from July 2018 to July 2025 in Redmond WA on project A, B, C. Before that, I worked at Amazon from 2010 to 2015 on projects D and E."'
            );
          }
          return false;
        }

        updateResume((prev) => {
          const existing = Array.isArray(prev.experiences) ? prev.experiences.filter(Boolean) : [];
          const next = [...existing];

          parsedExperiences.forEach((incoming) => {
            if (!incoming) return;

            const incomingCompanyKey = normalizeToken(incoming.company);
            const incomingTitleKey = normalizeToken(incoming.jobTitle);
            let merged = false;

            const existingIndex = next.findIndex((exp) => {
              if (!exp) return false;
              const existingCompanyKey = normalizeToken(exp.company);
              if (incomingCompanyKey && existingCompanyKey) {
                return matchesKey(existingCompanyKey, incomingCompanyKey);
              }
              const existingTitleKey = normalizeToken(exp.jobTitle);
              return incomingTitleKey && existingTitleKey && matchesKey(existingTitleKey, incomingTitleKey);
            });

            if (existingIndex !== -1) {
              const current = next[existingIndex] || {};

              const mergeProjects = (currentProjects, incomingProjects) => {
                const base = Array.isArray(currentProjects) ? currentProjects.filter(Boolean) : [];
                const incomingList = Array.isArray(incomingProjects) ? incomingProjects.filter(Boolean) : [];
                if (!incomingList.length) return base;

                const seen = new Set(
                  base
                    .map((p) => (p && p.projectName ? p.projectName.trim().toLowerCase() : ''))
                    .filter(Boolean)
                );

                const mergedList = [...base];
                incomingList.forEach((proj) => {
                  if (!proj) return;
                  const nameKey = (proj.projectName || '').trim().toLowerCase();
                  if (nameKey && seen.has(nameKey)) {
                    return;
                  }
                  if (nameKey) {
                    seen.add(nameKey);
                  }
                  mergedList.push(proj);
                });

                return mergedList;
              };

              next[existingIndex] = {
                ...current,
                jobTitle: resolveStringField(current.jobTitle, incoming.jobTitle),
                company: resolveStringField(current.company, incoming.company),
                city: resolveStringField(current.city, incoming.city),
                state: resolveStringField(current.state, incoming.state),
                remote: resolveRemoteField(current.remote),
                startDate: resolveStringField(current.startDate, incoming.startDate),
                endDate: resolveStringField(current.endDate, incoming.endDate),
                currentlyWorking: resolveBooleanField(current.currentlyWorking, incoming.currentlyWorking),
                description: resolveStringField(current.description, incoming.description),
                projectsForRole: mergeProjects(current.projectsForRole, incoming.projectsForRole),
              };

              merged = true;
            }

            if (!merged) {
              next.push({
                ...incoming,
                remote: resolveRemoteField(incoming.remote),
              });
            }
          });

          return {
            ...prev,
            experiences: next,
          };
        });

        setResumeFlowState((prev) => ({
          ...prev,
          data: {
            ...prev.data,
            experience: trimmed,
          },
        }));

        const summaryLines = parsedExperiences.map((exp, index) => {
          const headerParts = [exp.jobTitle, exp.company].filter(Boolean);
          const header = headerParts.length ? headerParts.join(' at ') : `Role ${index + 1}`;
          const projectNames = Array.isArray(exp.projectsForRole)
            ? exp.projectsForRole.map((p) => p.projectName).filter(Boolean)
            : [];
          const projectsLabel = projectNames.length ? `projects: ${projectNames.join(', ')}` : null;
          return [header, projectsLabel].filter(Boolean).join(' — ');
        });

        const confirmation =
          summaryLines.length > 0
            ? `Got it! I created ${summaryLines.length} experience entr${
                summaryLines.length === 1 ? 'y' : 'ies'
              }:\n\n${summaryLines.join('\n')}`
            : 'Got it! I updated your experience section.';

        appendBotMessage(
          `${confirmation}\n\nYou can refine any role directly in the Experience card on the left, and I’ll keep everything in sync.`
        );

        setLastStep('chat_resume_flow_experience_saved');
        return true;
      } catch (error) {
        console.error('AI experience parse failed', error);
        if (promptIfEmpty) {
          appendBotMessage(
            "I couldn't reliably parse that into structured experience. Try describing your roles one more time with company, dates, and any projects, or fill them in directly in the Experience section."
          );
        }
        return false;
      }
    },
    [appendBotMessage, parseExperienceAI, setLastStep, setResumeFlowState, updateResume]
  );

  const applyProjectsFromAI = useCallback(
    async (inputText, options = {}) => {
      const { promptIfEmpty = true } = options;
      const trimmed = (inputText || '').trim();
      if (!trimmed) {
        return false;
      }

      try {
        const existingData = resumeData?.projects ? { projects: resumeData.projects } : null;
        const payload = await parseProjectsAI(trimmed, existingData);
        const parsedProjects = Array.isArray(payload.projects) ? payload.projects : [];
        if (!parsedProjects.length) {
          if (promptIfEmpty) {
            appendBotMessage(
              'I can help structure your projects. Try something like: "I built a task manager app using React and Node.js" or "Add project called E-commerce Platform with Python and Django".'
            );
          }
          return false;
        }

        updateResume((prev) => {
          const existing = Array.isArray(prev.projects) ? prev.projects.filter(Boolean) : [];
          const next = [...existing];

          parsedProjects.forEach((incoming) => {
            if (!incoming) return;
            const incomingNameKey = (incoming.projectName || '').trim().toLowerCase();
            let merged = false;

            if (incomingNameKey) {
              const existingIndex = next.findIndex((proj) => {
                if (!proj) return false;
                const key = (proj.projectName || '').trim().toLowerCase();
                return key && key === incomingNameKey;
              });

              if (existingIndex !== -1) {
                const current = next[existingIndex] || {};
                next[existingIndex] = {
                  ...current,
                  projectName: incoming.projectName || current.projectName || '',
                  description: incoming.description || current.description || '',
                  technologies: incoming.technologies || current.technologies || '',
                  projectUrl: incoming.projectUrl || current.projectUrl || '',
                  startDate: incoming.startDate || current.startDate || '',
                  endDate: incoming.endDate || current.endDate || '',
                };
                merged = true;
              }
            }

            if (!merged) {
              next.push(incoming);
            }
          });

          return { ...prev, projects: next };
        });

        setResumeFlowState((prev) => ({
          ...prev,
          data: { ...prev.data, projects: trimmed },
        }));

        const summaryLines = parsedProjects.map((proj) => proj.projectName || 'Unnamed Project');
        const confirmation = `Got it! I added ${summaryLines.length} project${summaryLines.length === 1 ? '' : 's'}: ${summaryLines.join(', ')}`;
        appendBotMessage(confirmation);
        setLastStep('chat_resume_flow_projects_saved');
        return true;
      } catch (error) {
        console.error('AI projects parse failed', error);
        if (promptIfEmpty) {
          appendBotMessage("I couldn't parse that into a project. Try describing your project with a name and technologies used.");
        }
        return false;
      }
    },
    [appendBotMessage, resumeData, setLastStep, setResumeFlowState, updateResume]
  );

  const applyEducationFromAI = useCallback(
    async (inputText, options = {}) => {
      const { promptIfEmpty = true } = options;
      const trimmed = (inputText || '').trim();
      if (!trimmed) {
        return false;
      }

      try {
        const existingData = resumeData?.education ? { education: resumeData.education } : null;
        const payload = await parseEducationAI(trimmed, existingData);
        const parsedEducation = Array.isArray(payload.education) ? payload.education : [];
        if (!parsedEducation.length) {
          if (promptIfEmpty) {
            appendBotMessage(
              'I can help structure your education. Try something like: "I have a Bachelor\'s in Computer Science from MIT, graduated 2020" or "Master\'s in AI from Stanford".'
            );
          }
          return false;
        }

        updateResume((prev) => {
          const existing = Array.isArray(prev.education) ? prev.education.filter(Boolean) : [];
          const next = [...existing];

          parsedEducation.forEach((incoming) => {
            if (!incoming) return;
            const incomingSchoolKey = (incoming.school || '').trim().toLowerCase();
            let merged = false;

            if (incomingSchoolKey) {
              const existingIndex = next.findIndex((edu) => {
                if (!edu) return false;
                const key = (edu.school || '').trim().toLowerCase();
                return key && key === incomingSchoolKey;
              });

              if (existingIndex !== -1) {
                const current = next[existingIndex] || {};
                next[existingIndex] = {
                  ...current,
                  degree: incoming.degree || current.degree || '',
                  field: incoming.field || current.field || '',
                  school: incoming.school || current.school || '',
                  city: incoming.city || current.city || '',
                  state: incoming.state || current.state || '',
                  graduationYear: incoming.graduationYear || current.graduationYear || '',
                  gpa: incoming.gpa || current.gpa || '',
                  honors: incoming.honors || current.honors || '',
                };
                merged = true;
              }
            }

            if (!merged) {
              next.push(incoming);
            }
          });

          return { ...prev, education: next };
        });

        setResumeFlowState((prev) => ({
          ...prev,
          data: { ...prev.data, education: trimmed },
        }));

        const summaryLines = parsedEducation.map((edu) => {
          const parts = [edu.degree, edu.field, edu.school].filter(Boolean);
          return parts.join(' in ') || 'Education entry';
        });
        const confirmation = `Got it! I added ${summaryLines.length} education entr${summaryLines.length === 1 ? 'y' : 'ies'}: ${summaryLines.join('; ')}`;
        appendBotMessage(confirmation);
        setLastStep('chat_resume_flow_education_saved');
        return true;
      } catch (error) {
        console.error('AI education parse failed', error);
        if (promptIfEmpty) {
          appendBotMessage("I couldn't parse that into education. Try describing your degree, field of study, and school.");
        }
        return false;
      }
    },
    [appendBotMessage, resumeData, setLastStep, setResumeFlowState, updateResume]
  );

  const applySkillsFromAI = useCallback(
    async (inputText, options = {}) => {
      const { promptIfEmpty = true } = options;
      const trimmed = (inputText || '').trim();
      if (!trimmed) {
        return false;
      }

      // Get existing skills as array
      const existingSkillsStr = resumeData?.skills || '';
      const existingSkills = existingSkillsStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      try {
        // Use backend LangChain to parse skills
        const payload = await parseSkillsAI(trimmed, existingSkills);

        // Check if user wants to generate skills from resume data
        if (payload.action === 'generate') {
          // Call generate skills endpoint
          const generatePayload = await generateSkillsAI(resumeData, existingSkills);
          const normalized = (generatePayload.skills || []).join(', ');
          updateResume((prev) => ({ ...prev, skills: normalized }));
          setResumeFlowState((prev) => ({
            ...prev,
            data: { ...prev.data, skills: normalized },
          }));
          appendBotMessage(generatePayload.message || `Skills generated:\n${normalized}`);
          setLastStep('chat_resume_flow_skills_generated');
          return true;
        }

        // For add/remove/replace actions
        const skills = payload.skills || [];
        if (!skills.length && payload.action === 'none') {
          if (promptIfEmpty) {
            appendBotMessage(
              'I can help with your skills. Try something like: "I know Python, JavaScript, and React" or "generate skills from my experience".'
            );
          }
          return false;
        }

        const normalized = skills.join(', ');
        updateResume((prev) => ({ ...prev, skills: normalized }));
        setResumeFlowState((prev) => ({
          ...prev,
          data: { ...prev.data, skills: normalized },
        }));
        appendBotMessage(payload.message || `Skills updated:\n${normalized}`);
        setLastStep('chat_resume_flow_skills_saved');
        return true;
      } catch (error) {
        console.error('AI skills parse failed', error);
        // Fallback to simple comma split
        const normalized = trimmed
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean)
          .join(', ');
        if (normalized) {
          updateResume((prev) => ({ ...prev, skills: normalized }));
          setResumeFlowState((prev) => ({
            ...prev,
            data: { ...prev.data, skills: normalized },
          }));
          appendBotMessage(`Skills updated:\n${normalized}`);
          setLastStep('chat_resume_flow_skills_saved');
          return true;
        }
        if (promptIfEmpty) {
          appendBotMessage("I couldn't parse that into skills. Try something like \"I know Python, React, and AWS\" or \"generate skills from my experience\".");
        }
        return false;
      }
    },
    [appendBotMessage, resumeData, setLastStep, setResumeFlowState, updateResume]
  );

  const applyJobDescriptionFromChat = useCallback(
    async (inputText) => {
      const trimmed = (inputText || '').trim();
      if (!trimmed) {
        appendBotMessage('Please paste a job posting URL, the job description text, or both.');
        setLastStep('chat_job_description_missing_input');
        return { hasUrl: false, hasText: false };
      }

      // Get existing job descriptions from localStorage
      let existingEntries = [];
      try {
        if (typeof window !== 'undefined') {
          const existingRaw = window.localStorage.getItem('jobDescriptions');
          if (existingRaw) {
            const parsed = JSON.parse(existingRaw);
            if (Array.isArray(parsed)) {
              existingEntries = parsed.map((entry) => ({
                id: entry.id || '',
                title: entry.title || '',
                text: entry.text || '',
                url: entry.url || '',
              }));
            }
          }
        }
      } catch (error) {
        console.error('Failed to parse existing job descriptions', error);
      }

      // Use backend LangChain to determine action (add/modify/remove)
      let result;
      try {
        result = await parseJobDescriptionAI(trimmed, existingEntries);
      } catch (error) {
        console.error('Job description parse failed', error);
        appendBotMessage(
          "I couldn't understand that job posting yet. Please paste the job URL or the full job description text again."
        );
        setLastStep('chat_job_description_error');
        return { hasUrl: false, hasText: false };
      }

      const { action, entries, message, url, text } = result;

      // If action is "none" and no content detected, prompt user
      if (action === 'none' && !url && !text) {
        appendBotMessage(
          "I couldn't find a job posting URL or description to save. Please paste a job URL or the job description text."
        );
        setLastStep('chat_job_description_nothing_detected');
        return { hasUrl: false, hasText: false };
      }

      // For URLs, try to extract job description from the URL
      let finalEntries = entries || [];
      let extractedFromUrl = '';
      if (url) {
        try {
          const response = await fetch(`${apiBaseUrl}/api/job/extract`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
          });
          const data = await response.json().catch(() => ({}));
          if (response.ok && data && typeof data.description === 'string' && data.description.trim()) {
            let formatted = '';
            if (data.title) {
              formatted += `Position: ${data.title}\n`;
            }
            if (data.company) {
              formatted += `Company: ${data.company}\n\n`;
            }
            formatted += data.description;
            extractedFromUrl = formatted;

            // Update the entry with extracted text
            if (finalEntries.length > 0) {
              const targetIdx = action === 'add' ? finalEntries.length - 1 : 0;
              finalEntries[targetIdx] = {
                ...finalEntries[targetIdx],
                text: extractedFromUrl,
                title: data.title || finalEntries[targetIdx].title || '',
              };
            }
          }
        } catch (error) {
          console.error('Job description fetch from URL failed', error);
        }
      }

      // Update local storage with the new entries
      try {
        if (typeof window !== 'undefined') {
          const sanitizedList = finalEntries.map((entry) => ({
            id: entry.id || `chat-job-${Date.now().toString(36)}`,
            title: entry.title || '',
            url: entry.url || '',
            text: entry.text || '',
          }));

          window.localStorage.setItem('jobDescriptions', JSON.stringify(sanitizedList));

          // Set or clear the primary job description text
          const primaryText = sanitizedList.length > 0 ? sanitizedList[0].text : '';
          if (primaryText) {
            window.localStorage.setItem('jobDescription', primaryText);
          } else {
            // Clear job description when all entries are removed
            window.localStorage.removeItem('jobDescription');
          }

          window.dispatchEvent(new Event('builder:reload-job-descriptions'));
        }
      } catch (error) {
        console.error('Failed to persist job description updates from chat', error);
      }

      // Update resume flow state
      const primaryText = finalEntries.length > 0 ? finalEntries[0].text : '';
      setResumeFlowState((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          jobDescription: action === 'remove_all' ? '' : (primaryText || prev.data.jobDescription || ''),
        },
      }));

      // Show appropriate message based on action
      const hasUrl = !!url;
      const hasText = !!(text || extractedFromUrl);

      if (action === 'remove_all') {
        appendBotMessage(message || 'Got it! I have removed all job descriptions.');
        setLastStep('chat_job_description_removed_all');
      } else if (action === 'remove') {
        appendBotMessage(message || 'Got it! I have removed the job description.');
        setLastStep('chat_job_description_removed');
      } else if (action === 'modify') {
        if (hasUrl && extractedFromUrl) {
          appendBotMessage(message || 'Got it! I updated the job description with content from the URL.');
        } else {
          appendBotMessage(message || 'Got it! I have updated your job description.');
        }
        setLastStep('chat_job_description_modified');
      } else if (action === 'add') {
        if (hasUrl && extractedFromUrl) {
          appendBotMessage(message || 'Got it! I added a new job description with content from the URL.');
        } else {
          appendBotMessage(message || 'Got it! I have added your job description.');
        }
        setLastStep('chat_job_description_added');
      } else {
        appendBotMessage(message || 'Got it! I have saved your job description.');
        setLastStep('chat_job_description_saved');
      }

      return { hasUrl, hasText };
    },
    [apiBaseUrl, appendBotMessage, setLastStep, setResumeFlowState]
  );

  const handleJobMatchesShortcut = async () => {
    setIsLoading(true);
    setAwaitingJobMatchAnswer(false);
    setLastStep('chat_jobmatch_shortcut_start');

    if (!user || !token) {
      appendBotMessage('Please log in so I can look up your resume history and job matches.');
      setLastStep('chat_jobmatch_shortcut_login_required');
      setIsLoading(false);
      return;
    }

    appendBotMessage('Let me pull your latest resume so I can look for matching jobs...');

    try {
      const historyResponse = await fetchResumeHistoryList();
      const historyEntries = Array.isArray(historyResponse?.history) ? historyResponse.history : [];
      if (!historyEntries.length) {
        appendBotMessage('I could not find any generated resumes yet. Please build or import one first, then ask me again.');
        setLastStep('chat_jobmatch_shortcut_no_history');
        return;
      }

      const latestResume = historyEntries[0];
      if (latestResume?.resume_name) {
        appendBotMessage(`Using "${latestResume.resume_name}" to run AI job matches.`);
      }

      if (!resumeData) {
        appendBotMessage('I still need your resume details from the builder before I can run matches. Please reload the builder and try again.');
        setLastStep('chat_jobmatch_shortcut_missing_data');
        return;
      }

      const storedJobDescription = (resumeFlowState?.data?.jobDescription || getStoredJobDescription() || '').trim();
      const payload = buildJobMatchPayloadForChat(resumeData, storedJobDescription);
      if (!payload) {
        appendBotMessage('Add your summary, experience, education, or skills before requesting job matches.');
        setLastStep('chat_jobmatch_shortcut_insufficient_resume');
        return;
      }

      try {
        await computeJobMatches(payload);
      } catch (error) {
        console.error('Failed to compute job matches via chat', error);
        appendBotMessage("I couldn't run the AI matching right now. Please try again later or open the Job Matches tab inside the builder.");
        setLastStep('chat_jobmatch_shortcut_compute_error');
        return;
      }

      appendBotMessage('All set! Opening your Job Matches now.');
      redirectToJobMatchesSection();
      setLastStep('chat_jobmatch_shortcut_success');
    } catch (error) {
      console.error('Job match shortcut failed', error);
      appendBotMessage("I couldn't reach your resume history right now. Please try again in a moment.");
      setLastStep('chat_jobmatch_shortcut_error');
    } finally {
      setIsLoading(false);
    }
  };

  const ensureAuthenticatedForFlow = () => {
    if (user && token) {
      return true;
    }
    appendBotMessage(
      "Before we continue, please click the Login button at the top of the page and sign in with Google. Once you're back, just type \"ready\"."
    );
    setLastStep('chat_resume_flow_login_redirect');
    setResumeFlowState((prev) => ({ ...prev, active: true, stage: 'awaitLogin' }));
    return false;
  };

  const createStageMessage = useCallback((stage) => {
    if (!stage) {
      return null;
    }
    const stageIndex = RESUME_FLOW_SEQUENCE.indexOf(stage);
    if (stageIndex === -1) {
      return null;
    }
    const total = RESUME_FLOW_SEQUENCE.length;
    const body = RESUME_FLOW_PROMPTS[stage] || '';
    const stageButtons = stage === 'template' ? buildTemplateStageButtons() : [];
    const navButtons = [];
    if (stageIndex > 0) {
      navButtons.push({ label: 'Previous', value: 'resume_flow_prev' });
    }
    navButtons.push({ label: 'Next', value: 'resume_flow_next' });
    const buttons = stageButtons.length > 0 ? [...navButtons, ...stageButtons] : navButtons;
    return {
      sender: 'bot',
      text: body.trim(),
      buttons,
      progress: {
        current: stageIndex + 1,
        total,
      },
      meta: {
        stageKey: stage,
      },
    };
  }, []);

  const promptForStage = useCallback(
    (stage) => {
      const stageMessage = createStageMessage(stage);
      if (!stageMessage) {
        return;
      }
      setMessages([stageMessage]);
      notifyBuilderStage(stage);
    },
    [createStageMessage, notifyBuilderStage, setMessages]
  );

  const getNextStage = (current) => {
    const index = RESUME_FLOW_SEQUENCE.indexOf(current);
    if (index === -1 || index >= RESUME_FLOW_SEQUENCE.length - 1) {
      return null;
    }
    return RESUME_FLOW_SEQUENCE[index + 1];
  };

  const getPreviousStage = (current) => {
    const index = RESUME_FLOW_SEQUENCE.indexOf(current);
    if (index <= 0) {
      return null;
    }
    return RESUME_FLOW_SEQUENCE[index - 1];
  };

  const beginResumeFlowWizard = useCallback(() => {
    const initialStage = RESUME_FLOW_SEQUENCE[0];
    setResumeFlowState((prev) => ({
      ...prev,
      active: true,
      stage: initialStage,
    }));
    promptForStage(initialStage);
  }, [promptForStage]);

  const completeResumeFlow = useCallback(() => {
    setMessages([
      {
        sender: 'bot',
        text: "You're all set! You finished the resume build process in chat. Keep working inside the builder, and let me know if there's anything else I can help with.",
        buttons: [{ label: 'Start New Session', value: 'start_new_session' }],
      },
    ]);
    setLastStep('chat_resume_flow_complete');
    setResumeFlowState(DEFAULT_RESUME_FLOW_STATE);
  }, [setMessages, setLastStep, setResumeFlowState]);

  const advanceResumeStage = (nextStage) => {
    if (!nextStage) {
      completeResumeFlow();
      return;
    }
    setResumeFlowState((prev) => ({ ...prev, stage: nextStage }));
    promptForStage(nextStage);
  };

  const handleResumeFlowNavigation = useCallback(
    (direction) => {
      const currentStage = resumeFlowState.stage;
      if (!currentStage) {
        return;
      }
      const currentIndex = RESUME_FLOW_SEQUENCE.indexOf(currentStage);
      if (currentIndex === -1) {
        return;
      }
      if (direction === 'next') {
        const nextStage = getNextStage(currentStage);
        if (!nextStage) {
          completeResumeFlow();
          return;
        }
        setResumeFlowState((prev) => ({ ...prev, stage: nextStage }));
        promptForStage(nextStage);
        return;
      }
      if (direction === 'prev') {
        const prevStage = getPreviousStage(currentStage);
        if (!prevStage) {
          const firstStage = RESUME_FLOW_SEQUENCE[0];
          promptForStage(firstStage);
          return;
        }
        setResumeFlowState((prev) => ({ ...prev, stage: prevStage }));
        promptForStage(prevStage);
      }
    },
    [resumeFlowState.stage, completeResumeFlow, promptForStage, setResumeFlowState]
  );

  const startResumeFlow = (initialRequest) => {
    setResumeFlowState({
      ...DEFAULT_RESUME_FLOW_STATE,
      active: true,
      stage: 'confirm',
      data: { ...DEFAULT_RESUME_FLOW_STATE.data, jobDescription: initialRequest || '' },
    });
    appendBotMessage(
      'It sounds like you want to create a resume right here in chat. Want me to walk you through it?',
      {
        buttons: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ],
      }
    );
    setLastStep('chat_resume_flow_offer');
  };


  const handleResumeFlowMessage = async (userInput) => {
    const trimmed = userInput.trim();
    const lower = trimmed.toLowerCase();

    if (awaitingJobMatchAnswer) {
      handleJobMatchDecision(trimmed);
      return;
    }

    if (lower === 'cancel') {
      appendBotMessage('No worries. If you want to try again, just tell me to create a resume.');
      setResumeFlowState(DEFAULT_RESUME_FLOW_STATE);
      setLastStep('chat_resume_flow_cancel');
      return;
    }

    const updateIntent = detectSectionUpdateIntent(trimmed);
    if (updateIntent) {
      if (resumeFlowState.stage === 'jobDescription' && updateIntent.key === 'jobDescription') {
        await applyJobDescriptionFromChat(updateIntent.value);
        setIsLoading(false);
        return;
      }
      const result = handleSectionUpdateIntent({
        ...updateIntent,
        resumeData,
        updateResume,
        setResumeFlowState,
      });
      appendBotMessage(result.message, result.buttons ? { buttons: result.buttons } : undefined);
      setIsLoading(false);
      return;
    }

    // Personal details are handled by backend LangChain agent
    // Always route to AI handler - no stage restriction since summary/removal needs this
    if (looksLikePersonalInfoMessage(trimmed)) {
      const updated = await applyPersonalDetailsFromAI(trimmed, { promptIfEmpty: true });
      if (updated) {
        setIsLoading(false);
        return;
      }
    }

    // Experience is handled by backend LangChain agent
    if (looksLikeExperienceMessage(trimmed)) {
      const updated = await applyExperienceFromAI(trimmed, { promptIfEmpty: true });
      if (updated) {
        setIsLoading(false);
        return;
      }
    }

    // Projects are handled by backend LangChain agent
    if (looksLikeProjectsMessage(trimmed)) {
      const updated = await applyProjectsFromAI(trimmed, { promptIfEmpty: true });
      if (updated) {
        setIsLoading(false);
        return;
      }
    }

    // Education is handled by backend LangChain agent
    if (looksLikeEducationMessage(trimmed)) {
      const updated = await applyEducationFromAI(trimmed, { promptIfEmpty: true });
      if (updated) {
        setIsLoading(false);
        return;
      }
    }

    const sectionKey = detectSectionRequest(trimmed);
    if (sectionKey && resumeFlowState.stage !== sectionKey) {
      const response = buildSectionResponse(sectionKey);
      appendBotMessage(
        response || "I don't have that information yet. Try filling out that section first."
      );
      setIsLoading(false);
      return;
    }

    switch (resumeFlowState.stage) {
      case 'confirm':
        if (isAffirmative(lower)) {
          if (ensureAuthenticatedForFlow()) {
            beginResumeFlowWizard();
          }
        } else if (isNegative(lower)) {
          appendBotMessage('All good! Ask me anything else whenever you like.');
          setResumeFlowState(DEFAULT_RESUME_FLOW_STATE);
        } else {
          appendBotMessage('Just let me know yes or no - should we create your resume here?');
        }
        setIsLoading(false);
        return;
      case 'awaitLogin':
        if (user && token) {
          appendBotMessage("Welcome back! Let's keep going.");
          beginResumeFlowWizard();
        } else {
          appendBotMessage("I still need you to finish logging in. Once you're ready, just say \"ready\".");
        }
        setIsLoading(false);
        return;
      case 'personal': {
        const updated = await applyPersonalDetailsFromAI(trimmed, { promptIfEmpty: true });
        if (!updated) {
          // applyPersonalDetailsFromAI already prompted the user.
          setIsLoading(false);
          return;
        }
        setIsLoading(false);
        return;
      }
      case 'experience': {
        const updated = await applyExperienceFromAI(trimmed, { promptIfEmpty: true });
        if (!updated) {
          // applyExperienceFromAI already prompted the user.
          setIsLoading(false);
          return;
        }
        setIsLoading(false);
        return;
      }
      case 'template': {
        try {
          const result = await inferTemplatePreference(trimmed);
          const templateId = (result.template_id || result.templateId || '').trim();
          const fontSizeId = (result.font_size_id || result.fontSizeId || '').trim();

          if (templateId || fontSizeId) {
            updateResume((prev) => ({
              ...prev,
              selectedFormat: templateId || prev.selectedFormat,
              selectedFontSize: fontSizeId || prev.selectedFontSize,
            }));
          }

          const chosenTemplate = TEMPLATE_OPTIONS.find(
            (tpl) => tpl.id === templateId
          );
          const humanTemplateName =
            chosenTemplate?.name || (templateId ? templateId : 'a template');

          const parts = [];
          if (templateId) {
            parts.push(`template: ${humanTemplateName}`);
          }
          if (fontSizeId) {
            parts.push(`font size: ${fontSizeId}`);
          }

          const summary =
            parts.length > 0
              ? `Got it! I'll use ${parts.join(' and ')}. You can review the preview on the right, then click Next when you're ready.`
              : 'Got it! I will keep your current template settings. You can adjust them or click Next when you are ready.';

          appendBotMessage(summary);
        } catch (error) {
          console.error('Template preference error from chat:', error);
          const placeholder =
            RESUME_FLOW_STEP_RESPONSES.template ||
            'Template picking inside chat is still limited. Please open the Template & Format section to choose a template and font size.';
          appendBotMessage(placeholder);
        }
        setIsLoading(false);
        return;
      }
      case 'jobDescription': {
        await applyJobDescriptionFromChat(trimmed);
        setIsLoading(false);
        return;
      }
      case 'skills': {
        const updated = await applySkillsFromAI(trimmed, { promptIfEmpty: true });
        if (!updated) {
          // applySkillsFromAI already prompted the user.
          setIsLoading(false);
          return;
        }
        setIsLoading(false);
        return;
      }
      default:
        if (resumeFlowState.active && RESUME_FLOW_SEQUENCE.includes(resumeFlowState.stage)) {
          const placeholder =
            RESUME_FLOW_STEP_RESPONSES[resumeFlowState.stage] ||
            "I'm still getting ready for this step inside chat. Please keep using the builder UI and the Previous/Next buttons.";
          const userEntry = { sender: 'user', text: trimmed };
          const botEntry = { sender: 'bot', text: placeholder };
          setMessages((prev) => {
            let stageMessage = prev[0];
            let existingConversation = prev.slice(1);
            if (!stageMessage || stageMessage.meta?.stageKey !== resumeFlowState.stage) {
              const rebuiltStageMessage = createStageMessage(resumeFlowState.stage);
              stageMessage = rebuiltStageMessage || stageMessage;
              existingConversation = [];
            } else if (
              existingConversation.length > 0 &&
              existingConversation[existingConversation.length - 1]?.sender === 'user' &&
              existingConversation[existingConversation.length - 1]?.text === userEntry.text
            ) {
              existingConversation = existingConversation.slice(0, -1);
            }
            const preservedConversation =
              stageMessage && stageMessage.meta?.stageKey === resumeFlowState.stage
                ? existingConversation
                : [];
            const base = stageMessage ? [stageMessage] : [];
            return [...base, ...preservedConversation, userEntry, botEntry];
          });
          setIsLoading(false);
          return;
        }
        break;
    }

  };

const handleChatDownloadRequest = async (userRequest) => {
  if (!user || !token) {
    appendBotMessage(
      "Please log in first so I can generate your PDF. Use the Login button above and then type \"ready\"."
    );
    setLastStep('chat_resume_download_login_required');
    return;
  }

  if (!resumeData) {
    appendBotMessage('I could not find your resume details yet. Try opening the builder first.');
    return;
  }

  let historyEntries = [];
  try {
    const historyResponse = await fetchResumeHistoryList();
    historyEntries = Array.isArray(historyResponse?.history) ? historyResponse.history : [];
  } catch (error) {
    console.error('Unable to load resume history for download', error);
    appendBotMessage('I could not check your resume history right now. Please open the builder and download from there.');
    setLastStep('chat_resume_download_history_error');
    return;
  }

  if (!historyEntries.length) {
    appendBotMessage('I could not find any generated resumes yet. Please build or import one first, then ask me again.');
    setLastStep('chat_resume_download_no_history');
    return;
  }

  const jobDescription =
    resumeFlowState.data.jobDescription || getStoredJobDescription();
    const html = buildResumeHtml(resumeData, jobDescription);
    const payload = buildDownloadPayload(resumeData, jobDescription, html);

    appendBotMessage('Generating your resume PDF now...');
    setLastStep('chat_resume_download_start');
    try {
      const response = await fetch(`${apiBaseUrl}/api/resume/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errorMessage =
          data?.error ||
          data?.message ||
          'Unable to generate the PDF. Please try again from the builder.';
        throw new Error(errorMessage);
      }

      const downloadUrl = data.downloadURL || data.filePath;
      if (downloadUrl) {
        appendBotMessage('All set! Download your resume:', {
          linkUrl: downloadUrl,
          linkLabel: 'link',
        });
        setLastStep('chat_resume_download_success');
        showJobMatchesPrompt();
      } else {
        appendBotMessage(
          "I generated the resume, but I didn't get a download link. Please try from the builder page."
        );
        setLastStep('chat_resume_download_missing_link');
      }
    } catch (error) {
      console.error('Chat resume download error:', error);
      appendBotMessage(
        `I couldn't generate the PDF right now: ${error.message || 'unknown error'}. Please try again or use the builder download button.`
      );
      setLastStep('chat_resume_download_error');
    }
  };

const showJobMatchesPrompt = () => {
    if (awaitingJobMatchAnswer) {
      return;
    }
    setAwaitingJobMatchAnswer(true);
    appendBotMessage('Want to see AI job matches now?', {
      buttons: [
        { label: 'Yes', value: 'jobmatches_yes' },
        { label: 'No', value: 'jobmatches_no' },
      ],
    });
  };

const handleJobMatchDecision = (rawValue) => {
    if (!awaitingJobMatchAnswer) {
      return false;
    }

    const normalized = (rawValue || '').toString().trim().toLowerCase();
    let jobMatchResponse = normalized;
    if (jobMatchResponse.startsWith('jobmatches_')) {
      jobMatchResponse = jobMatchResponse.replace('jobmatches_', '');
    }

    if (isAffirmative(jobMatchResponse)) {
      setAwaitingJobMatchAnswer(false);
      appendBotMessage('Great! Opening job matches now.');
      try {
        window.localStorage.setItem('chatJobMatchesRedirect', '1');
      } catch (_) {
        // ignore storage issues
      }
      setTimeout(() => navigate('/builder'), 300);
      setLastStep('chat_jobmatch_yes');
      return true;
    }

    if (isNegative(jobMatchResponse)) {
      setAwaitingJobMatchAnswer(false);
      appendBotMessage('No problem! Let me know if you need anything else.');
      setLastStep('chat_jobmatch_no');
      return true;
    }

    appendBotMessage('Please reply "yes" or "no" so I know whether to show job matches.');
    return true;
  };

const buildSectionResponse = (sectionKey) => {
    const jobDescription =
      resumeFlowState.data.jobDescription || getStoredJobDescription();
    switch (sectionKey) {
      case 'personal': {
        const { name, email, phone } = resumeData || {};
        const dateOfBirth = resumeFlowState.data.personal.dateOfBirth;
        if (!name && !email && !phone) {
          return null;
        }
        return [
          'Personal details:',
          name ? `Name: ${name}` : null,
          email ? `Email: ${email}` : null,
          phone ? `Phone: ${phone}` : null,
          dateOfBirth ? `Date of birth: ${dateOfBirth}` : null,
        ]
          .filter(Boolean)
          .join('\n');
      }
      case 'summary': {
        if (!resumeData?.summary) return null;
        return `Summary:\n${resumeData.summary}`;
      }
      case 'skills': {
        if (!resumeData?.skills) return null;
        return `Skills:\n${resumeData.skills}`;
      }
      case 'experience': {
        if (!Array.isArray(resumeData?.experiences) || resumeData.experiences.length === 0) {
          return null;
        }
        const lines = resumeData.experiences
          .filter((exp) => exp && (exp.jobTitle || exp.company || exp.description))
          .map((exp) => {
            const header = [exp.jobTitle, exp.company].filter(Boolean).join(' at ');
            return [header, exp.description].filter(Boolean).join('\n');
          });
        if (!lines.length) return null;
        return `Experience:\n${lines.join('\n\n')}`;
      }
      case 'projects': {
        if (!Array.isArray(resumeData?.projects) || resumeData.projects.length === 0) {
          return null;
        }
        const lines = resumeData.projects
          .filter((proj) => proj && (proj.projectName || proj.description))
          .map((proj) => {
            const header = proj.projectName ? `Project: ${proj.projectName}` : null;
            return [header, proj.description].filter(Boolean).join('\n');
          });
        if (!lines.length) return null;
        return `Projects:\n${lines.join('\n\n')}`;
      }
      case 'education': {
        if (!Array.isArray(resumeData?.education) || resumeData.education.length === 0) {
          return null;
        }
        const lines = resumeData.education
          .filter((ed) => ed && (ed.degree || ed.school))
          .map((ed) => {
            const header = [ed.degree, ed.field].filter(Boolean).join(' in ');
            const details = [ed.school, ed.graduationYear].filter(Boolean).join(', ');
            return [header, details].filter(Boolean).join('\n');
          });
        if (!lines.length) return null;
        return `Education:\n${lines.join('\n\n')}`;
      }
      case 'jobDescription': {
        if (!jobDescription) return null;
        return `Current job description:\n${jobDescription}`;
      }
      default:
        return null;
    }
  };

  const handleSubmit = async (event, overrideText = null, displayOverride = null, options = {}) => {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
    const sourceText = overrideText !== null ? overrideText : input;
    const trimmed = sourceText.trim();
    const displayText = (displayOverride !== null ? displayOverride : sourceText).trim();
    if (!trimmed || isLoading) {
      return;
    }
    const normalized = trimmed.toLowerCase();
    const intent = options?.intent || null;

    const userMessage = { sender: 'user', text: displayText };
    setLastStep('chat_question_submitted');
    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    if (overrideText === null) {
      setInput('');
    }
    setIsLoading(true);

    if (hasStartNewSessionIntent(normalized)) {
      handleStartNewSession();
      appendBotMessage('Starting a fresh session. Let me know whenever you need help again.');
      setIsLoading(false);
      return;
    }

    if (hasQuitFlowIntent(normalized)) {
      if (resumeFlowState.active) {
        setResumeFlowState(DEFAULT_RESUME_FLOW_STATE);
        setAwaitingJobMatchAnswer(false);
        appendBotMessage('All good - I have stopped the guided resume walkthrough. Just say "build my resume" when you want to continue.');
        setLastStep('chat_resume_flow_cancelled');
      } else {
        appendBotMessage('There is no guided resume step running right now. Say "build my resume" if you would like to start one.');
      }
      setIsLoading(false);
      return;
    }

    if (intent === 'jobMatches' || isJobMatchShortcutIntent(trimmed)) {
      await handleJobMatchesShortcut();
      return;
    }

    if (hasBackgroundAnalysisIntent(trimmed)) {
      await handleBackgroundAnalysis();
      return;
    }

    if (hasSoftwareEngineerJobCountIntent(trimmed)) {
      await handleSoftwareEngineerJobCount();
      return;
    }

    if (awaitingJobMatchAnswer) {
      handleJobMatchDecision(trimmed);
      setIsLoading(false);
      return;
    }

    const updateIntent = detectSectionUpdateIntent(trimmed);
    if (updateIntent) {
      const result = handleSectionUpdateIntent({
        ...updateIntent,
        resumeData,
        updateResume,
        setResumeFlowState,
      });
      appendBotMessage(result.message);
      setIsLoading(false);
      return;
    }

    // Personal details are handled by looksLikePersonalInfoMessage -> applyPersonalDetailsFromAI

    if (hasInterviewProcessIntent(trimmed)) {
      appendBotMessage(
        "Great question! We're building an upcoming feature that shares interview insights for specific companies. Stay tuned -- it's on our roadmap!"
      );
      setLastStep('chat_interview_future_feature');
      setIsLoading(false);
      return;
    }

    if (resumeFlowState.active) {
      await handleResumeFlowMessage(trimmed);
      setIsLoading(false);
      return;
    }

    if (hasDownloadIntent(trimmed)) {
      await handleChatDownloadRequest(trimmed);
      setIsLoading(false);
      return;
    }

    if (hasResumeIntent(trimmed)) {
      startResumeFlow(trimmed);
      setIsLoading(false);
      return;
    }

    const historyPayload = updatedHistory.slice(-8).map((msg) => ({
      role: msg.sender === 'bot' ? 'assistant' : 'user',
      text: msg.text,
    }));

    try {
      const pagePath = typeof window !== 'undefined' ? window.location.pathname : '';
      const userEmail = readStoredUserEmail();

      const response = await fetch(`${apiBaseUrl}/api/assistant/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: historyPayload,
          session_id: sessionId,
          page_path: pagePath,
          user_email: user?.email || userEmail || '',
        }),
      });

      if (!response.ok) {
        throw new Error('Assistant unavailable');
      }

      const data = await response.json();
      const reply = (data.reply || '').trim() || FALLBACK_REPLY;
      setMessages((prev) => [...prev, { sender: 'bot', text: reply }]);
      setLastStep('chat_response_received');
    } catch (err) {
      console.error('Chat assistant error:', err);
      setMessages((prev) => [...prev, { sender: 'bot', text: FALLBACK_REPLY }]);
      setLastStep('chat_error_fallback');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMessageButtonClick = (btn) => {
    if (!btn) {
      return;
    }
    if (btn.value === 'start_new_session') {
      handleStartNewSession();
      return;
    }
    if (btn.value === 'resume_flow_next') {
      handleResumeFlowNavigation('next');
      return;
    }
    if (btn.value === 'resume_flow_prev') {
      handleResumeFlowNavigation('prev');
      return;
    }
    if (btn.action === 'jump_template_section') {
      jumpToTemplateSection();
      return;
    }
    if (btn.value) {
      const normalizedValue = btn.value.toLowerCase();
      if (normalizedValue.includes('job match')) {
        handleSubmit(null, btn.value, btn.label || btn.value, { intent: 'jobMatches' });
        return;
      }
      if (normalizedValue.startsWith('template:')) {
        const templateId = btn.value.split(':')[1];
        const templateMeta = TEMPLATE_OPTIONS.find((tpl) => tpl.id === templateId);
        if (templateMeta) {
          updateResume((prev) => ({
            ...prev,
            selectedFormat: templateMeta.id,
          }));
          setResumeFlowState((prev) => ({
            ...prev,
            data: { ...prev.data, templateId: templateMeta.id },
          }));
          appendBotMessage(`Fantastic choice! We'll use the ${templateMeta.name} template.`);
          advanceResumeStage(getNextStage('template'));
        } else {
          appendBotMessage('Please select a template from the buttons provided.');
        }
        return;
      }
      handleSubmit(null, btn.value, btn.label || btn.value);
    }
  };

  const isSendDisabled = isLoading || input.trim() === '';

  return (
    <div className="chat-widget" style={widgetStyle}>
      {isOpen && (
        <div
          className={`chat-panel${isLarge ? ' chat-panel--large' : ''}`}
          role="dialog"
          aria-label="HiHired chat assistant"
        >
          <div className="chat-header" onPointerDown={handleDialogHeaderPointerDown}>
            <span className="chat-title">HiHired Assistant</span>
            <div className="chat-header-actions">
              <label className="ai-enhanced-toggle">
                <input
                  type="checkbox"
                  checked={aiEnhanced}
                  onChange={(e) => setAiEnhanced(e.target.checked)}
                />
                <span className="toggle-slider"></span>
                <span className="toggle-label">AI Enhanced</span>
              </label>
              <button
                type="button"
                className="chat-header-btn"
                onClick={handleStartNewSession}
              >
                Start New Session
              </button>
              <button
                type="button"
                className="chat-header-icon chat-header-icon--toggle-size"
                onClick={toggleSize}
                aria-label={isLarge ? 'Reduce chat size' : 'Enlarge chat'}
              >
                <span
                  className={`chat-header-window-icon${
                    isLarge ? ' chat-header-window-icon--restore' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>
              <button
                type="button"
                className="chat-header-icon chat-header-icon--minimize"
                onClick={minimizeChat}
                aria-label="Minimize chat"
              >
                &minus;
              </button>
            </div>
          </div>
          <div className="chat-messages">
            {messages.map((message, index) => {
              const progressInfo = getProgressInfo(message.progress);
              return (
                <div key={`${message.sender}-${index}`} className={`chat-message ${message.sender}`}>
                  {progressInfo && (
                    <div
                      className="chat-progress"
                      aria-label={`Step ${progressInfo.current} of ${progressInfo.total}`}
                    >
                      <div className="chat-progress-track">
                        <div
                          className="chat-progress-fill"
                          style={{ width: `${progressInfo.percent}%` }}
                        />
                      </div>
                      <div className="chat-progress-label">{`Step ${progressInfo.current} of ${progressInfo.total}`}</div>
                    </div>
                  )}
                {message.text && <span>{message.text}</span>}
                {message.linkUrl && (
                  <a
                    className="chat-link"
                    href={message.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {message.linkLabel || 'link'}
                  </a>
                )}
                {Array.isArray(message.buttons) && message.buttons.length > 0 && (
                  <div className="chat-button-row">
                    {message.buttons.map((btn, idx) => {
                      const buttonClasses = ['chat-button'];
                      if (btn.variant) {
                        buttonClasses.push(`chat-button--${btn.variant}`);
                      }
                      return (
                        <button
                          key={`${message.sender}-${index}-btn-${idx}`}
                          type="button"
                          className={buttonClasses.join(' ')}
                          onClick={() => handleMessageButtonClick(btn)}
                        >
                          {btn.label}
                        </button>
                      );
                    })}
                  </div>
                )}
                {Array.isArray(message.extraButtons) && message.extraButtons.length > 0 && (
                  <div className="chat-button-row chat-button-row--stacked">
                    {message.extraButtons.map((btn, idx) => (
                      <button
                        key={`${message.sender}-${index}-extra-btn-${idx}`}
                        type="button"
                        className="chat-button"
                        onClick={() => handleMessageButtonClick(btn)}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                )}
                </div>
              );
            })}
            {isLoading && <div className="chat-message bot typing">HiHired assistant is typing...</div>}
          </div>
          <form className="chat-input" onSubmit={handleSubmit}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about the AI resume builder..."
              aria-label="Type your message"
              disabled={isLoading}
              rows={2}
            />
            <button
              type="button"
              className={`chat-voice-btn ${isListening ? 'chat-voice-btn--active' : ''}`}
              onClick={handleVoiceInput}
              disabled={isLoading}
              aria-label={isListening ? 'Stop listening' : 'Start voice input'}
              title={isListening ? 'Stop listening' : 'Voice input'}
            >
              {isListening ? (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              )}
            </button>
            <button type="submit" disabled={isSendDisabled}>
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      )}

      <div className="chat-toggle-wrapper">
        {showIntroTooltip && (
          <div className="chat-intro-tooltip" role="status" aria-live="polite">
            <div className="chat-intro-tooltip__text">
              I'm your job search AI companion. Click to chat!
            </div>
            <button
              type="button"
              className="chat-intro-tooltip__close"
              onClick={dismissIntroTooltip}
              aria-label="Dismiss chat helper message"
            >
              &times;
            </button>
          </div>
        )}
        <button
          type="button"
          className="chat-toggle"
          onPointerDown={handleLauncherPointerDown}
          onClick={handleLauncherClick}
          onKeyDown={handleLauncherKeyDown}
          aria-label={isOpen ? 'Hide chat assistant' : 'Chat with HiHired bot'}
          title="Chat with our AI companion"
        >
          <RobotIcon />
        </button>
      </div>
    </div>
  );
};

const ChatWidget = () => {
  if (!CHAT_WIDGET_ENABLED) {
    return null;
  }
  return <ChatWidgetInner />;
};

const RobotIcon = () => (
  <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="presentation" aria-hidden="true">
    <defs>
      <linearGradient id="botFace" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fffafc" />
        <stop offset="100%" stopColor="#e0f2ff" />
      </linearGradient>
    </defs>
    <rect x="20" y="30" width="80" height="70" rx="18" fill="url(#botFace)" stroke="#93c5fd" strokeWidth="4" />
    <circle cx="60" cy="12" r="6" fill="#3b82f6" />
    <line x1="60" y1="18" x2="60" y2="30" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" />
    <circle cx="45" cy="65" r="8" fill="#1f2937" />
    <circle cx="75" cy="65" r="8" fill="#1f2937" />
    <rect x="40" y="82" width="40" height="10" rx="5" fill="#38bdf8" />
    <circle cx="20" cy="55" r="6" fill="#93c5fd" />
    <circle cx="100" cy="55" r="6" fill="#93c5fd" />
  </svg>
);

const buildDownloadPayload = (data, jobDescription, html) => {
  const skillsSource =
    (data.skillsCategorized && data.skillsCategorized.trim()) || data.skills || '';

  return {
    name: data.name || '',
    email: data.email || '',
    phone: data.phone || '',
    summary: data.summary || '',
    experience: flattenExperienceText(data.experiences || []),
    education: flattenEducationText(data.education || []),
    jobDescription: jobDescription || '',
    location: '',
    skillsCategorized: data.skillsCategorized || '',
    skills: skillsSource
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean),
    format: data.selectedFormat || 'classic-professional',
    resumeData: data,
    selectedFontSize: data.selectedFontSize || '',
    engine: 'chromium-strict',
    htmlContent: html,
  };
};

const normalizeSkillTokens = (skills) => {
  if (Array.isArray(skills)) {
    return skills.map((skill) => (skill || '').trim()).filter(Boolean);
  }
  if (typeof skills === 'string') {
    return skills
      .split(/[,\n;|]/)
      .map((skill) => skill.trim())
      .filter(Boolean);
  }
  return [];
};

const collectSkillsFromResume = (resumeData) => {
  if (!resumeData || typeof resumeData !== 'object') {
    return [];
  }
  const skillSet = new Set();
  normalizeSkillTokens(resumeData.skills).forEach((skill) => skillSet.add(skill));

  const projects = Array.isArray(resumeData.projects) ? resumeData.projects : [];
  projects.forEach((project) => {
    if (!project || typeof project !== 'object') {
      return;
    }
    normalizeSkillTokens(project.technologies).forEach((skill) => skillSet.add(skill));
    normalizeSkillTokens(project.skills).forEach((skill) => skillSet.add(skill));
  });

  const experiences = Array.isArray(resumeData.experiences) ? resumeData.experiences : [];
  experiences.forEach((exp) => {
    if (!exp || typeof exp !== 'object') {
      return;
    }
    normalizeSkillTokens(exp.skills).forEach((skill) => skillSet.add(skill));
    normalizeSkillTokens(exp.tools).forEach((skill) => skillSet.add(skill));
  });

  return Array.from(skillSet).slice(0, 60);
};

const summarizeExperiencesForMatches = (experiences = []) =>
  (Array.isArray(experiences) ? experiences : [])
    .filter((exp) => exp && (exp.jobTitle || exp.company || exp.description))
    .map((exp) => {
      const header = [exp.jobTitle, exp.company].filter(Boolean).join(' at ');
      const desc = typeof exp.description === 'string' ? exp.description.replace(/\s+/g, ' ').trim() : '';
      if (header && desc) {
        return `${header}: ${desc}`;
      }
      return header || desc;
    })
    .filter(Boolean)
    .join('\n\n');

const summarizeEducationForMatches = (education = []) =>
  (Array.isArray(education) ? education : [])
    .filter((ed) => ed && (ed.degree || ed.school || ed.field || ed.graduationYear))
    .map((ed) => {
      const credential = [ed.degree, ed.field].filter(Boolean).join(' in ');
      const school = ed.school || '';
      const year = ed.graduationYear || ed.graduationMonth || '';
      return [credential, school, year].filter(Boolean).join(', ');
    })
    .filter(Boolean)
    .join('\n');

const JOB_TITLE_KEYWORDS = [
  'engineer',
  'developer',
  'manager',
  'designer',
  'scientist',
  'analyst',
  'consultant',
  'architect',
  'specialist',
  'lead',
  'director',
  'strategist',
  'administrator',
  'coordinator',
  'marketer',
  'technician',
  'researcher',
  'product manager',
  'product designer',
  'product owner',
  'project manager',
  'program manager',
  'software',
  'frontend',
  'backend',
  'full stack',
  'devops',
  'security',
  'marketing manager',
  'sales manager',
  'recruiter',
  'data engineer',
  'data scientist',
  'data analyst',
  'operations manager',
];

const looksLikeJobTitle = (value) => {
  if (!value || typeof value !== 'string') {
    return false;
  }
  const lower = value.toLowerCase();
  return JOB_TITLE_KEYWORDS.some((keyword) => lower.includes(keyword));
};

const deriveTargetPosition = (resumeData, jobDescription = '') => {
  if (!resumeData || typeof resumeData !== 'object') {
    return '';
  }

  const directFields = ['position', 'desiredRole', 'role', 'headline', 'title'];
  for (const field of directFields) {
    const value = resumeData[field];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  const experiences = Array.isArray(resumeData.experiences) ? resumeData.experiences.filter(Boolean) : [];
  for (let i = experiences.length - 1; i >= 0; i -= 1) {
    const exp = experiences[i];
    if (exp && typeof exp.jobTitle === 'string' && exp.jobTitle.trim()) {
      return exp.jobTitle.trim();
    }
  }

  if (typeof resumeData.summary === 'string' && resumeData.summary.trim()) {
    const summary = resumeData.summary.trim();
    const summaryLower = summary.toLowerCase();
    const cleaned = summary.replace(/[|\u2022\u00b7].*$/, '').replace(/-.*/, '').replace(/,.*/, '');
    if (looksLikeJobTitle(cleaned) && cleaned.split(/\s+/).length <= 6) {
      return cleaned;
    }
    const keywordMatch = JOB_TITLE_KEYWORDS
      .map((keyword) => ({ keyword, index: summaryLower.indexOf(keyword) }))
      .filter((entry) => entry.index >= 0)
      .sort((a, b) => a.index - b.index)[0];
    if (keywordMatch) {
      const { index, keyword } = keywordMatch;
      const sliceStart = summary.lastIndexOf(' ', Math.max(0, index - 35));
      const sliceEnd = summary.indexOf(' ', index + keyword.length);
      const candidate = summary
        .slice(sliceStart >= 0 ? sliceStart : 0, sliceEnd >= 0 ? sliceEnd : summary.length)
        .replace(/[|\u2022\u00b7].*$/, '')
        .trim();
      if (looksLikeJobTitle(candidate) && candidate.split(/\s+/).length <= 6) {
        return candidate;
      }
    }
  }

  if (typeof jobDescription === 'string' && jobDescription.trim()) {
    const lines = jobDescription
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && line.length <= 60);
    for (const line of lines) {
      if (/^role:/i.test(line)) {
        const after = line.replace(/^role:\s*/i, '');
        if (after && looksLikeJobTitle(after)) {
          return after;
        }
      }
      const stripped = line.replace(/[:\-\u2013].*$/, '').trim();
      if (looksLikeJobTitle(stripped) && stripped.split(/\s+/).length <= 6) {
        return stripped;
      }
    }
  }

  return '';
};

const combineLocationParts = (...parts) =>
  parts
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean)
    .join(', ');

const deriveResumeLocation = (resumeData = {}) => {
  const scanRecords = (records = []) => {
    for (let i = records.length - 1; i >= 0; i -= 1) {
      const entry = records[i];
      if (!entry || typeof entry !== 'object') {
        continue;
      }
      if (typeof entry.location === 'string' && entry.location.trim()) {
        return entry.location.trim();
      }
      const combined = combineLocationParts(entry.city, entry.state || entry.region, entry.country);
      if (combined) {
        return combined;
      }
    }
    return '';
  };

  const experienceLocation = scanRecords(Array.isArray(resumeData.experiences) ? resumeData.experiences : []);
  if (experienceLocation) {
    return experienceLocation;
  }

  const educationLocation = scanRecords(Array.isArray(resumeData.education) ? resumeData.education : []);
  if (educationLocation) {
    return educationLocation;
  }

  const fallback = combineLocationParts(resumeData.city, resumeData.state, resumeData.country);
  if (fallback) {
    return fallback;
  }

  if (typeof resumeData.location === 'string' && resumeData.location.trim()) {
    return resumeData.location.trim();
  }

  return '';
};

const buildJobMatchPayloadForChat = (resumeData, jobDescription = '') => {
  if (!resumeData || typeof resumeData !== 'object') {
    return null;
  }

  const summaryText = typeof resumeData.summary === 'string' ? resumeData.summary.trim() : '';
  const experienceSummary = summarizeExperiencesForMatches(resumeData.experiences);
  const educationSummary = summarizeEducationForMatches(resumeData.education);
  const skills = collectSkillsFromResume(resumeData);

  if (!summaryText && !experienceSummary && !educationSummary && skills.length === 0) {
    return null;
  }

  return {
    position: deriveTargetPosition(resumeData, jobDescription),
    name: resumeData.name || '',
    email: resumeData.email || '',
    summary: summaryText,
    experience: experienceSummary,
    education: educationSummary,
    jobDescription: jobDescription || '',
    location: deriveResumeLocation(resumeData),
    skills,
    htmlContent: '',
    candidateJobLimit: 400,
    maxResults: 25,
  };
};

const parseKeyValue = (text, key) => {
  if (!text) return '';
  const regex = new RegExp(`${key}\\s*[:\\-]\\s*([^;\\n]+)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
};

const normalizeCapturedValue = (value) =>
  value
    ? value
        .replace(/^(and|also)\s+/i, '')
        .replace(/\s+(?:and|also)\s*$/i, '')
        .trim()
    : '';

const cleanCapturedName = (value) => {
  if (!value) return '';
  return value.replace(/\s+and\s+(?:my|the|our|your|his|her)\b.*$/i, '').trim();
};

const extractNameFromNaturalText = (text) => {
  const namePatterns = [
    /\bmy name is\s+([^.,\n]+)/i,
    /\bi am\s+([^.,\n]+)/i,
    /\bthis is\s+([^.,\n]+)/i,
    /\b(?:it's|it is)\s+([^.,\n]+)/i,
  ];
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match) {
      return normalizeCapturedValue(match[1]);
    }
  }
  return '';
};

const extractDateOfBirth = (text) => {
  const monthPattern = /\b(?:born|birthday|date of birth|dob)\s*(?:is|was|:)?\s*([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4})/i;
  const numericPattern = /\b(?:born|birthday|date of birth|dob)\s*(?:is|was|:)?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i;
  const monthMatch = text.match(monthPattern);
  if (monthMatch) {
    return normalizeCapturedValue(monthMatch[1]);
  }
  const numericMatch = text.match(numericPattern);
  if (numericMatch) {
    return normalizeCapturedValue(numericMatch[1]);
  }
  return '';
};

// parsePersonalDetails removed - all personal details parsing is now handled by backend LangChain agent

const handleSectionUpdateIntent = ({
  key,
  value,
  resumeData,
  updateResume,
  setResumeFlowState,
}) => {
  const respond = (message) => ({
    success: false,
    message,
  });

  switch (key) {
    case 'summary': {
      if (!value) return respond('Please provide the summary text.');
      updateResume((prev) => ({ ...prev, summary: value }));
      setResumeFlowState((prev) => ({
        ...prev,
        data: { ...prev.data, summary: value },
      }));
      return { success: true, message: `Summary updated:\n${value}` };
    }
    case 'skills': {
      if (!value) return respond('Please list your skills.');
      const normalized = value
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean)
        .join(', ');
      updateResume((prev) => ({ ...prev, skills: normalized }));
      setResumeFlowState((prev) => ({
        ...prev,
        data: { ...prev.data, skills: normalized },
      }));
      return { success: true, message: `Skills updated:\n${normalized}` };
    }
    case 'jobDescription': {
      if (!value) return respond('Please provide the job description.');
      try {
        const entry = [
          {
            id: `chat-job-${Date.now().toString(36)}`,
            url: '',
            text: value,
          },
        ];
        localStorage.setItem('jobDescriptions', JSON.stringify(entry));
        localStorage.setItem('jobDescription', value);
      } catch (_) {
        // ignore storage errors
      }
      setResumeFlowState((prev) => ({
        ...prev,
        data: { ...prev.data, jobDescription: value },
      }));
      return { success: true, message: `Job description updated:\n${value}` };
    }
    // 'personal', 'experience', 'projects', and 'education' cases are handled by backend LangChain agents
    default:
      return respond("I couldn't figure out which section to update.");
  }
};

const captureFirstMatch = (text, patterns) => {
  if (!text) return '';
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return normalizeCapturedValue(match[1]);
    }
  }
  return '';
};

const trimTrailingDatePhrase = (value) => {
  if (!value) return '';
  return value.replace(/\s+(?:from|since)\b.*$/i, '').trim();
};

// parseExperienceDetails, parseProjectDetails, parseEducationDetails removed - handled by backend LangChain agents

const getStoredJobDescription = () => {
  try {
    const storedListRaw = localStorage.getItem('jobDescriptions');
    if (storedListRaw) {
      const list = JSON.parse(storedListRaw);
      if (Array.isArray(list) && list.length > 0) {
        const latest = [...list].reverse().find((entry) => entry?.text && entry.text.trim());
        if (latest) {
          return latest.text.trim();
        }
      }
    }
  } catch (_) {
    // ignore parsing issues
  }
  const legacy = localStorage.getItem('jobDescription');
  return (legacy && legacy.trim()) || '';
};

const escapeHtml = (value = '') =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatMultiline = (value = '') => escapeHtml(value).replace(/\n+/g, '<br />');

const buildResumeHtml = (data = {}, jobDescription = '') => {
  const {
    name = '',
    email = '',
    phone = '',
    summary = '',
    experiences = [],
    education = [],
    projects = [],
    skills = '',
    skillsCategorized = '',
  } = data;

  const skillsSource = (skillsCategorized && skillsCategorized.trim()) || skills;

  const renderList = (items, renderer) =>
    items
      .filter((item) => item && Object.values(item).some((val) => val && `${val}`.trim()))
      .map(renderer)
      .join('');

  const experienceHtml = renderList(experiences || [], (exp) => {
    const titleLine = [exp.jobTitle, exp.company].filter(Boolean).join(' \u00b7 ');
    const datesLine = [exp.startDate, exp.endDate].filter(Boolean).join(' - ');
    return `
      <div class="item">
        ${titleLine ? `<div class="item-title">${escapeHtml(titleLine)}</div>` : ''}
        ${datesLine ? `<div class="item-dates">${escapeHtml(datesLine)}</div>` : ''}
        ${
          exp.description
            ? `<div class="item-text">${formatMultiline(exp.description)}</div>`
            : ''
        }
      </div>
    `;
  });

  const projectHtml = renderList(projects || [], (proj) => {
    return `
      <div class="item">
        ${proj.projectName ? `<div class="item-title">${escapeHtml(proj.projectName)}</div>` : ''}
        ${
          proj.technologies
            ? `<div class="item-dates">${escapeHtml(proj.technologies)}</div>`
            : ''
        }
        ${
          proj.description
            ? `<div class="item-text">${formatMultiline(proj.description)}</div>`
            : ''
        }
      </div>
    `;
  });

  const educationHtml = renderList(education || [], (ed) => {
    const degreeLine = [ed.degree, ed.field].filter(Boolean).join(' \u00b7 ');
    const schoolLine = [ed.school, ed.location].filter(Boolean).join(' \u00b7 ');
    const datesLine = [ed.startYear, ed.graduationYear].filter(Boolean).join(' - ');
    return `
      <div class="item">
        ${degreeLine ? `<div class="item-title">${escapeHtml(degreeLine)}</div>` : ''}
        ${schoolLine ? `<div class="item-dates">${escapeHtml(schoolLine)}</div>` : ''}
        ${datesLine ? `<div class="item-text">${escapeHtml(datesLine)}</div>` : ''}
      </div>
    `;
  });

  const skillsHtml = skillsSource
    ? `<div class="item-text">${formatMultiline(skillsSource)}</div>`
    : '';
  const summaryHtml = summary ? `<div class="item-text">${formatMultiline(summary)}</div>` : '';
  const jdHtml = jobDescription
    ? `<div class="item-text">${formatMultiline(jobDescription)}</div>`
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body {
          font-family: 'Inter', Arial, sans-serif;
          margin: 0;
          padding: 0;
          background: #f3f4f6;
          color: #0f172a;
        }
        .resume {
          width: 8.5in;
          min-height: 11in;
          margin: 0 auto;
          background: #fff;
          padding: 1in;
          box-sizing: border-box;
        }
        header {
          text-align: center;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 16px;
          margin-bottom: 24px;
        }
        header h1 {
          margin: 0;
          font-size: 28px;
        }
        header p {
          margin: 4px 0;
          color: #475569;
        }
        section {
          margin-bottom: 24px;
        }
        section h2 {
          font-size: 16px;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #0f172a;
        }
        .item {
          margin-bottom: 14px;
        }
        .item-title {
          font-weight: 600;
          font-size: 15px;
        }
        .item-dates {
          font-size: 13px;
          color: #475569;
        }
        .item-text {
          font-size: 14px;
          line-height: 1.5;
          color: #1e293b;
        }
      </style>
    </head>
    <body>
      <div class="resume">
        <header>
          ${name ? `<h1>${escapeHtml(name)}</h1>` : ''}
          <p>
            ${email ? escapeHtml(email) : ''}
            ${email && phone ? ' \u00b7 ' : ''}
            ${phone ? escapeHtml(phone) : ''}
          </p>
        </header>

        ${
          summaryHtml
            ? `<section><h2>Professional Summary</h2>${summaryHtml}</section>`
            : ''
        }
        ${experienceHtml ? `<section><h2>Experience</h2>${experienceHtml}</section>` : ''}
        ${projectHtml ? `<section><h2>Projects</h2>${projectHtml}</section>` : ''}
        ${educationHtml ? `<section><h2>Education</h2>${educationHtml}</section>` : ''}
        ${skillsHtml ? `<section><h2>Skills</h2>${skillsHtml}</section>` : ''}
        ${jdHtml ? `<section><h2>Target Job Description</h2>${jdHtml}</section>` : ''}
      </div>
    </body>
    </html>
  `;
};

const flattenExperienceText = (experiences = []) =>
  experiences
    .filter((exp) => exp && Object.values(exp).some((val) => val && `${val}`.trim()))
    .map((exp) => {
      const header = [exp.jobTitle, exp.company].filter(Boolean).join(' at ');
      const dates = [exp.startDate, exp.endDate].filter(Boolean).join(' - ');
      const body = exp.description || '';
      return [header, dates, body].filter(Boolean).join('\n');
    })
    .join('\n\n');

const flattenEducationText = (education = []) =>
  education
    .filter((ed) => ed && Object.values(ed).some((val) => val && `${val}`.trim()))
    .map((ed) => {
      const degree = [ed.degree, ed.field].filter(Boolean).join(' in ');
      const school = [ed.school, ed.location].filter(Boolean).join(', ');
      const dates = [ed.startYear, ed.graduationYear].filter(Boolean).join(' - ');
      return [degree, school, dates].filter(Boolean).join('\n');
    })
    .join('\n\n');

const SECTION_KEYWORDS = [
  { key: 'personal', phrases: ['personal info', 'personal details', 'contact info', 'my info', 'my contact', 'phone number', 'name and email'] },
  { key: 'summary', phrases: ['summary', 'profile overview', 'professional summary'] },
  { key: 'skills', phrases: ['skills', 'skill list', 'my skills'] },
  { key: 'experience', phrases: ['experience', 'work history', 'job history', 'my jobs'] },
  { key: 'projects', phrases: ['projects', 'project list'] },
  { key: 'education', phrases: ['education', 'degrees', 'my school'] },
  { key: 'jobDescription', phrases: ['job description', 'target role', 'target job'] },
];
const SECTION_UPDATE_PATTERNS = [
  { key: 'summary', regex: /(update|change|set)\s+(?:my\s+)?summary\s+(?:to|as|=)?\s*([\s\S]+)/i },
  { key: 'skills', regex: /(update|change|set)\s+(?:my\s+)?skills?\s+(?:to|as|=)?\s*([\s\S]+)/i },
  { key: 'jobDescription', regex: /(update|change|set)\s+(?:my\s+)?(?:job\s+description|target\s+job|target\s+role)\s+(?:to|as|=)?\s*([\s\S]+)/i },
  // 'personal' and 'experience' removed - handled by backend LangChain agents
  { key: 'projects', regex: /(update|change|set)\s+(?:my\s+)?projects?\s+(?:to|as|=)?\s*([\s\S]+)/i },
  { key: 'education', regex: /(update|change|set)\s+(?:my\s+)?education\s+(?:to|as|=)?\s*([\s\S]+)/i },
];

export default ChatWidget;

const PERSONAL_INFO_KEYWORDS = [
  'my name',
  'name is',
  'email',
  'e-mail',
  'phone',
  'number',
  'contact',
  'summary',
  'about me',
  'reach me',
];

const looksLikePersonalInfoMessage = (text = '') => {
  if (!text) return false;
  const normalized = text.toLowerCase();
  return PERSONAL_INFO_KEYWORDS.some((keyword) => normalized.includes(keyword));
};

const EXPERIENCE_KEYWORDS = [
  'experience',
  'worked at',
  'work at',
  'working at',
  'job title',
  'my role',
  'my position',
  'employer',
  'company',
  'employed',
];

const looksLikeExperienceMessage = (text = '') => {
  if (!text) return false;
  const normalized = text.toLowerCase();
  return EXPERIENCE_KEYWORDS.some((keyword) => normalized.includes(keyword));
};

const PROJECTS_KEYWORDS = [
  'project',
  'built',
  'developed',
  'created',
  'portfolio',
  'side project',
  'personal project',
  'open source',
];

const looksLikeProjectsMessage = (text = '') => {
  if (!text) return false;
  const normalized = text.toLowerCase();
  return PROJECTS_KEYWORDS.some((keyword) => normalized.includes(keyword));
};

const EDUCATION_KEYWORDS = [
  'education',
  'degree',
  'bachelor',
  'master',
  'phd',
  'university',
  'college',
  'school',
  'graduated',
  'major',
  'studied',
];

const looksLikeEducationMessage = (text = '') => {
  if (!text) return false;
  const normalized = text.toLowerCase();
  return EDUCATION_KEYWORDS.some((keyword) => normalized.includes(keyword));
};
