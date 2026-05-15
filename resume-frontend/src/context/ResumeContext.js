import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { DEFAULT_TEMPLATE_ID, normalizeTemplateId, getTemplateMetaById } from '../constants/templates';
import { getAPIBaseURL } from '../api';

const API_BASE_URL = getAPIBaseURL();

export const ResumeContext = createContext();

const createDefaultResumeData = () => ({
  name: "",
  email: "",
  phone: "",
  experiences: [],
  education: [{
    degree: '',
    school: '',
    field: '',
    startMonth: '',
    startYear: '',
    graduationMonth: '',
    graduationYear: '',
    gpa: '',
    honors: '',
    location: ''
  }],
  projects: [{
    projectName: '',
    description: '',
    technologies: '',
    projectUrl: ''
  }],
  skills: "",
  // Optional: when present, this is the categorized/AI-structured skills string
  // that should be used for resume preview instead of the raw skills field.
  skillsCategorized: "",
  summary: "",
  // Optional: last generated letter text/type for the Cover/Recommendation step.
  coverLetterText: "",
  coverLetterType: "",
  selectedFormat: DEFAULT_TEMPLATE_ID,
  selectedFontSize: "medium",
  // Impact highlighting feature
  highlightImpact: false,
  impactKeywords: null // { experiences: { "exp-0": { description: [...], projects: { "proj-0-0": { ... } } } } }
});

const normalizeResumeData = (resume) => {
  if (!resume || typeof resume !== 'object') {
    return createDefaultResumeData();
  }

  const normalizedFormat = normalizeTemplateId(resume.selectedFormat);
  const template = getTemplateMetaById(normalizedFormat);
  const nextFormat = template ? template.id : DEFAULT_TEMPLATE_ID;

  const next = {
    ...resume,
    selectedFormat: nextFormat,
  };

  if (typeof next.skillsCategorized !== 'string') {
    next.skillsCategorized = "";
  }
  if (typeof next.coverLetterText !== 'string') {
    next.coverLetterText = "";
  }
  if (typeof next.coverLetterType !== 'string') {
    next.coverLetterType = "";
  }
  if (typeof next.highlightImpact !== 'boolean') {
    next.highlightImpact = false;
  }
  if (next.impactKeywords !== null && typeof next.impactKeywords !== 'object') {
    next.impactKeywords = null;
  }

  return next;
};

// Helper function to get data from localStorage with user-specific key
const getStoredData = (userId) => {
  try {
    const key = userId ? `resumeData_${userId}` : 'resumeData';
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return null;
  }
};

// Helper function to save data to localStorage with user-specific key
const saveToStorage = (data, userId) => {
  try {
    const key = userId ? `resumeData_${userId}` : 'resumeData';
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

// Retrieve the last known user email from storage to hydrate before AuthContext loads
const getStoredUserEmail = () => {
  if (typeof window === 'undefined') return null;

  const rawUser = localStorage.getItem('resumeUser');
  if (!rawUser || rawUser === 'undefined' || rawUser === 'null') {
    return null;
  }

  try {
    const parsed = JSON.parse(rawUser);
    if (typeof parsed === 'string') {
      return parsed;
    }
    if (parsed && typeof parsed === 'object') {
      return parsed.email || parsed.user || null;
    }
  } catch (error) {
    if (!(error instanceof SyntaxError)) {
      console.error('Error parsing stored user from localStorage:', error);
    }
  }

  // Fallback: raw value may already be an email string
  return rawUser;
};

// Helper function to clear stored data
const clearStoredData = (userId) => {
  try {
    const key = userId ? `resumeData_${userId}` : 'resumeData';
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
};

// API functions for database operations
const saveToDatabase = async (data, userEmail) => {
  try {
    const token = localStorage.getItem('resumeToken');
    const response = await fetch(`${API_BASE_URL}/api/user/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        userEmail: userEmail,
        data: data
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save to database');
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving to database:', error);
    throw error;
  }
};

const loadFromDatabase = async (userEmail) => {
  try {
    const token = localStorage.getItem('resumeToken');
    const response = await fetch(`${API_BASE_URL}/api/user/load?userEmail=${encodeURIComponent(userEmail)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // No data found
      }
      throw new Error('Failed to load from database');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error loading from database:', error);
    throw error;
  }
};

export const ResumeProvider = ({ children }) => {
  const { user } = useAuth();
  const initialUserEmailRef = useRef(getStoredUserEmail());
  const hasHydratedRef = useRef(false);
  const hydratedUserRef = useRef(initialUserEmailRef.current || null);
  
  const [data, setData] = useState(() => {
    // Initialize with stored data or default values
    const userId = (user && user.email) || initialUserEmailRef.current;
    const storedData = getStoredData(userId);
    return storedData ? normalizeResumeData(storedData) : createDefaultResumeData();
  });
  const updateResume = (updater) => {
    setData((prev) => {
      const nextState = typeof updater === 'function' ? updater(prev) : updater;
      if (!nextState || typeof nextState !== 'object') {
        return prev;
      }

      const normalizedNext = normalizeResumeData(nextState);
      if (JSON.stringify(prev) === JSON.stringify(normalizedNext)) {
        return prev;
      }

      return normalizedNext;
    });
  };

  // Save data to localStorage whenever it changes. Explicit saves below also persist to database
  // so the Chrome extension can load the same resume profile via /api/user/load.
  useEffect(() => {
    const currentUserId = user ? user.email : null;

    if (hydratedUserRef.current !== currentUserId) {
      hydratedUserRef.current = currentUserId;
      hasHydratedRef.current = false;
    }

    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
      if (currentUserId) {
        initialUserEmailRef.current = currentUserId;
      }
      return;
    }

    if (currentUserId) {
      initialUserEmailRef.current = currentUserId;
    }
    saveToStorage(data, currentUserId);
  }, [data, user]);

  const getCurrentUserEmail = () => {
    if (user) {
      if (typeof user === 'string') return user;
      if (user.email) return user.email;
    }
    return getStoredUserEmail();
  };

  const saveResumeDataToDatabase = async (resumeData = data) => {
    const userEmail = getCurrentUserEmail();
    if (!userEmail) return false;
    try {
      await saveToDatabase(resumeData, userEmail);
      console.log('Successfully saved resume data to database for user:', userEmail);
      return true;
    } catch (error) {
      console.error('Failed to save to database:', error);
      throw error;
    }
  };

  // Function to save current data to database
  const saveToDatabaseNow = async () => {
    return saveResumeDataToDatabase(data);
  };

  // Function to clear all stored data
  const clearData = () => {
    const userId = user ? user.email : null;
    clearStoredData(userId);
    setData(createDefaultResumeData());
  };

  // Function to load user data when they log in
  const loadUserData = async () => {
    if (user && user.email) {
      try {
        const databaseData = await loadFromDatabase(user.email);
        if (databaseData) {
          setData(normalizeResumeData(databaseData));
          console.log('Loaded saved resume data from database for user:', user.email);
        } else {
          // Try localStorage as fallback
          const storedData = getStoredData(user.email);
          if (storedData) {
            setData(normalizeResumeData(storedData));
            console.log('Loaded saved resume data from localStorage for user:', user.email);
          } else {
            console.log('No saved data found for user:', user.email);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        // Fallback to localStorage
        const storedData = getStoredData(user.email);
        if (storedData) {
          setData(normalizeResumeData(storedData));
          console.log('Loaded saved resume data from localStorage (fallback) for user:', user.email);
        }
      }
    }
  };

  const mapStructuredResumeData = (structured) => {
    // Start with a clean slate - only keep format and font size settings
    const mapped = {
      name: "",
      email: "",
      phone: "",
      experiences: [],
      education: [],
      projects: [],
      skills: "",
      skillsCategorized: "",
      summary: "",
      selectedFormat: normalizeTemplateId(data.selectedFormat || DEFAULT_TEMPLATE_ID),
      selectedFontSize: data.selectedFontSize || "medium"
    };

    if (structured.name) mapped.name = structured.name;
    if (structured.email) mapped.email = structured.email;
    if (structured.phone) mapped.phone = structured.phone;
    if (structured.summary) mapped.summary = structured.summary;
    if (structured.skillsCategorized) mapped.skillsCategorized = structured.skillsCategorized;
    if (Array.isArray(structured.skills)) {
      mapped.skills = structured.skills.join(', ');
    } else if (typeof structured.skills === 'string') {
      mapped.skills = structured.skills;
    }

    const sourceExperiences = Array.isArray(structured.experience)
      ? structured.experience
      : Array.isArray(structured.experiences)
        ? structured.experiences
        : [];

    if (sourceExperiences.length > 0) {
      mapped.experiences = sourceExperiences.map((e) => {
        const location = e.location || '';
        const [city = '', state = ''] = String(location).split(',').map((part) => part.trim());
        const endDate = e.endDate || e.end_date || '';
        return {
          jobTitle: e.jobTitle || e.job_title || e.role || e.title || e.position || '',
          company: e.company || '',
          city: e.city || city || '',
          state: e.state || state || '',
          startDate: e.startDate || e.start_date || '',
          endDate,
          currentlyWorking: Boolean(e.currentlyWorking || e.currently_working || e.current || String(endDate).toLowerCase() === 'present'),
          description: Array.isArray(e.bullets) ? e.bullets.join('\n') : (e.description || ''),
        };
      });
    }

    if (Array.isArray(structured.education) && structured.education.length > 0) {
      mapped.education = structured.education.map((ed) => ({
        degree: ed.degree || '',
        school: ed.school || ed.institution || ed.university || '',
        field: ed.field || ed.fieldOfStudy || ed.major || '',
        startMonth: '',
        startYear: String(ed.startDate || ed.start_date || '').replace(/[^0-9-]/g, ''),
        graduationMonth: '',
        graduationYear: String(ed.endDate || ed.end_date || ed.graduationYear || ed.year || '').replace(/[^0-9-]/g, ''),
        gpa: ed.gpa || '',
        honors: ed.honors || '',
        location: ed.location || ''
      }));
    } else {
      mapped.education = [{
        degree: '',
        school: '',
        field: '',
        startMonth: '',
        startYear: '',
        graduationMonth: '',
        graduationYear: '',
        gpa: '',
        honors: '',
        location: ''
      }];
    }

    mapped.projects = Array.isArray(structured.projects)
      ? structured.projects.map((proj) => ({
          projectName: proj.projectName || proj.name || '',
          description: Array.isArray(proj.bullets) ? proj.bullets.join('\n') : (proj.description || ''),
          technologies: Array.isArray(proj.technologies) ? proj.technologies.join(', ') : (proj.technologies || ''),
          projectUrl: proj.projectUrl || proj.url || ''
        }))
      : [];

    return normalizeResumeData(mapped);
  };

  // Map imported structured resume JSON into our state shape and immediately save it
  // for plugin/autofill reuse when the user is logged in.
  const applyImportedData = async (structured) => {
    try {
      console.log('applyImportedData called with:', structured);
      if (!structured || typeof structured !== 'object') {
        console.log('Invalid structured data, returning early');
        return null;
      }

      const mapped = mapStructuredResumeData(structured);
      console.log('Mapped data:', mapped);
      setData(mapped);
      const currentUserId = getCurrentUserEmail();
      if (currentUserId) {
        saveToStorage(mapped, currentUserId);
        await saveResumeDataToDatabase(mapped);
      }
      console.log('Data set successfully - imported resume saved for website and plugin use');
      return mapped;
    } catch (e) {
      console.error('Failed to apply imported data:', e);
      throw e;
    }
  };

  // Load user data when user changes (login/logout)
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  // Function to toggle impact highlighting
  const setHighlightImpact = (enabled) => {
    setData((prev) => ({
      ...prev,
      highlightImpact: enabled,
      // Clear cached keywords when turning off
      impactKeywords: enabled ? prev.impactKeywords : null,
    }));
  };

  // Function to set impact keywords
  const setImpactKeywords = (keywords) => {
    setData((prev) => ({
      ...prev,
      impactKeywords: keywords,
    }));
  };

  return (
    <ResumeContext.Provider value={{
      data,
      setData: updateResume,
      updateData: updateResume,
      clearData,
      loadUserData,
      saveToDatabaseNow,
      applyImportedData,
      setHighlightImpact,
      setImpactKeywords
    }}>
      {children}
    </ResumeContext.Provider>
  );
};

export const useResume = () => {
  const context = useContext(ResumeContext);
  if (!context) {
    throw new Error('useResume must be used within a ResumeProvider');
  }
  return context;
};
