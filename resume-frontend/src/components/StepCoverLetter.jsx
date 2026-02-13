import React, { useState, useEffect } from 'react';
import { useResume } from '../context/ResumeContext';
import { useAuth } from '../context/AuthContext';
import { fetchResumeHistoryList, getAPIBaseURL } from '../api';
import './StepCoverLetter.css';

const StepCoverLetter = ({ onGeneratePremiumFeature }) => {
  const { data: resumeData, setData } = useResume();
  const { getAuthHeaders } = useAuth();
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

  const generateLetter = async (letterType) => {
    // Check if user has premium/ultimate
    if (isPremiumFeature()) {
      if (onGeneratePremiumFeature) {
        onGeneratePremiumFeature();
      }
      return;
    }

    try {
      setError('');
      setIsGenerating(true);

      // Ensure the user has at least one generated resume in history
      const historyResponse = await fetchResumeHistoryList().catch((err) => {
        throw new Error(err.message || 'Unable to load resume history.');
      });
      const history = Array.isArray(historyResponse?.history) ? historyResponse.history : [];
      if (!history.length) {
        setError('Please generate your resume first in the builder before creating a cover or recommendation letter.');
        return;
      }

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
          jobDescription,
          letterType,
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate cover letter');
      }

      const data = await response.json();
      const text = data.coverLetter || '';
      setData({ ...resumeData, coverLetterText: text, coverLetterType: letterType });
    } catch (err) {
      setError(err.message || 'Failed to generate cover letter');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!resumeData.coverLetterText) return;

    const content = `${companyName}\n${new Date().toLocaleDateString()}\n\n${resumeData.coverLetterText}`;
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
      <h2>Cover/Recommendation Letter</h2>
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
          <p style={{ marginBottom: '1rem', color: '#4b5563' }}>
            For job-customized letters, first fill the{" "}
            <strong>Job Description (Optional)</strong> section in the builder. We’ll use your
            latest generated resume as the core context and, when available, the job description
            content to tailor the letter.
          </p>

          {error && <div className="error-message">{error}</div>}

          <div className="letter-actions">
            <button
              onClick={() => generateLetter('first_party')}
              disabled={isGenerating}
              className="generate-button"
            >
              {isGenerating ? 'Generating...' : 'First party Cover Letter'}
            </button>
            <button
              onClick={() => generateLetter('third_party')}
              disabled={isGenerating}
              className="generate-button secondary"
            >
              {isGenerating ? 'Generating...' : '3rd party Recommendation Letter'}
            </button>
          </div>

          {resumeData.coverLetterText && (
            <div className="cover-letter-result">
              <h3>Your Letter</h3>
              <div className="cover-letter-preview">
                <div className="letter-header">
                  <p>{companyName}</p>
                  <p>{new Date().toLocaleDateString()}</p>
                </div>
                <div className="letter-content">
                  {resumeData.coverLetterText.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </div>
              <div className="letter-actions">
                <button onClick={handleDownload} className="download-button">
                  Download as Text
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(resumeData.coverLetterText || '')}
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
