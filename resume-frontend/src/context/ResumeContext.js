import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

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

const ResumeContext = createContext();

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
  
  const [data, setData] = useState(() => {
    // Initialize with stored data or default values
    const userId = user ? user.email : null;
    const storedData = getStoredData(userId);
    return storedData || {
      name: "",
      email: "",
      phone: "",
      experiences: [{
        jobTitle: '',
        company: '',
        city: '',
        state: '',
        startDate: '',
        endDate: '',
        currentlyWorking: false,
        description: ''
      }],
      education: [{
        degree: '',
        school: '',
        field: '',
        graduationYear: '',
        gpa: '',
        honors: '',
        location: ''
      }],
      skills: "",
      summary: "",
      selectedFormat: "temp1"  // Default format
    };
  });

  // Save data to localStorage whenever it changes (but not to database)
  useEffect(() => {
    const userId = user ? user.email : null;
    saveToStorage(data, userId);
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
    setData({
      name: "",
      email: "",
      phone: "",
      experiences: [{
        jobTitle: '',
        company: '',
        city: '',
        state: '',
        startDate: '',
        endDate: '',
        currentlyWorking: false,
        description: ''
      }],
      education: [{
        degree: '',
        school: '',
        field: '',
        graduationYear: '',
        gpa: '',
        honors: '',
        location: ''
      }],
      skills: "",
      summary: "",
      selectedFormat: "temp1"
    });
  };

  // Function to load user data when they log in
  const loadUserData = async () => {
    if (user && user.email) {
      try {
        const databaseData = await loadFromDatabase(user.email);
        if (databaseData) {
          setData(databaseData);
          console.log('Loaded saved resume data from database for user:', user.email);
        } else {
          // Try localStorage as fallback
          const storedData = getStoredData(user.email);
          if (storedData) {
            setData(storedData);
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
          setData(storedData);
          console.log('Loaded saved resume data from localStorage (fallback) for user:', user.email);
        }
      }
    }
  };

  // Load user data when user changes (login/logout)
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  return (
    <ResumeContext.Provider value={{ data, setData, clearData, loadUserData, saveToDatabaseNow }}>
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
