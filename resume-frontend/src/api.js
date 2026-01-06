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

const EXPERIMENT_USER_STORAGE_KEY = 'experimentUserId';

export const ensureExperimentUserId = () => {
  if (typeof window === 'undefined') {
    return 'server';
  }
  const existing = localStorage.getItem(EXPERIMENT_USER_STORAGE_KEY);
  if (existing && existing !== 'undefined' && existing !== 'null') {
    return existing;
  }

  const randomPart = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
  const nextId = `anon:${randomPart}`;
  localStorage.setItem(EXPERIMENT_USER_STORAGE_KEY, nextId);
  try {
    document.cookie = `ab_user_id=${nextId}; path=/; max-age=${60 * 60 * 24 * 60}`;
  } catch (err) {
    // Cookie setting can fail in strict environments; ignore silently
  }
  return nextId;
};

const getExperimentHeaders = () => ({
  'X-Experiment-User': ensureExperimentUserId(),
});

const getAuthHeaders = () => {
  const token = localStorage.getItem('resumeToken');
  const baseHeaders = {
    'Content-Type': 'application/json',
    ...getExperimentHeaders(),
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
  const mergedHeaders = {
    ...getExperimentHeaders(),
    ...(options.headers || {}),
  };
  const response = await fetch(url, {
    ...options,
    headers: mergedHeaders,
  });
  
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

export async function computeJobMatches(payload) {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/jobs/matches`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Unable to compute job matches.");
  }
  return await res.json();
}

export async function inferTemplatePreference(text) {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/template/preference`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ text }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to infer template preference.');
  }
  return data;
}

export async function getJobMatches(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.resumeHash) {
    searchParams.set('resume_hash', params.resumeHash);
  }
  if (typeof params.limit === 'number' && params.limit > 0) {
    searchParams.set('limit', params.limit.toString());
  }
  const query = searchParams.toString();
  const res = await fetchWithAuth(`${API_BASE_URL}/api/jobs/matches${query ? `?${query}` : ''}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Unable to load job matches.");
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
  const payload = data && typeof data === "object" ? (data.data || data) : {};
  return payload.optimizedExperience || "";
}

export async function generateEducationAI(education, existingEducation = null) {
  const payload = { education };

  // Include existing education if provided to enable partial updates
  if (existingEducation && typeof existingEducation === 'string' && existingEducation.trim()) {
    payload.existingEducation = existingEducation.trim();
  }

  const res = await fetchWithAuth(`${API_BASE_URL}/api/ai/education`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "AI education generation failed.");
  }
  const data = await res.json();
  return data.education;
}

export async function generateSummaryAI({ experience, education, skills, existingSummary = null }) {
  const payload = { experience, education, skills };

  // Include existing summary if provided to enable partial updates
  if (existingSummary && typeof existingSummary === 'string' && existingSummary.trim()) {
    payload.existingSummary = existingSummary.trim();
  }

  const res = await fetchWithAuth(`${API_BASE_URL}/api/ai/summary`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "AI summary generation failed.");
  }
  const data = await res.json();
  return data.summary;
}

export async function getJobById(id) {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/jobs/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || "Failed to load job");
  }
  return data;
}

// Auto-generate a comma-separated skills list from the in-progress resume data.
export async function autoGenerateSkillsAI(resumeData, jobDescription = '', existingSkills = null) {
  const payload = {
    resumeData,
    jobDescription,
  };

  // Include existing skills if provided to enable partial updates
  if (existingSkills && Array.isArray(existingSkills) && existingSkills.length > 0) {
    payload.existingSkills = existingSkills;
  }

  const res = await fetchWithAuth(`${API_BASE_URL}/api/skills/auto-generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const raw = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(raw?.error || 'AI skills extraction failed.');
  }

  const responseData = raw && typeof raw === 'object' ? raw.data || raw : {};

  if (responseData && typeof responseData.skillsText === 'string') {
    return responseData.skillsText;
  }
  if (responseData && Array.isArray(responseData.skills)) {
    return responseData.skills.join(', ');
  }

  return '';
}

// Categorize an existing skills string into labeled buckets (e.g., "Cloud: Azure, AWS").
export async function categorizeSkillsAI(skillsText, jobDescription = '') {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/skills/categorize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      skillsText,
      jobDescription,
    }),
  });

  const raw = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(raw?.error || 'AI skills categorization failed.');
  }

  const payload = raw && typeof raw === 'object' ? raw.data || raw : {};

  if (payload && typeof payload.formattedText === 'string') {
    return payload.formattedText;
  }

  return skillsText || '';
}

export async function parsePersonalDetailsAI(text, existingData = null) {
  const payload = { text };

  // Include existing data if provided to enable partial updates
  if (existingData) {
    payload.existing = {
      name: existingData.name || '',
      email: existingData.email || '',
      phone: existingData.phone || '',
      summary: existingData.summary || ''
    };
  }

  const res = await fetch(`${API_BASE_URL}/api/assistant/personal-info`, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to understand personal details.');
  }
  return data?.data || data;
}

// Job description intent (URL + text) via LangChain backend
export async function inferJobIntent(text) {
  const res = await fetch(`${API_BASE_URL}/api/assistant/job-intent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to understand job description details.');
  }
  return data;
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
  const payload = data && typeof data === "object" ? (data.data || data) : {};
  return payload.improvedExperience || "";
}

export async function optimizeProjectAI(projectData, jobDescription = '', existingProject = null) {
  const payload = {
    projectData,
    jobDescription,
  };

  // Include existing project if provided to enable partial updates
  if (existingProject && typeof existingProject === 'string' && existingProject.trim()) {
    payload.existingProject = existingProject.trim();
  }

  const res = await fetchWithAuth(`${API_BASE_URL}/api/project/optimize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const raw = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(raw?.error || 'AI project optimization failed.');
  }

  const responseData = raw && typeof raw === 'object' ? raw.data || raw : {};
  // Fall back to original text if backend returns nothing
  return responseData.optimizedProject || projectData || '';
}

export async function improveProjectGrammarAI(projectData) {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/project/improve-grammar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      projectData,
    }),
  });

  const raw = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(raw?.error || 'AI project grammar improvement failed.');
  }

  const payload = raw && typeof raw === 'object' ? raw.data || raw : {};
  return payload.improvedProject || projectData || '';
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

export async function parseExperienceAI(text, existingData = null) {
  const payload = { text };

  // Include existing experience data if provided to enable partial updates
  if (existingData && existingData.experiences) {
    payload.existing = {
      experiences: existingData.experiences
    };
  }

  const res = await fetchWithAuth(`${API_BASE_URL}/api/assistant/experience`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to parse experience with AI.');
  }

  const payload_result = data && typeof data === 'object' ? data.data || data : {};
  return payload_result;
}

// Projects parsing via LangChain backend
export async function parseProjectsAI(text, existingData = null) {
  const payload = { text };

  // Include existing projects data if provided to enable partial updates
  if (existingData && existingData.projects) {
    payload.existing = {
      projects: existingData.projects
    };
  }

  const res = await fetch(`${API_BASE_URL}/api/assistant/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to parse projects with AI.');
  }

  const payload_result = data && typeof data === 'object' ? data.data || data : {};
  return payload_result;
}

// Education parsing via LangChain backend
export async function parseEducationAI(text, existingData = null) {
  const payload = { text };

  // Include existing education data if provided to enable partial updates
  if (existingData && existingData.education) {
    payload.existing = {
      education: existingData.education
    };
  }

  const res = await fetch(`${API_BASE_URL}/api/assistant/education`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to parse education with AI.');
  }

  const payload_result = data && typeof data === 'object' ? data.data || data : {};
  return payload_result;
}

// Job description parsing via LangChain backend
export async function parseJobDescriptionAI(text, existingEntries = []) {
  const payload = { text };

  // Include existing job descriptions if provided to enable smart add/modify/remove
  if (existingEntries && existingEntries.length > 0) {
    payload.existing = existingEntries;
  }

  const res = await fetch(`${API_BASE_URL}/api/assistant/job-description`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to parse job description with AI.');
  }

  const payload_result = data && typeof data === 'object' ? data.data || data : {};
  return payload_result;
}

export async function parseSkillsAI(text, existingSkills = []) {
  const payload = { text };

  // Include existing skills if provided to enable add/remove/replace
  if (existingSkills && existingSkills.length > 0) {
    payload.existing = existingSkills;
  }

  const res = await fetch(`${API_BASE_URL}/api/assistant/skills`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to parse skills with AI.');
  }

  const payload_result = data && typeof data === 'object' ? data.data || data : {};
  return payload_result;
}

export async function generateSkillsAI(resumeData, existingSkills = []) {
  const payload = {
    existing: existingSkills,
  };

  // Extract experience, projects, and education from resumeData
  if (resumeData?.experiences) {
    payload.experience = resumeData.experiences.map(exp => ({
      jobTitle: exp.jobTitle || '',
      company: exp.company || '',
      description: exp.description || '',
      startDate: exp.startDate || '',
      endDate: exp.endDate || '',
    }));
  }

  if (resumeData?.projects) {
    payload.projects = resumeData.projects.map(proj => ({
      projectName: proj.projectName || '',
      description: proj.description || '',
      technologies: proj.technologies || '',
    }));
  }

  if (resumeData?.education) {
    payload.education = resumeData.education.map(edu => ({
      degree: edu.degree || '',
      field: edu.field || '',
      school: edu.school || '',
      graduationYear: edu.graduationYear || '',
    }));
  }

  const res = await fetch(`${API_BASE_URL}/api/assistant/skills/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to generate skills with AI.');
  }

  const payload_result = data && typeof data === 'object' ? data.data || data : {};
  return payload_result;
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

export async function uploadResumeHistoryPdf(file) {
  const formData = new FormData();
  formData.append('file', file);

  const token = localStorage.getItem('resumeToken');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}/api/resume/history/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (res.status === 401) {
    handleUnauthorized();
    throw new Error('Session expired. Please log in again.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to upload resume PDF.');
  }
  return data;
}

export async function fetchJobCount(keyword) {
  const params = new URLSearchParams();
  if (keyword) {
    params.set('keyword', keyword);
  }
  const res = await fetchWithAuth(`${API_BASE_URL}/api/analysis/job-count?${params.toString()}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to fetch job count.');
  }
  return data;
}

export async function fetchResumeHistoryList() {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/resume/history`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to fetch resume history.');
  }
  return data;
}

export async function explainJobFit(resumeData, match, options = {}) {
  const timeoutMs = typeof options.timeoutMs === 'number' && options.timeoutMs > 0 ? options.timeoutMs : 8000;
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      if (controller) {
        controller.abort();
      }
      reject(new Error('Job fit explanation timed out.'));
    }, timeoutMs);
  });

  try {
    const fetchPromise = (async () => {
      const res = await fetchWithAuth(`${API_BASE_URL}/api/jobs/explain-fit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ resumeData, match }),
        signal: controller ? controller.signal : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to explain job fit.');
      }
      const payload = data && typeof data === 'object' ? data.data || data : {};
      return {
        reasons: Array.isArray(payload.reasons) ? payload.reasons : [],
        source: typeof payload.source === 'string' ? payload.source : 'unknown',
      };
    })();

    return await Promise.race([fetchPromise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
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

// Feedback API functions
export async function sendFeedback(feedbackPayload) {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/feedback`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(feedbackPayload),
  });
  if (!res.ok) {
    let message = 'Failed to submit feedback';
    try {
      const err = await res.json();
      message = err.error || message;
    } catch (e) {
      // ignore parse error
    }
    throw new Error(message);
  }
  return true;
}

export async function scheduleFeedbackFollowUp(trigger, userEmail, metadata = {}, delayHours = 24) {
  const payload = {
    trigger,
    user_email: userEmail,
    metadata,
    delay_hours: delayHours,
  };

  const res = await fetchWithAuth(`${API_BASE_URL}/api/feedback/follow-up`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let message = 'Failed to schedule feedback follow-up';
    try {
      const err = await res.json();
      message = err.error || message;
    } catch (e) {
      // ignore parse error
    }
    throw new Error(message);
  }
  return true;
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

// Subscription & membership helpers
export async function fetchSubscriptionOverview() {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/subscription/current`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to load subscription details.');
  }
  return data;
}

export async function fetchUsageStats() {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/subscription/usage`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to load usage details.');
  }
  return data;
}

export async function fetchAvailablePlans() {
  const res = await fetch(`${API_BASE_URL}/api/plans`, {
    method: 'GET',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to load plans.');
  }
  return Array.isArray(data?.plans) ? data.plans : [];
}

export async function cancelUserSubscription() {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/subscription/cancel`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to cancel subscription.');
  }
  return data;
}

export async function changeUserSubscriptionPlan(planName) {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/subscription/change-plan`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ plan_name: planName }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to change subscription plan.');
  }
  return data;
}

export async function createCustomerPortalSession() {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/subscription/portal`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to create billing portal session.');
  }
  return data;
}

export async function createSubscriptionCheckoutSession(planName) {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/subscription/checkout`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ plan_name: planName }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to start checkout session.');
  }
  return data;
}

export async function assignExperimentVariant(experimentKey, options = {}) {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/experiments/assign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getExperimentHeaders(),
    },
    body: JSON.stringify({
      experiment_key: experimentKey,
      request_path: options.requestPath || (typeof window !== 'undefined' ? window.location.pathname : ''),
      user_id: options.userId,
      anonymous_id: options.anonymousId || ensureExperimentUserId(),
      force_reassign: !!options.forceReassign,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to assign experiment variant.');
  }
  return data;
}

export async function trackExperimentEvent(experimentKey, eventName, metadata = {}, variantKey) {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/experiments/event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getExperimentHeaders(),
    },
    body: JSON.stringify({
      experiment_key: experimentKey,
      event_name: eventName,
      variant_key: variantKey,
      metadata,
      anonymous_id: ensureExperimentUserId(),
      request_path: typeof window !== 'undefined' ? window.location.pathname : '',
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to record experiment event.');
  }
  return data;
}

export async function listExperiments() {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/admin/experiments`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to load experiments.');
  }
  return data;
}

export async function saveExperiment(experimentPayload) {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/admin/experiments`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(experimentPayload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to save experiment.');
  }
  return data;
}

export async function getExperimentMetrics(key) {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/admin/experiments/${encodeURIComponent(key)}/metrics`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to load experiment metrics.');
  }
  return data;
}

export async function deleteExperiment(key) {
  const res = await fetchWithAuth(`${API_BASE_URL}/api/admin/experiments/${encodeURIComponent(key)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to delete experiment.');
  }
  return data;
}

