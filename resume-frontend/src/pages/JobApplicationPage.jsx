import React, { useState, useEffect } from 'react';
import { submitJobApplication, getUserJobApplications, getUserRecentResumes, getAPIBaseURL } from '../api';
import { useAuth } from '../context/AuthContext';
import AutomationModal from '../components/AutomationModal';
import JobProfileSetup from '../components/JobProfileSetup';
import './JobApplicationPage.css';

const JobApplicationPage = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    resume_id: '',
    job_url: ''
  });
  const [applications, setApplications] = useState([]);
  const [recentResumes, setRecentResumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAutomationModal, setShowAutomationModal] = useState(false);
  const [automationResult, setAutomationResult] = useState(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  const [pendingApplication, setPendingApplication] = useState(null);
  const [showUnknownFieldsModal, setShowUnknownFieldsModal] = useState(false);
  const [unknownFields, setUnknownFields] = useState([]);
  const [unknownFieldAnswers, setUnknownFieldAnswers] = useState({});
  const [currentApplicationId, setCurrentApplicationId] = useState(null);

  useEffect(() => {
    if (user) {
      fetchApplications();
      fetchRecentResumes();
    }
  }, [user]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await getUserJobApplications();
      setApplications(response.applications || []);
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentResumes = async () => {
    try {
      const response = await getUserRecentResumes();
      setRecentResumes(response.resumes || []);
    } catch (err) {
      console.error('Error fetching recent resumes:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!formData.job_url || !formData.resume_id) {
      setError('Job URL and Resume selection are required');
      return;
    }

    try {
      setSubmitting(true);
      const response = await submitJobApplication({
        ...formData,
        resume_id: parseInt(formData.resume_id)
      });
      
      // Check for missing fields first
      if (response.status === 'missing_fields' && response.missing_fields) {
        console.log('Missing fields detected:', response.missing_fields);
        
        // Extract field names and options
        const fieldsList = response.missing_fields.map(field => field.question || field.fieldName);
        
        // Store the full field info with options
        const fieldsWithOptions = {};
        response.missing_fields.forEach(field => {
          fieldsWithOptions[field.question || field.fieldName] = field.options || [];
        });
        
        setUnknownFields(fieldsList);
        setShowUnknownFieldsModal(true);
        setCurrentApplicationId(response.application?.application_code || response.application_code);
        setError('The application requires additional information. Please provide answers for the fields.');
        
        // Store the options for use in the modal
        window.missingFieldOptions = fieldsWithOptions;
        
      } else if (response.automation_result) {
        setAutomationResult(response.automation_result);
        if (response.automation_result.status === 'success' || response.automation_result.status === 'submitted') {
          // Successfully submitted - don't show modal, just success message
          setSuccess('✅ Application submitted successfully!');
        } else if (response.automation_result.status === 'user_input_required') {
          // Extract unknown fields from the message
          const message = response.automation_result.message || '';
          console.log('Full automation result:', response.automation_result);
          console.log('Full message:', message);
          
          // Look for the list in square brackets - might not be at the end
          const fieldsMatch = message.match(/\[(.*?)\]/);
          const fieldsString = fieldsMatch ? fieldsMatch[1] : '';
          console.log('Fields match:', fieldsMatch);
          console.log('Fields string:', fieldsString);
          
          // Parse fields - they're pipe-separated for clarity
          let unknownFieldsList = [];
          if (fieldsString) {
            // Check if fields are pipe-separated (new format)
            if (fieldsString.includes(' | ')) {
              unknownFieldsList = fieldsString
                .split(' | ')
                .map(f => f.trim())
                .filter(f => f && f.length > 2);
            } else {
              // Fallback to space-separated parsing for old format
              const parts = fieldsString.split(' ');
              let currentQuestion = '';
              
              for (let part of parts) {
                // Skip empty parts and "Enter manually"
                if (!part || part === 'Enter' || part === 'manually') {
                  continue;
                }
                
                // If this part ends with ? or *, it's likely the end of a question
                if (part.endsWith('?') || part.endsWith('*')) {
                  currentQuestion += (currentQuestion ? ' ' : '') + part;
                  unknownFieldsList.push(currentQuestion);
                  currentQuestion = '';
                } else {
                  // Build up the current question
                  currentQuestion += (currentQuestion ? ' ' : '') + part;
                }
              }
              
              // Add any remaining question
              if (currentQuestion && currentQuestion !== 'Enter manually') {
                unknownFieldsList.push(currentQuestion);
              }
            }
            
            // Final filter to remove any invalid entries
            unknownFieldsList = unknownFieldsList.filter(q => 
              q && q !== 'Enter manually' && q !== 'US' && q.length > 2
            );
          }
          
          // If no fields found, try to extract from the message directly
          if (unknownFieldsList.length === 0) {
            // Look for questions ending with ?
            const questionMatches = message.match(/([^.!]+\?)/g);
            if (questionMatches) {
              unknownFieldsList = questionMatches.map(q => q.trim());
            }
          }
          
          console.log('Unknown fields parsed:', unknownFieldsList);
          
          setUnknownFields(unknownFieldsList);
          setShowUnknownFieldsModal(true);
          // The application object is nested in the response - use application_code
          const appCode = response.application?.application_code || response.application_code;
          console.log('Setting application code:', appCode, 'from response:', response);
          setCurrentApplicationId(appCode);
          
          if (unknownFieldsList.length > 0) {
            setError('The application requires additional information. Please provide answers for the unknown fields.');
          } else {
            setError('The application requires additional information but we could not parse the fields. Check the console for details.');
          }
        } else if (response.automation_result.status === 'failed') {
          // Failed - just show error message, no modal
          setError('Application could not be submitted automatically. Please try applying manually on the company website.');
        } else {
          setSuccess('Job application submitted successfully!');
        }
      } else {
        setSuccess('Job application submitted successfully!');
      }
      
      setFormData({
        resume_id: '',
        job_url: ''
      });
      
      // Refresh applications list
      await fetchApplications();
    } catch (err) {
      // Check if this is a missing profile error
      if (err.message === 'missing_job_profile_info' && err.status === 412) {
        setMissingFields(err.missingFields || ['linkedin_url', 'work_authorization']);
        setPendingApplication({ ...formData, resume_id: parseInt(formData.resume_id) });
        setShowProfileSetup(true);
        setError('');
        return;
      }
      setError(err.message || 'Failed to submit job application');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleSubmitUnknownFields = async () => {
    // Close the modal immediately to show user action is being processed
    setShowUnknownFieldsModal(false);
    
    // Show a loading message
    setSuccess('⏳ Submitting your answers and completing the application...');
    setError('');
    
    try {
      // Call API to save the unknown field answers and retry automation
      const response = await fetch(`${getAPIBaseURL()}/api/job/continue/${currentApplicationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('resumeToken')}`
        },
        body: JSON.stringify({
          extra_qa: unknownFieldAnswers
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit answers');
      }
      
      const result = await response.json();
      
      // Reset state
      setUnknownFields([]);
      setUnknownFieldAnswers({});
      
      // Handle the result
      if (result.success) {
        // Successfully submitted - just show success message
        setSuccess('✅ Application completed successfully!');
        setError('');
        // Don't show automation modal for successful submissions
      } else if (result.automation_result && result.automation_result.status === 'user_input_required') {
        // More fields needed - reopen modal with new fields
        const message = result.automation_result.message || '';
        const fieldsMatch = message.match(/\[(.*?)\]/);
        const fieldsString = fieldsMatch ? fieldsMatch[1] : '';
        
        let newUnknownFields = [];
        if (fieldsString) {
          if (fieldsString.includes(' | ')) {
            newUnknownFields = fieldsString
              .split(' | ')
              .map(f => f.trim())
              .filter(f => f && f.length > 2);
          } else {
            newUnknownFields = fieldsString.split(',').map(f => f.trim()).filter(f => f);
          }
        }
        
        if (newUnknownFields.length > 0) {
          // More fields needed - reopen modal with new fields
          setUnknownFields(newUnknownFields);
          setUnknownFieldAnswers({});
          setShowUnknownFieldsModal(true);
          setError('Additional information required - please provide answers for the new fields');
        } else {
          // Failed but no new fields
          setError(result.message || 'Failed to complete application');
          setSuccess('');
        }
      } else {
        // Failed - show error message only, no automation modal
        setError(result.message || 'Application could not be completed');
        setSuccess('');
      }
      
      // Refresh applications list
      await fetchApplications();
    } catch (err) {
      setError('Failed to submit answers: ' + err.message);
      setSuccess('');
    }
  };

  const handleRetrySuccess = (result) => {
    setAutomationResult(result);
    if (result.automation_result.status === 'ready_for_automation') {
      setSuccess('Automation is now ready! Your preferences have been saved.');
    } else if (result.automation_result.status === 'requires_input') {
      setError('Still missing some required information. Please try again.');
    }
    // Refresh applications list
    fetchApplications();
  };

  const handleProfileSaveSuccess = async () => {
    setShowProfileSetup(false);
    setSuccess('Job profile saved successfully! Now submitting your application...');
    
    // If we have a pending application, submit it now
    if (pendingApplication) {
      try {
        setSubmitting(true);
        const response = await submitJobApplication(pendingApplication);
        
        // Handle the response same as in normal submit
        if (response.automation_result) {
          setAutomationResult(response.automation_result);
          if (response.automation_result.status === 'success' || response.automation_result.status === 'submitted') {
            setSuccess('✅ Application submitted successfully!');
          } else if (response.automation_result.status === 'failed') {
            setError('Application could not be submitted automatically. Please try applying manually on the company website.');
          } else {
            setSuccess('Job application submitted successfully!');
          }
        } else {
          setSuccess('Job application submitted successfully!');
        }
        
        // Clear form and refresh
        setFormData({ resume_id: '', job_url: '' });
        setPendingApplication(null);
        await fetchApplications();
      } catch (err) {
        setError(err.message || 'Failed to submit job application after profile setup');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleProfileSetupCancel = () => {
    setShowProfileSetup(false);
    setPendingApplication(null);
    setMissingFields([]);
    setError('Job application cancelled. Please complete your profile to apply for jobs.');
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'submitted': 'bg-blue-100 text-blue-800',
      'under_review': 'bg-yellow-100 text-yellow-800',
      'interview': 'bg-purple-100 text-purple-800',
      'accepted': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  if (!user) {
    return (
      <div className="job-application-page">
        <div className="container">
          <div className="text-center">
            <h2>Please log in to apply for jobs</h2>
            <p>You need to be logged in to use the job application feature.</p>
          </div>
        </div>
      </div>
    );
  }

  // Show profile setup modal if needed
  if (showProfileSetup) {
    return (
      <div className="job-application-page">
        <div className="container">
          <JobProfileSetup
            missingFields={missingFields}
            onSave={handleProfileSaveSuccess}
            onCancel={handleProfileSetupCancel}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="job-application-page">
      <div className="container">
        <div className="page-header">
          <button 
            className="btn btn-secondary back-button" 
            onClick={() => window.history.back()}
          >
            ← Back
          </button>
          <h1>🚀 One-Click Job Application</h1>
        </div>
        <p className="page-description">
          Simply paste a job URL and select your resume - we'll automatically fill and submit your application using your resume data!
        </p>
        
        {/* Application Form */}
        <div className="application-form-section">
          <h2>Submit Application</h2>
          
          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}
          
          {success && (
            <div className="alert alert-success">
              {success}
            </div>
          )}
          
          {recentResumes.length === 0 ? (
            <div className="no-resumes-message">
              <div className="alert alert-info">
                <h3>📋 No Resumes Found</h3>
                <p>You need to create at least one resume before you can apply for jobs.</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => window.location.href = '/resume-builder'}
                >
                  Create Your Resume First
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="application-form">
              <div className="form-group full-width">
                <label htmlFor="job_url">Job URL *</label>
                <input
                  type="url"
                  id="job_url"
                  name="job_url"
                  value={formData.job_url}
                  onChange={handleChange}
                  placeholder="https://example.com/job-posting"
                  required
                  className="large-input"
                />
                <small className="form-hint">
                  Paste the job posting URL - we'll extract company and position details automatically
                </small>
              </div>
              
              <div className="form-group full-width">
                <label htmlFor="resume_id">Select Resume *</label>
                <select
                  id="resume_id"
                  name="resume_id"
                  value={formData.resume_id}
                  onChange={handleChange}
                  required
                  className="large-select"
                >
                  <option value="">Select your resume...</option>
                  {recentResumes.map((resume) => (
                    <option key={resume.id} value={resume.id}>
                      {resume.name} (Updated: {resume.updated_at})
                    </option>
                  ))}
                </select>
                <small className="form-hint">
                  Choose from your 3 most recent resumes
                </small>
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Applying...' : '🚀 Apply with One Click'}
              </button>
            </form>
          )}
        </div>
        
        {/* Applications History */}
        <div className="applications-history-section">
          <h2>Your Application History</h2>
          
          {loading ? (
            <div className="loading">Loading applications...</div>
          ) : applications.length === 0 ? (
            <div className="empty-state">
              <p>No job applications yet. Submit your first application above!</p>
            </div>
          ) : (
            <div className="applications-list">
              {applications.map((app) => (
                <div key={app.id} className="application-card">
                  <div className="application-header">
                    <div className="application-info">
                      <h3>{app.position_title || 'Position Not Specified'}</h3>
                      <p className="company-name">{app.company_name || 'Company Not Specified'}</p>
                    </div>
                    <div className="application-status">
                      {getStatusBadge(app.application_status)}
                    </div>
                  </div>
                  
                  <div className="application-details">
                    <p className="job-url">
                      <strong>Job URL:</strong> 
                      <a href={app.job_url} target="_blank" rel="noopener noreferrer">
                        {app.job_url}
                      </a>
                    </p>
                    
                    {app.notes && (
                      <p className="notes">
                        <strong>Notes:</strong> {app.notes}
                      </p>
                    )}
                    
                    {/* Screenshots Section */}
                    {app.application_screenshot_url && (
                      <div className="screenshots-section">
                        {app.showScreenshot ? (
                          <img 
                            src={app.application_screenshot_url} 
                            alt="Application form screenshot" 
                            className="screenshot-img"
                            onClick={() => window.open(app.application_screenshot_url, '_blank')}
                          />
                        ) : (
                          <button 
                            className="load-screenshot-btn"
                            onClick={() => {
                              const updatedApps = applications.map(a => 
                                a.id === app.id ? {...a, showScreenshot: true} : a
                              );
                              setApplications(updatedApps);
                            }}
                          >
                            Application Screenshot
                          </button>
                        )}
                      </div>
                    )}
                    
                    <div className="application-meta">
                      <span>Applied: {formatDate(app.applied_at)}</span>
                      <span>Resume ID: {app.resume_id}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Automation Modal */}
        <AutomationModal
          isOpen={showAutomationModal}
          onClose={() => setShowAutomationModal(false)}
          automationResult={automationResult}
          onRetrySuccess={handleRetrySuccess}
        />
        
        {/* Unknown Fields Modal */}
        {showUnknownFieldsModal && (
          <div className="modal-overlay">
            <div className="modal-content unknown-fields-modal">
              <h2>Additional Information Required</h2>
              <p className="modal-description">
                The job application form has some questions we haven't seen before. 
                Please provide answers for the following fields:
              </p>
              
              <div className="unknown-fields-form">
                {unknownFields.map((field, index) => {
                  // Clean up the field text
                  const cleanField = field.replace(/\s*\|\s*/g, '').trim();
                  const fieldLower = cleanField.toLowerCase();
                  
                  // Skip if this is clearly not a real question
                  if (fieldLower === 'enter manually' || 
                      fieldLower === 'autofill with greenhouse' ||
                      fieldLower === 'apply for this job' ||
                      cleanField.length < 5) {
                    return null;
                  }
                  
                  // Get options from backend if available
                  const fieldOptions = window.missingFieldOptions && window.missingFieldOptions[cleanField] 
                    ? window.missingFieldOptions[cleanField] 
                    : [];
                  
                  // Determine if this is a field with predefined options (fallback for when no options from backend)
                  const isTransgender = fieldLower.includes('transgender');
                  const isSexualOrientation = fieldLower.includes('sexual orientation');
                  const isDisability = fieldLower.includes('disability') || fieldLower.includes('chronic');
                  const isVeteran = fieldLower.includes('veteran');
                  const isDegree = fieldLower.includes('degree');
                  
                  return (
                    <div key={index} className="unknown-field-item">
                      <label>{cleanField || `Question ${index + 1}`}</label>
                      
                      {/* Use options from backend if available */}
                      {fieldOptions.length > 0 ? (
                        <select
                          value={unknownFieldAnswers[cleanField] || ''}
                          onChange={(e) => setUnknownFieldAnswers({
                            ...unknownFieldAnswers,
                            [cleanField]: e.target.value
                          })}
                        >
                          <option value="">Select an option...</option>
                          {fieldOptions.map((option, optIndex) => (
                            <option key={optIndex} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : (
                      /* Fallback to hardcoded options or text input */
                      <>
                      {/* Transgender question */}
                      {isTransgender && (
                        <select
                          value={unknownFieldAnswers[cleanField] || ''}
                          onChange={(e) => setUnknownFieldAnswers({
                            ...unknownFieldAnswers,
                            [cleanField]: e.target.value
                          })}
                        >
                          <option value="">Select an answer...</option>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                          <option value="Prefer not to answer">Prefer not to answer</option>
                        </select>
                      )}
                      
                      {/* Sexual orientation question */}
                      {isSexualOrientation && (
                        <select
                          value={unknownFieldAnswers[cleanField] || ''}
                          onChange={(e) => setUnknownFieldAnswers({
                            ...unknownFieldAnswers,
                            [cleanField]: e.target.value
                          })}
                        >
                          <option value="">Select an answer...</option>
                          <option value="Heterosexual or straight">Heterosexual or straight</option>
                          <option value="Gay or lesbian">Gay or lesbian</option>
                          <option value="Bisexual">Bisexual</option>
                          <option value="Prefer not to answer">Prefer not to answer</option>
                        </select>
                      )}
                      
                      {/* Disability question */}
                      {isDisability && (
                        <select
                          value={unknownFieldAnswers[cleanField] || ''}
                          onChange={(e) => setUnknownFieldAnswers({
                            ...unknownFieldAnswers,
                            [cleanField]: e.target.value
                          })}
                        >
                          <option value="">Select an answer...</option>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                          <option value="Prefer not to answer">Prefer not to answer</option>
                        </select>
                      )}
                      
                      {/* Veteran question */}
                      {isVeteran && (
                        <select
                          value={unknownFieldAnswers[cleanField] || ''}
                          onChange={(e) => setUnknownFieldAnswers({
                            ...unknownFieldAnswers,
                            [cleanField]: e.target.value
                          })}
                        >
                          <option value="">Select an answer...</option>
                          <option value="I am not a protected veteran">I am not a protected veteran</option>
                          <option value="I identify as one or more of the classifications of protected veteran">I identify as a protected veteran</option>
                          <option value="I don't wish to answer">I don't wish to answer</option>
                        </select>
                      )}
                      
                      {/* Degree question */}
                      {isDegree && !isTransgender && !isSexualOrientation && !isDisability && !isVeteran && (
                        <select
                          value={unknownFieldAnswers[cleanField] || ''}
                          onChange={(e) => setUnknownFieldAnswers({
                            ...unknownFieldAnswers,
                            [cleanField]: e.target.value
                          })}
                        >
                          <option value="">Select a degree...</option>
                          <option value="High School">High School</option>
                          <option value="Associate">Associate</option>
                          <option value="Bachelor's">Bachelor's</option>
                          <option value="Master's">Master's</option>
                          <option value="PhD">PhD</option>
                          <option value="Other">Other</option>
                        </select>
                      )}
                      
                      {/* Default text input for other questions */}
                      {!isTransgender && !isSexualOrientation && !isDisability && !isVeteran && !isDegree && (
                        <input
                          type="text"
                          value={unknownFieldAnswers[cleanField] || ''}
                          onChange={(e) => setUnknownFieldAnswers({
                            ...unknownFieldAnswers,
                            [cleanField]: e.target.value
                          })}
                          placeholder="Enter your answer"
                        />
                      )}
                      </>
                      )}
                      
                      <small className="field-hint">
                        This answer will be saved for future applications
                      </small>
                    </div>
                  );
                })}
              </div>
              
              <div className="modal-actions">
                <button 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowUnknownFieldsModal(false);
                    setUnknownFields([]);
                    setUnknownFieldAnswers({});
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => handleSubmitUnknownFields()}
                  disabled={Object.keys(unknownFieldAnswers).length < unknownFields.length}
                >
                  Submit Answers & Continue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobApplicationPage;