import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { DEFAULT_TEMPLATE_ID, normalizeTemplateId, getTemplateMetaById } from '../constants/templates';

// Get API URL - use same logic as other files
const getAPIBaseURL = () => {
  if (typeof window !== 'undefined') {
    // Use the backend domain (non-www) for API calls
    return window.location.hostname === 'www.hihired.org' 
      ? 'https://hihired.org' 
      : window.location.origin;
  }
  // Fallback for server-side rendering
  return process.env.REACT_APP_API_URL || 'http://localhost:8081';
};

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
  summary: "",
  selectedFormat: DEFAULT_TEMPLATE_ID,
  selectedFontSize: "medium"
});

const normalizeResumeData = (resume) => {
  if (!resume || typeof resume !== 'object') {
    return createDefaultResumeData();
  }

  const normalizedFormat = normalizeTemplateId(resume.selectedFormat);
  const template = getTemplateMetaById(normalizedFormat);
  const nextFormat = template ? template.id : DEFAULT_TEMPLATE_ID;

  if (resume.selectedFormat !== nextFormat) {
    return { ...resume, selectedFormat: nextFormat };
  }

  return resume;
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
    const response = await fetch(`${API_BASE_URL}/api/user/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
    const response = await fetch(`${API_BASE_URL}/api/user/load?userEmail=${encodeURIComponent(userEmail)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
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

  // Save data to localStorage whenever it changes (but not to database)
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
    // Note: Database saving is now only done when user clicks "Download Resume"
  }, [data, user]);

  // Function to save current data to database
  const saveToDatabaseNow = async () => {
    if (user && user.email) {
      try {
        await saveToDatabase(data, user.email);
        console.log('Successfully saved resume data to database for user:', user.email);
      } catch (error) {
        console.error('Failed to save to database:', error);
        throw error;
      }
    }
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

  // Map imported structured resume JSON into our state shape
  const applyImportedData = (structured) => {
    try {
      console.log('applyImportedData called with:', structured);
      if (!structured || typeof structured !== 'object') {
        console.log('Invalid structured data, returning early');
        return;
      }
      // Start with a clean slate - only keep format and font size settings
      const mapped = {
        name: "",
        email: "",
        phone: "",
        experiences: [],
        education: [],
        projects: [],
        skills: "",
        summary: "",
        selectedFormat: normalizeTemplateId(data.selectedFormat || DEFAULT_TEMPLATE_ID),
        selectedFontSize: data.selectedFontSize || "medium"
      };
      console.log('Starting with clean data, preserving format settings');

      // Now apply the imported data
      if (structured.name) mapped.name = structured.name;
      if (structured.email) mapped.email = structured.email;
      if (structured.phone) mapped.phone = structured.phone;
      if (structured.summary) mapped.summary = structured.summary;
      if (Array.isArray(structured.skills)) {
        mapped.skills = structured.skills.join(', ');
      }

      // Only add experiences if they exist in the imported data
      if (Array.isArray(structured.experience) && structured.experience.length > 0) {
        mapped.experiences = structured.experience.map((e) => ({
          jobTitle: e.role || '',
          company: e.company || '',
          city: (e.location || '').split(',')[0] || '',
          state: (e.location || '').split(',')[1]?.trim() || '',
          startDate: e.startDate || '',
          endDate: e.endDate || '',
          currentlyWorking: (e.endDate || '').toLowerCase() === 'present',
          description: Array.isArray(e.bullets) ? e.bullets.join('\n') : (e.description || '')
        }));
      }

      // Only add education if it exists in the imported data
      if (Array.isArray(structured.education) && structured.education.length > 0) {
        mapped.education = structured.education.map((ed) => ({
          degree: ed.degree || '',
          school: ed.school || '',
          field: ed.field || '',
          startMonth: '',
          startYear: (ed.startDate || '').replace(/[^0-9-]/g, ''),
          graduationMonth: '',
          graduationYear: (ed.endDate || '').replace(/[^0-9-]/g, ''),
          gpa: '',
          honors: '',
          location: ''
        }));
      } else {
        // If no education in import, add one empty education entry (common requirement)
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

      // Only add projects if they exist in the imported data
      if (Array.isArray(structured.projects) && structured.projects.length > 0) {
        mapped.projects = structured.projects.map((proj) => ({
          projectName: proj.projectName || '',
          description: Array.isArray(proj.bullets) ? proj.bullets.join('\n') : (proj.description || ''),
          technologies: Array.isArray(proj.technologies) ? proj.technologies.join(', ') : (proj.technologies || ''),
          projectUrl: proj.projectUrl || ''
        }));
      }

      console.log('Mapped data:', mapped);
      setData(normalizeResumeData(mapped));
      console.log('Data set successfully - old data cleared, new data applied');
    } catch (e) {
      console.error('Failed to apply imported data:', e);
    }
  };

  // Load user data when user changes (login/logout)
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  return (
    <ResumeContext.Provider value={{ data, setData: updateResume, updateData: updateResume, clearData, loadUserData, saveToDatabaseNow, applyImportedData }}>
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
