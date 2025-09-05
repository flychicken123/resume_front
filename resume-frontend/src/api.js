// src/api.js

// Get API URL - use same logic as App.jsx to prevent double /api
const getAPIBaseURL = () => {
  if (typeof window !== 'undefined') {
    // Use the backend domain (non-www) for API calls
    if (window.location.hostname === 'www.hihired.org') {
      return 'https://hihired.org';
    } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      // For local development, use backend port 8081
      return 'http://localhost:8081';
    } else {
      return window.location.origin;
    }
  }
  // Fallback for server-side rendering
  return process.env.REACT_APP_API_URL || 'http://localhost:8081';
};

const API_BASE_URL = getAPIBaseURL();

const getAuthHeaders = () => {
  const token = localStorage.getItem('resumeToken');
  const baseHeaders = {
    'Content-Type': 'application/json'
  };
  
  if (!token) return baseHeaders;
  return {
    ...baseHeaders,
    'Authorization': `Bearer ${token}`
  };
};

export async function generateResume(data) {
  const res = await fetch(`${API_BASE_URL}/api/resume/generate`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Resume generation failed.");
  }
  return await res.json();
}

// AI assistant endpoints
export async function generateExperienceAI(experience, jobDescription = '') {
  const res = await fetch(`${API_BASE_URL}/api/experience/optimize`, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      userExperience: experience,
      jobDescription: jobDescription 
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "AI experience optimization failed.");
  }
  const data = await res.json();
  return data.optimizedExperience;
}

export async function generateEducationAI(education) {
  const res = await fetch(`${API_BASE_URL}/api/ai/education`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ education }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "AI education generation failed.");
  }
  const data = await res.json();
  return data.education;
}

export async function generateSummaryAI({ experience, education, skills }) {
  const res = await fetch(`${API_BASE_URL}/api/ai/summary`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ experience, education, skills }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "AI summary generation failed.");
  }
  const data = await res.json();
  return data.summary;
}

// AI Grammar/Refactor functions - always available
export async function improveExperienceGrammarAI(experience) {
  const res = await fetch(`${API_BASE_URL}/api/experience/improve-grammar`, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      userExperience: experience
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "AI grammar improvement failed.");
  }
  const data = await res.json();
  return data.improvedExperience;
}

export async function improveSummaryGrammarAI(summary) {
  const res = await fetch(`${API_BASE_URL}/api/summary/improve-grammar`, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      summary: summary
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "AI grammar improvement failed.");
  }
  const data = await res.json();
  return data.improvedSummary;
}

// Final step AI functions
export async function generateResumeAdviceAI(resumeData, jobDescription = '') {
  const res = await fetch(`${API_BASE_URL}/api/resume/analyze-advice`, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      resumeData: resumeData,
      jobDescription: jobDescription
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "AI resume analysis failed.");
  }
  const data = await res.json();
  return data.advice;
}

export async function generateCoverLetterAI(resumeData, jobDescription = '', companyName = '') {
  const res = await fetch(`${API_BASE_URL}/api/cover-letter/generate`, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      resumeData: resumeData,
      jobDescription: jobDescription,
      companyName: companyName
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "AI cover letter generation failed.");
  }
  const data = await res.json();
  return data.coverLetter;
}

// LinkedIn endpoints
export async function fetchLinkedInResume(linkedinToken) {
  const res = await fetch(`${API_BASE_URL}/api/linkedin/resume`, {
    method: "GET",
    headers: {
      ...getAuthHeaders(),
      'X-LinkedIn-Token': linkedinToken
    },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to fetch LinkedIn resume data.");
  }
  return await res.json();
}

export async function parseResumeFile(file) {
  const formData = new FormData();
  formData.append('resume', file);

  const token = localStorage.getItem('resumeToken');
  const headers = {
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}/api/resume/parse`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) {
    throw new Error('Failed to parse resume');
  }
  return await res.json();
}
