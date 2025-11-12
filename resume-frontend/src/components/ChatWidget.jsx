import React, { useMemo, useState, useCallback } from 'react';
import './ChatWidget.css';
import { getAPIBaseURL, generateSummaryAI, fetchResumeHistoryList } from '../api';
import { setLastStep } from '../utils/exitTracking';
import { useAuth } from '../context/AuthContext';
import { useResume } from '../context/ResumeContext';
import { TEMPLATE_OPTIONS } from '../constants/templates';
import { BUILDER_TARGET_STEP_KEY, BUILDER_TARGET_TEMPLATE } from '../constants/builder';
import { useNavigate } from 'react-router-dom';

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
  'template',
  'personal',
  'jobDescription',
  'experience',
  'projects',
  'education',
  'skills',
  'summary',
];

const TEMPLATE_PROMPT = TEMPLATE_OPTIONS.map((template, index) => `${index + 1}. ${template.name}`).join(', ');

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

const ChatWidget = () => {
  const { user, token } = useAuth();
  const { data: resumeData, setData: updateResume } = useResume();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isLarge, setIsLarge] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);
  const [resumeFlowState, setResumeFlowState] = useState(DEFAULT_RESUME_FLOW_STATE);
  const [awaitingJobMatchAnswer, setAwaitingJobMatchAnswer] = useState(false);
  const apiBaseUrl = useMemo(() => getAPIBaseURL(), []);
  const inputRef = React.useRef(null);

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
  const sessionId = useMemo(() => generateSessionId(), []);

  const toggleOpen = () => {
    const next = !isOpen;
    setIsOpen(next);
    setLastStep(next ? 'chat_opened' : 'chat_closed');
    if (!next) {
      setAwaitingJobMatchAnswer(false);
    }
  };

  const toggleSize = () => {
    setIsLarge((prev) => !prev);
  };

  const minimizeChat = () => {
    setIsOpen(false);
    setLastStep('chat_closed');
  };

  const handleStartNewSession = () => {
    resetChatState({ keepOpen: true });
    setIsOpen(true);
    setLastStep('chat_session_restart');
  };

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
    appendBotMessage('Let me review your latest resume from history…');
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

  const promptForStage = (stage) => {
    switch (stage) {
      case 'template':
        appendBotMessage(
          `Great! Which resume template should we use? Reply with the name or number:\n${TEMPLATE_PROMPT}\nNeed a visual? Jump straight to the Template & Format section below.`,
          {
            buttons: [
              { label: 'Jump to Template & Format', action: 'jump_template_section', variant: 'highlight' },
            ],
          }
        );
        break;
      case 'personal':
        appendBotMessage(
          "Let's capture your personal details. Please reply in this format:\nName: ...; Email: ...; Phone: ..."
        );
        break;
      case 'jobDescription':
        appendBotMessage(
          "Please paste the job description you're targeting. I'll store it so the AI can tailor your resume."
        );
        break;
      case 'experience':
        appendBotMessage(
          'Tell me about your most recent role. Format suggestion:\nTitle: ...; Company: ...; Highlights: bullet points or sentences describing your impact.'
        );
        break;
      case 'projects':
        appendBotMessage(
          "Share a key project (name, what you built, and technologies or tools). I'll add it to your resume."
        );
        break;
      case 'education':
        appendBotMessage(
          'List your education details. Example:\nDegree: B.S. Computer Science; School: UCLA; Graduation: 2023'
        );
        break;
      case 'skills':
        appendBotMessage('List your core skills separated by commas (e.g., React, Python, Product Strategy).');
        break;
      case 'summary':
        appendBotMessage(
          'Finally, share a brief summary or elevator pitch for the top of your resume (2-3 sentences).'
        );
        break;
      default:
        break;
    }
  };

  const getNextStage = (current) => {
    const index = RESUME_FLOW_SEQUENCE.indexOf(current);
    if (index === -1 || index >= RESUME_FLOW_SEQUENCE.length - 1) {
      return null;
    }
    return RESUME_FLOW_SEQUENCE[index + 1];
  };

  const advanceResumeStage = (nextStage) => {
    if (!nextStage) {
      completeResumeFlow();
      return;
    }
    setResumeFlowState((prev) => ({ ...prev, stage: nextStage }));
    promptForStage(nextStage);
  };

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

  const completeResumeFlow = () => {
    appendBotMessage(
      "Amazing! I've saved these details in your AI Builder workspace. Opening the resume builder so you can review and download."
    );
    setLastStep('chat_resume_flow_complete');
    setResumeFlowState(DEFAULT_RESUME_FLOW_STATE);
    setTimeout(() => {
      navigate('/builder');
      setIsOpen(false);
    }, 1000);
  };

  const handleTemplateStage = (text) => {
    const choice = matchTemplateChoice(text);
    if (!choice) {
      appendBotMessage('Please choose one of the templates by name or number so we can continue.');
      return;
    }

    updateResume((prev) => ({
      ...prev,
      selectedFormat: choice.id,
    }));

    setResumeFlowState((prev) => ({
      ...prev,
      data: { ...prev.data, templateId: choice.id },
    }));

    appendBotMessage(`Fantastic choice! We'll use the ${choice.name} template.`);
    advanceResumeStage(getNextStage('template'));
  };

  const handlePersonalStage = (text) => {
    const parsed = parsePersonalDetails(text);
    if (!parsed.name && !parsed.email && !parsed.phone) {
      appendBotMessage('Could you include your name, email, and phone in the reply?');
      return;
    }

    updateResume((prev) => ({
      ...prev,
      name: parsed.name || prev.name,
      email: parsed.email || prev.email,
      phone: parsed.phone || prev.phone,
    }));

    setResumeFlowState((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        personal: {
          name: parsed.name || prev.data.personal?.name || '',
          email: parsed.email || prev.data.personal?.email || '',
          phone: parsed.phone || prev.data.personal?.phone || '',
          dateOfBirth: parsed.dateOfBirth || prev.data.personal?.dateOfBirth || '',
        },
      },
    }));

    const confirmationParts = [];
    if (parsed.name) confirmationParts.push(`name (${parsed.name})`);
    if (parsed.email) confirmationParts.push(`email (${parsed.email})`);
    if (parsed.phone) confirmationParts.push(`phone (${parsed.phone})`);
    if (parsed.dateOfBirth) confirmationParts.push(`DOB (${parsed.dateOfBirth})`);

    appendBotMessage(
      confirmationParts.length > 0
        ? `Great! I captured your ${confirmationParts.join(', ')}.`
        : 'Personal details captured!'
    );
    advanceResumeStage(getNextStage('personal'));
  };

  const handleJobDescriptionStage = (text) => {
    const cleaned = text.trim();
    if (!cleaned) {
      appendBotMessage('Please paste at least a few lines from the job description.');
      return;
    }

    const entry = [
      {
        id: `chat-job-${Date.now().toString(36)}`,
        url: '',
        text: cleaned,
      },
    ];
    try {
      localStorage.setItem('jobDescriptions', JSON.stringify(entry));
      localStorage.setItem('jobDescription', cleaned);
    } catch (error) {
      console.error('Failed to persist job description from chat:', error);
    }

    setResumeFlowState((prev) => ({
      ...prev,
      data: { ...prev.data, jobDescription: cleaned },
    }));

    appendBotMessage('Got it! The job description is saved for tailoring.');
    advanceResumeStage(getNextStage('jobDescription'));
  };

  const handleExperienceStage = (text) => {
    const parsed = parseExperienceDetails(text);
    if (!parsed.jobTitle && !parsed.company && !parsed.description) {
      appendBotMessage('Please share the role, company, and a few highlights so I can add it.');
      return;
    }

    updateResume((prev) => {
      const experiences =
        Array.isArray(prev.experiences) && prev.experiences.length > 0
          ? prev.experiences.map((exp, index) =>
              index === 0 ? { ...exp, ...parsed } : exp
            )
          : [{ ...createEmptyExperience(), ...parsed }];
      return { ...prev, experiences };
    });

    setResumeFlowState((prev) => ({
      ...prev,
      data: { ...prev.data, experience: parsed },
    }));

    appendBotMessage('Experience added!');
    advanceResumeStage(getNextStage('experience'));
  };

  const handleProjectsStage = (text) => {
    const parsed = parseProjectDetails(text);
    if (!parsed.projectName && !parsed.description) {
      appendBotMessage('Please include a project name and what you built so I can add it.');
      return;
    }

    updateResume((prev) => {
      const projects =
        Array.isArray(prev.projects) && prev.projects.length > 0
          ? prev.projects.map((proj, index) =>
              index === 0 ? { ...proj, ...parsed } : proj
            )
          : [{ ...createEmptyProject(), ...parsed }];
      return { ...prev, projects };
    });

    setResumeFlowState((prev) => ({
      ...prev,
      data: { ...prev.data, projects: parsed },
    }));

    appendBotMessage('Project noted!');
    advanceResumeStage(getNextStage('projects'));
  };

  const handleEducationStage = (text) => {
    const parsed = parseEducationDetails(text);
    if (!parsed.degree && !parsed.school) {
      appendBotMessage('Please share at least the degree and school so I can add it.');
      return;
    }

    updateResume((prev) => {
      const education =
        Array.isArray(prev.education) && prev.education.length > 0
          ? prev.education.map((ed, index) =>
              index === 0 ? { ...ed, ...parsed } : ed
            )
          : [{ ...createEmptyEducation(), ...parsed }];
      return { ...prev, education };
    });

    setResumeFlowState((prev) => ({
      ...prev,
      data: { ...prev.data, education: parsed },
    }));

    appendBotMessage('Education saved!');
    advanceResumeStage(getNextStage('education'));
  };

  const handleSkillsStage = (text) => {
    const parsed = text.split(/\s*,\s*/).filter(Boolean).join(', ');
    if (!parsed) {
      appendBotMessage('List at least one skill, separated by commas.');
      return;
    }

    updateResume((prev) => ({
      ...prev,
      skills: parsed,
    }));

    setResumeFlowState((prev) => ({
      ...prev,
      data: { ...prev.data, skills: parsed },
    }));

    appendBotMessage('Skills captured.');
    advanceResumeStage(getNextStage('skills'));
  };

  const handleSummaryStage = (text) => {
    const summary = text.trim();
    if (!summary) {
      appendBotMessage('Please share a short summary so I can place it at the top of your resume.');
      return;
    }

    updateResume((prev) => ({
      ...prev,
      summary,
    }));

    setResumeFlowState((prev) => ({
      ...prev,
      data: { ...prev.data, summary },
    }));

    completeResumeFlow();
  };

  const handleResumeFlowMessage = async (userInput) => {
    const trimmed = userInput.trim();
    const lower = trimmed.toLowerCase();

    if (awaitingJobMatchAnswer) {
      if (isAffirmative(lower)) {
        setAwaitingJobMatchAnswer(false);
        appendBotMessage('Great! Opening job matches now.');
        try {
          window.localStorage.setItem('chatJobMatchesRedirect', '1');
        } catch (_) {
          // ignore storage issues
        }
        setTimeout(() => navigate('/builder'), 300);
        setLastStep('chat_jobmatch_yes');
      } else if (isNegative(lower)) {
        setAwaitingJobMatchAnswer(false);
        appendBotMessage('No problem! Let me know if you need anything else.');
        setLastStep('chat_jobmatch_no');
      } else {
        appendBotMessage('Please reply "yes" or "no" so I know whether to show job matches.');
      }
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

    const sectionKey = detectSectionRequest(trimmed);
    if (sectionKey) {
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
            advanceResumeStage('template');
          }
        } else if (isNegative(lower)) {
          appendBotMessage('All good! Ask me anything else whenever you like.');
          setResumeFlowState(DEFAULT_RESUME_FLOW_STATE);
        } else {
          appendBotMessage('Just let me know yes or no - should we create your resume here?');
        }
        return;
      case 'awaitLogin':
        if (user && token) {
          appendBotMessage("Welcome back! Let's keep going.");
          advanceResumeStage('template');
        } else {
          appendBotMessage("I still need you to finish logging in. Once you're ready, just say \"ready\".");
        }
        return;
      case 'template':
        handleTemplateStage(trimmed);
        return;
      case 'personal':
        handlePersonalStage(trimmed);
        return;
      case 'jobDescription':
        handleJobDescriptionStage(trimmed);
        return;
      case 'experience':
        handleExperienceStage(trimmed);
        return;
      case 'projects':
        handleProjectsStage(trimmed);
        return;
      case 'education':
        handleEducationStage(trimmed);
        return;
      case 'skills':
        handleSkillsStage(trimmed);
        return;
      case 'summary':
        handleSummaryStage(trimmed);
        return;
      default:
        setResumeFlowState(DEFAULT_RESUME_FLOW_STATE);
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

  const handleSubmit = async (event, overrideText = null) => {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
    const sourceText = overrideText !== null ? overrideText : input;
    const trimmed = sourceText.trim();
    if (!trimmed || isLoading) {
      return;
    }
    const normalized = trimmed.toLowerCase();

    const userMessage = { sender: 'user', text: trimmed };
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

    if (hasBackgroundAnalysisIntent(trimmed)) {
      await handleBackgroundAnalysis();
      return;
    }

    if (awaitingJobMatchAnswer) {
      const lower = trimmed.toLowerCase();
      if (isAffirmative(lower)) {
        setAwaitingJobMatchAnswer(false);
        appendBotMessage('Great! Opening job matches now.');
        try {
          window.localStorage.setItem('chatJobMatchesRedirect', '1');
        } catch (_) {
          // ignore storage issues
        }
        setTimeout(() => navigate('/builder'), 300);
        setLastStep('chat_jobmatch_yes');
      } else if (isNegative(lower)) {
        setAwaitingJobMatchAnswer(false);
        appendBotMessage('No problem! Let me know if you need anything else.');
        setLastStep('chat_jobmatch_no');
      } else {
        appendBotMessage('Please reply "yes" or "no" so I know whether to show job matches.');
      }
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

    if (hasInterviewProcessIntent(trimmed)) {
      appendBotMessage(
        "Great question! We're building an upcoming feature that shares interview insights for specific companies. Stay tuned—it's on our roadmap!"
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
    if (btn.action === 'jump_template_section') {
      jumpToTemplateSection();
      return;
    }
    if (btn.value) {
      handleSubmit(null, btn.value);
    }
  };

  const isSendDisabled = isLoading || input.trim() === '';

  return (
    <div className="chat-widget">
      {isOpen && (
        <div
          className={`chat-panel${isLarge ? ' chat-panel--large' : ''}`}
          role="dialog"
          aria-label="HiHired chat assistant"
        >
          <div className="chat-header">
            <span className="chat-title">HiHired Assistant</span>
            <div className="chat-header-actions">
              <button
                type="button"
                className="chat-header-btn"
                onClick={handleStartNewSession}
              >
                Start New Session
              </button>
              <button
                type="button"
                className="chat-header-icon"
                onClick={toggleSize}
                aria-label={isLarge ? 'Reduce chat size' : 'Enlarge chat'}
              >
                {isLarge ? '▢' : '⤢'}
              </button>
              <button
                type="button"
                className="chat-header-icon"
                onClick={minimizeChat}
                aria-label="Minimize chat"
              >
                &minus;
              </button>
            </div>
          </div>
          <div className="chat-messages">
            {messages.map((message, index) => (
              <div key={`${message.sender}-${index}`} className={`chat-message ${message.sender}`}>
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
              </div>
            ))}
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
            <button type="submit" disabled={isSendDisabled}>
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className="chat-toggle"
        onClick={toggleOpen}
        aria-label={isOpen ? 'Hide chat assistant' : 'Show chat assistant'}
      >
        <span role="img" aria-hidden="true">
          💬
        </span>
        <span className="chat-toggle-label">Chat</span>
      </button>
    </div>
  );
};

const buildDownloadPayload = (data, jobDescription, html) => ({
  name: data.name || '',
  email: data.email || '',
  phone: data.phone || '',
  summary: data.summary || '',
  experience: flattenExperienceText(data.experiences || []),
  education: flattenEducationText(data.education || []),
  jobDescription: jobDescription || '',
  location: '',
  skills: (data.skills || '')
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean),
  format: data.selectedFormat || 'classic-professional',
  engine: 'chromium-strict',
  htmlContent: html,
});

const matchTemplateChoice = (text) => {
  if (!text) return null;
  const normalized = text.toLowerCase();
  const numberMatch = normalized.match(/\b([1-3])\b/);
  if (numberMatch) {
    const index = parseInt(numberMatch[1], 10) - 1;
    return TEMPLATE_OPTIONS[index] || null;
  }

  const foundByName = TEMPLATE_OPTIONS.find((template) =>
    normalized.includes(template.name.toLowerCase())
  );
  if (foundByName) {
    return foundByName;
  }

  if (normalized.includes('classic')) {
    return TEMPLATE_OPTIONS[0];
  }
  if (normalized.includes('modern')) {
    return TEMPLATE_OPTIONS[1];
  }
  if (normalized.includes('executive') || normalized.includes('serif')) {
    return TEMPLATE_OPTIONS[2];
  }
  return null;
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

const parsePersonalDetails = (text) => {
  if (!text) {
    return { name: '', email: '', phone: '', dateOfBirth: '' };
  }
  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = text.match(/(\+?\d[\d\s().-]{7,}\d)/);
  const nameFromLabel = parseKeyValue(text, 'name');
  const naturalName = extractNameFromNaturalText(text);
  const firstSegment = text.split(/[\n;.]/)[0]?.replace(/^(hi|hello|it'?s)\s+/i, '').trim();
  const dateOfBirth = extractDateOfBirth(text);

  return {
    name: cleanCapturedName(normalizeCapturedValue(nameFromLabel || naturalName || firstSegment || '')),
    email: normalizeCapturedValue(emailMatch ? emailMatch[0] : parseKeyValue(text, 'email')),
    phone: normalizeCapturedValue(phoneMatch ? phoneMatch[0] : parseKeyValue(text, 'phone')),
    dateOfBirth,
  };
};

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
    case 'personal': {
      const parsed = parsePersonalDetails(value);
      if (!parsed.name && !parsed.email && !parsed.phone && !parsed.dateOfBirth) {
        return respond('I could not find personal details in that message.');
      }
      updateResume((prev) => ({
        ...prev,
        name: parsed.name || prev.name,
        email: parsed.email || prev.email,
        phone: parsed.phone || prev.phone,
      }));
      setResumeFlowState((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          personal: {
            name: parsed.name || prev.data.personal?.name || '',
            email: parsed.email || prev.data.personal?.email || '',
            phone: parsed.phone || prev.data.personal?.phone || '',
            dateOfBirth: parsed.dateOfBirth || prev.data.personal?.dateOfBirth || '',
          },
        },
      }));
      const confirmation = [
        parsed.name ? `Name: ${parsed.name}` : null,
        parsed.email ? `Email: ${parsed.email}` : null,
        parsed.phone ? `Phone: ${parsed.phone}` : null,
        parsed.dateOfBirth ? `Date of birth: ${parsed.dateOfBirth}` : null,
      ]
        .filter(Boolean)
        .join('\n');
      return {
        success: true,
        message: confirmation ? `Personal details updated:\n${confirmation}` : 'Personal details updated!',
      };
    }
    case 'experience': {
      const parsed = parseExperienceDetails(value);
      if (!parsed.jobTitle && !parsed.company && !parsed.description) {
        return respond('Please include job title, company, or highlights.');
      }
      updateResume((prev) => {
        const experiences =
          Array.isArray(prev.experiences) && prev.experiences.length > 0
            ? prev.experiences.map((exp, index) =>
                index === 0 ? { ...exp, ...parsed } : exp
              )
            : [{ ...createEmptyExperience(), ...parsed }];
        return { ...prev, experiences };
      });
      setResumeFlowState((prev) => ({
        ...prev,
        data: { ...prev.data, experience: parsed },
      }));
      const header = [parsed.jobTitle, parsed.company].filter(Boolean).join(' at ');
      const detail = [header, parsed.description].filter(Boolean).join('\n');
      return {
        success: true,
        message: detail ? `Experience updated:\n${detail}` : 'Experience updated!',
      };
    }
    case 'projects': {
      const parsed = parseProjectDetails(value);
      if (!parsed.projectName && !parsed.description) {
        return respond('Please include a project name or description.');
      }
      updateResume((prev) => {
        const projects =
          Array.isArray(prev.projects) && prev.projects.length > 0
            ? prev.projects.map((proj, index) =>
                index === 0 ? { ...proj, ...parsed } : proj
              )
            : [{ ...createEmptyProject(), ...parsed }];
        return { ...prev, projects };
      });
      setResumeFlowState((prev) => ({
        ...prev,
        data: { ...prev.data, projects: parsed },
      }));
      const detail = [parsed.projectName ? `Project: ${parsed.projectName}` : null, parsed.description]
        .filter(Boolean)
        .join('\n');
      return {
        success: true,
        message: detail ? `Project updated:\n${detail}` : 'Project updated!',
      };
    }
    case 'education': {
      const parsed = parseEducationDetails(value);
      if (!parsed.degree && !parsed.school) {
        return respond('Please include the degree or school name.');
      }
      updateResume((prev) => {
        const education =
          Array.isArray(prev.education) && prev.education.length > 0
            ? prev.education.map((ed, index) =>
                index === 0 ? { ...ed, ...parsed } : ed
              )
            : [{ ...createEmptyEducation(), ...parsed }];
        return { ...prev, education };
      });
      setResumeFlowState((prev) => ({
        ...prev,
        data: { ...prev.data, education: parsed },
      }));
      const detail = [
        parsed.degree ? `Degree: ${parsed.degree}` : null,
        parsed.field ? `Field: ${parsed.field}` : null,
        parsed.school ? `School: ${parsed.school}` : null,
        parsed.graduationYear ? `Year: ${parsed.graduationYear}` : null,
      ]
        .filter(Boolean)
        .join('\n');
      return {
        success: true,
        message: detail ? `Education updated:\n${detail}` : 'Education updated!',
      };
    }
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

const parseExperienceDetails = (text) => {
  if (!text) return createEmptyExperience();
  const jobTitle =
    parseKeyValue(text, 'title') ||
    parseKeyValue(text, 'role') ||
    captureFirstMatch(text, [
      /\b(?:as|as a|worked as|serving as|role of|position of)\s+([^.,\n]+?)(?:\s+at|\s+for|\s+with|$)/i,
      /\b(?:i work|i worked|current role is)\s+as\s+([^.,\n]+)/i,
    ]);

  const company =
    parseKeyValue(text, 'company') ||
    captureFirstMatch(text, [
      /\b(?:at|for|with)\s+([A-Za-z0-9&.,\-\s]+?)(?:\s+as|\s+since|\s+from|$)/i,
    ]);

  const descriptionLabel =
    parseKeyValue(text, 'highlights') ||
    parseKeyValue(text, 'impact') ||
    parseKeyValue(text, 'responsibilities');

  const lines = text.split(/\n|\. /).map((line) => line.trim());
  const fallbackDescription = lines.slice(1).join('\n').trim();

  return {
    ...createEmptyExperience(),
    jobTitle: trimTrailingDatePhrase(jobTitle) || trimTrailingDatePhrase(lines[0]) || '',
    company,
    description: descriptionLabel || fallbackDescription || text,
  };
};

const parseProjectDetails = (text) => {
  if (!text) return createEmptyProject();
  const projectName =
    parseKeyValue(text, 'project') ||
    parseKeyValue(text, 'name') ||
    captureFirstMatch(text, [
      /\bproject(?: called| named)?\s+([^.,\n]+)/i,
      /\bbuilt\s+([^.,\n]+)/i,
    ]);

  const technologies =
    parseKeyValue(text, 'tech') ||
    parseKeyValue(text, 'stack') ||
    captureFirstMatch(text, [/\busing\s+([^.,\n]+)/i, /\bwith\s+([^.,\n]+)/i]);

  const url = parseKeyValue(text, 'url') || parseKeyValue(text, 'link');
  const description =
    parseKeyValue(text, 'description') || text.replace(projectName || '', '').trim();

  return {
    ...createEmptyProject(),
    projectName: projectName || 'Key Project',
    description: description || text,
    technologies,
    projectUrl: url,
  };
};

const parseEducationDetails = (text) => {
  if (!text) return createEmptyEducation();
  const degree =
    parseKeyValue(text, 'degree') ||
    captureFirstMatch(text, [
      /\b(bachelor|master|associate|ph\.?d\.?|mba)\b[^.,\n]*/i,
    ]);
  const school =
    parseKeyValue(text, 'school') ||
    parseKeyValue(text, 'university') ||
    captureFirstMatch(text, [/\bat\s+([A-Za-z0-9&.,\-\s]+?)(?:\s+in|\s+major|\s+graduated|$)/i]);
  const field =
    parseKeyValue(text, 'field') ||
    parseKeyValue(text, 'major') ||
    captureFirstMatch(text, [/\bmajor(?:ed)?\s+in\s+([^.,\n]+)/i]);
  const graduationYearMatch = text.match(/\b(20\d{2}|19\d{2})\b/);
  return {
    ...createEmptyEducation(),
    degree: degree || text,
    school,
    field,
    graduationYear: graduationYearMatch ? graduationYearMatch[0] : '',
  };
};

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
  } = data;

  const renderList = (items, renderer) =>
    items
      .filter((item) => item && Object.values(item).some((val) => val && `${val}`.trim()))
      .map(renderer)
      .join('');

  const experienceHtml = renderList(experiences || [], (exp) => {
    const titleLine = [exp.jobTitle, exp.company].filter(Boolean).join(' · ');
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
    const degreeLine = [ed.degree, ed.field].filter(Boolean).join(' · ');
    const schoolLine = [ed.school, ed.location].filter(Boolean).join(' · ');
    const datesLine = [ed.startYear, ed.graduationYear].filter(Boolean).join(' - ');
    return `
      <div class="item">
        ${degreeLine ? `<div class="item-title">${escapeHtml(degreeLine)}</div>` : ''}
        ${schoolLine ? `<div class="item-dates">${escapeHtml(schoolLine)}</div>` : ''}
        ${datesLine ? `<div class="item-text">${escapeHtml(datesLine)}</div>` : ''}
      </div>
    `;
  });

  const skillsHtml = skills
    ? `<div class="item-text">${formatMultiline(skills)}</div>`
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
            ${email && phone ? ' · ' : ''}
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
  { key: 'personal', regex: /(update|change|set)\s+(?:my\s+)?(?:personal\s+details?|contact\s+info|name|email|phone|phone number|date of birth)\s+(?:to|as|=)?\s*([\s\S]+)/i },
  { key: 'experience', regex: /(update|change|set)\s+(?:my\s+)?experience\s+(?:to|as|=)?\s*([\s\S]+)/i },
  { key: 'projects', regex: /(update|change|set)\s+(?:my\s+)?projects?\s+(?:to|as|=)?\s*([\s\S]+)/i },
  { key: 'education', regex: /(update|change|set)\s+(?:my\s+)?education\s+(?:to|as|=)?\s*([\s\S]+)/i },
];

export default ChatWidget;
