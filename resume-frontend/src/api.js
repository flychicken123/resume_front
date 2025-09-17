// src/api.js

// Get API base URL
// - In local dev, call backend directly on :8081
// - In production, use same-origin to avoid CORS
const getAPIBaseURL = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:8081';
    }
    // Same-origin for all deployed hosts (www and apex)
    return window.location.origin;
  }
  // Fallback for SSR/build-time
  return process.env.REACT_APP_API_URL || 'http://localhost:8081';
};

const API_BASE_URL = getAPIBaseURL();

// Export the function so other files can use it
export { getAPIBaseURL };

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

// Helper function to handle 401 responses
const handleUnauthorized = () => {
  console.log('Session expired - logging out user');
  localStorage.removeItem('resumeUser');
  localStorage.removeItem('resumeToken');
  window.location.href = '/login';
};

// Helper function to make fetch requests with automatic 401 handling
const fetchWithAuth = async (url, options = {}) => {
  const response = await fetch(url, options);
  
  // Check for 401 Unauthorized
  if (response.status === 401) {
    handleUnauthorized();
    throw new Error('Session expired. Please log in again.');
  }
  
  return response;
};

export async function generateResume(data) {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/resume/generate`, {
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
  const res = await fetchWithAuth(`${API_BASE_URL}/api/experience/optimize`, {
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
  const res = await fetchWithAuth(`${API_BASE_URL}/api/ai/education`, {
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
  const res = await fetchWithAuth(`${API_BASE_URL}/api/ai/summary`, {
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
  const res = await fetchWithAuth(`${API_BASE_URL}/api/experience/improve-grammar`, {
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

export async function optimizeProjectAI(projectData, jobDescription = '') {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/project/optimize`, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      projectData: projectData,
      jobDescription: jobDescription
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "AI project optimization failed.");
  }
  const data = await res.json();
  return data.optimizedProject;
}

export async function improveProjectGrammarAI(projectData) {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/project/improve-grammar`, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      projectData: projectData
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "AI project grammar improvement failed.");
  }
  const data = await res.json();
  return data.improvedProject;
}

export async function improveSummaryGrammarAI(summary) {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/summary/improve-grammar`, {
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
  const res = await fetchWithAuth(`${API_BASE_URL}/api/resume/analyze-advice`, {
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
  const res = await fetchWithAuth(`${API_BASE_URL}/api/cover-letter/generate`, {
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

  const res = await fetchWithAuth(`${API_BASE_URL}/api/resume/parse`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) {
    throw new Error('Failed to parse resume');
  }
  return await res.json();
}

// Job Application API functions
export async function submitJobApplication(applicationData) {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/job/apply`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(applicationData),
  });
  if (!res.ok) {
    const err = await res.json();
    // For missing profile info (412 status), throw with the full error object
    if (res.status === 412 && err.error === 'missing_job_profile_info') {
      const missingFieldsError = new Error('missing_job_profile_info');
      missingFieldsError.missingFields = err.missing_fields;
      missingFieldsError.status = 412;
      throw missingFieldsError;
    }
    throw new Error(err.error || 'Failed to submit job application');
  }
  return await res.json();
}

export async function getUserRecentResumes() {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/job/recent-resumes`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch recent resumes');
  }
  return await res.json();
}

export async function getUserJobApplications(limit = 20, offset = 0) {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/job/applications?limit=${limit}&offset=${offset}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch job applications');
  }
  return await res.json();
}

export async function getJobApplication(applicationId) {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/job/applications/${applicationId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch job application');
  }
  return await res.json();
}

export async function updateJobApplicationStatus(applicationId, status) {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/job/applications/${applicationId}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update job application status');
  }
  return await res.json();
}

export async function deleteJobApplication(applicationId) {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/job/applications/${applicationId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete job application');
  }
  return await res.json();
}

// Job Automation API functions
export async function saveUserPreferences(jobSiteDomain, preferences) {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/job/preferences`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      job_site_domain: jobSiteDomain,
      preferences: preferences
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to save preferences');
  }
  return await res.json();
}

export async function getUserPreferences(domain) {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/job/preferences?domain=${encodeURIComponent(domain)}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch preferences');
  }
  return await res.json();
}

export async function getAutomationStatus(applicationId) {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/job/applications/${applicationId}/automation`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch automation status');
  }
  return await res.json();
}

export async function retryAutomation(applicationId, preferences = {}) {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/job/applications/${applicationId}/retry`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      preferences: preferences
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to retry automation');
  }
  return await res.json();
}

// Job Profile API functions
export async function getJobProfile() {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/job/profile`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch job profile');
  }
  return await res.json();
}

export async function saveJobProfile(profileData) {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/job/profile`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(profileData),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to save job profile');
  }
  return await res.json();
}
