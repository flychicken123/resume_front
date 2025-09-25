import React, { useState, useEffect } from 'react';
import { saveUserPreferences, retryAutomation } from '../api';
import './AutomationModal.css';

const AutomationModal = ({ isOpen, onClose, automationResult, onRetrySuccess }) => {
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (automationResult && automationResult.required_inputs) {
      const initialData = {};
      automationResult.required_inputs.forEach(field => {
        initialData[field.name] = field.current_value || '';
      });
      setFormData(initialData);
    }
  }, [automationResult]);

  const handleInputChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Extract domain from the first step data
      const parseStep = automationResult.steps.find(step => step.name === 'parse_job_url');
      const domain = parseStep?.data?.domain;

      if (domain) {
        // Save preferences
        await saveUserPreferences(domain, formData);
      }

      // Retry automation with new preferences
      const result = await retryAutomation(automationResult.application_id, formData);
      
      if (onRetrySuccess) {
        onRetrySuccess(result);
      }
      
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit preferences');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field) => {
    switch (field.type) {
      case 'select':
        return (
          <select
            value={formData[field.name] || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            required={field.required}
            className="form-select"
          >
            <option value="">Please select...</option>
            {field.options && field.options.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      
      case 'checkbox':
        return (
          <div className="checkbox-group">
            {field.options && field.options.map((option, index) => (
              <label key={index} className="checkbox-label">
                <input
                  type="checkbox"
                  value={option}
                  checked={formData[field.name]?.includes(option) || false}
                  onChange={(e) => {
                    const currentValues = formData[field.name] ? formData[field.name].split(',') : [];
                    if (e.target.checked) {
                      handleInputChange(field.name, [...currentValues, option].join(','));
                    } else {
                      handleInputChange(field.name, currentValues.filter(v => v !== option).join(','));
                    }
                  }}
                />
                {option}
              </label>
            ))}
          </div>
        );
      
      case 'radio':
        return (
          <div className="radio-group">
            {field.options && field.options.map((option, index) => (
              <label key={index} className="radio-label">
                <input
                  type="radio"
                  name={field.name}
                  value={option}
                  checked={formData[field.name] === option}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                />
                {option}
              </label>
            ))}
          </div>
        );
      
      case 'textarea':
        return (
          <textarea
            value={formData[field.name] || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            required={field.required}
            placeholder={`Enter ${field.name}...`}
            className="form-textarea"
            rows="3"
          />
        );
      
      default:
        return (
          <input
            type="text"
            value={formData[field.name] || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            required={field.required}
            placeholder={`Enter ${field.name}...`}
            className="form-input"
          />
        );
    }
  };

  const getAutomationStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'ready_for_automation':
        return '✅';
      case 'requires_input':
        return '⚠️';
      case 'failed':
        return '❌';
      default:
        return '⏳';
    }
  };

  if (!isOpen || !automationResult) return null;

  return (
    <div className="automation-modal-overlay" onClick={onClose}>
      <div className="automation-modal" onClick={(e) => e.stopPropagation()}>
        <div className="automation-modal-header">
          <h2>Job Application Automation</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <div className="automation-modal-content">
          <div className="automation-status">
            <div className="status-indicator">
              {getAutomationStatusIcon(automationResult.status)} 
              <span className="status-text">
                Status: {automationResult.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>


          {automationResult.status === 'ready_for_automation' && (
            <div className="automation-ready">
              <h3>Ready for Automation!</h3>
              <p>
                All required information is available. The system is ready to automatically fill and submit your job application.
              </p>
              <div className="automation-data">
                <h4>Automation Details:</h4>
                <pre>{JSON.stringify(automationResult.site_data, null, 2)}</pre>
              </div>
            </div>
          )}

          {automationResult.status === 'failed' && (
            <div className="automation-failed">
              <h3>Automation Failed</h3>
              <p>
                There was an error during the automation process. Please check the logs below or try again.
              </p>
            </div>
          )}

          {automationResult.required_inputs && automationResult.required_inputs.length > 0 && (
            <form className="automation-preferences-form" onSubmit={handleSubmit}>
              <h3>Provide Additional Details</h3>
              <p>Share the preferences the automation needs before retrying.</p>
              <div className="form-grid">
                {automationResult.required_inputs.map((field) => (
                  <label key={field.name} className="form-field">
                    <span className="form-label">{field.label || field.name.replace(/_/g, ' ')}</span>
                    {renderField(field)}
                    {field.help_text && (<span className="field-help">{field.help_text}</span>)}
                  </label>
                ))}
              </div>
              {error && <div className="form-error">{error}</div>}
              <div className="form-actions">
                <button type="submit" className="primary-button" disabled={submitting}>
                  {submitting ? 'Saving…' : 'Save Preferences & Retry'}
                </button>
                <button type="button" className="secondary-button" onClick={onClose}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Automation Steps Log */}
          <div className="automation-steps">
            <h4>Automation Process:</h4>
            <div className="steps-list">
              {automationResult.steps && automationResult.steps.map((step, index) => (
                <div key={index} className={`step-item ${step.status}`}>
                  <div className="step-header">
                    <span className="step-icon">
                      {getAutomationStatusIcon(step.status)}
                    </span>
                    <span className="step-name">
                      {step.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                  {step.error_message && (
                    <div className="step-error">
                      Error: {step.error_message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutomationModal;