import React, { useState, useEffect } from 'react';
import { useResume } from '../context/ResumeContext';
import { useAuth } from '../context/AuthContext';
import './StepCoverLetter.css';

const getAPIBaseURL = () => {
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8081';
    }
    return window.location.hostname === 'www.hihired.org' ? 'https://hihired.org' : window.location.origin;
  }
  return process.env.REACT_APP_API_URL || 'http://localhost:8081';
};

const StepCoverLetter = ({ onGeneratePremiumFeature }) => {
  const { resumeData } = useResume();
  const { getAuthHeaders } = useAuth();
  const [coverLetter, setCoverLetter] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [position, setPosition] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load job description from localStorage if available
    const savedJobDesc = localStorage.getItem('jobDescription');
    if (savedJobDesc) {
      setJobDescription(savedJobDesc);
      // Try to extract position and company from job description
      const lines = savedJobDesc.split('\n');
      lines.forEach(line => {
        if (line.startsWith('Position:')) {
          setPosition(line.replace('Position:', '').trim());
        }
        if (line.startsWith('Company:')) {
          setCompanyName(line.replace('Company:', '').trim());
        }
      });
    }
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers.Authorization) {
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${getAPIBaseURL()}/api/subscription/current`, {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isPremiumFeature = () => {
    if (!subscription) return true;
    return subscription.plan_name !== 'premium' && subscription.plan_name !== 'ultimate';
  };

  const generateCoverLetter = async () => {
    // Check if user has premium/ultimate
    if (isPremiumFeature()) {
      if (onGeneratePremiumFeature) {
        onGeneratePremiumFeature();
      }
      return;
    }

    if (!companyName || !position) {
      setError('Please enter company name and position');
      return;
    }

    setError('');
    setIsGenerating(true);

    try {
      const response = await fetch(`${getAPIBaseURL()}/api/cover-letter/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          resumeData,
          companyName,
          position,
          jobDescription
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate cover letter');
      }

      const data = await response.json();
      setCoverLetter(data.coverLetter || '');
    } catch (err) {
      setError(err.message || 'Failed to generate cover letter');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!coverLetter) return;

    const content = `${companyName}\n${new Date().toLocaleDateString()}\n\n${coverLetter}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cover_Letter_${companyName.replace(/\s+/g, '_')}_${position.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <div className="step-cover-letter loading">Loading...</div>;
  }

  return (
    <div className="step-cover-letter">
      <h2>Cover Letter Generator</h2>
      {isPremiumFeature() ? (
        <div className="premium-notice">
          <div className="premium-icon">👑</div>
          <h3>Premium Feature</h3>
          <p>Cover letter generation is available for Premium and Ultimate plans.</p>
          <button
            onClick={onGeneratePremiumFeature}
            className="upgrade-button"
          >
            Upgrade to Premium
          </button>
        </div>
      ) : (
        <div className="cover-letter-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="company">Company Name *</label>
              <input
                id="company"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., Google"
              />
            </div>
            <div className="form-group">
              <label htmlFor="position">Position *</label>
              <input
                id="position"
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="e.g., Software Engineer"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="jobDesc">Job Description (Optional)</label>
            <textarea
              id="jobDesc"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here for a more tailored cover letter..."
              rows="6"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            onClick={generateCoverLetter}
            disabled={isGenerating || !companyName || !position}
            className="generate-button"
          >
            {isGenerating ? 'Generating...' : 'Generate Cover Letter'}
          </button>

          {coverLetter && (
            <div className="cover-letter-result">
              <h3>Your Cover Letter</h3>
              <div className="cover-letter-preview">
                <div className="letter-header">
                  <p>{companyName}</p>
                  <p>{new Date().toLocaleDateString()}</p>
                </div>
                <div className="letter-content">
                  {coverLetter.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </div>
              <div className="letter-actions">
                <button onClick={handleDownload} className="download-button">
                  Download as Text
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(coverLetter)}
                  className="copy-button"
                >
                  Copy to Clipboard
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StepCoverLetter;