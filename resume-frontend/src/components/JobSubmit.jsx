import React, { useState } from 'react';
import './JobSubmit.css';
import { jobParserService } from '../services/jobParserService';

const JobSubmit = ({ user, resumeData, onClose }) => {
  const [jobUrl, setJobUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [jobDetails, setJobDetails] = useState(null);
  const [applicationData, setApplicationData] = useState(null);
  
  const supportedPlatforms = jobParserService.getSupportedPlatforms();

  const parseJobUrl = async () => {
    if (!jobUrl.trim()) {
      setStatus('Please enter a job URL');
      return;
    }

    setLoading(true);
    setStatus('🔍 Analyzing job posting...');

    try {
      const result = await jobParserService.parseJob(jobUrl);
      
      if (result.success) {
        setJobDetails(result.jobDetails);
        setStatus(`✅ Job details extracted from ${result.platform.name}!`);
        prepareApplicationData(result.jobDetails);
      } else {
        setStatus(`❌ ${result.error}`);
      }
    } catch (error) {
      console.error('Error parsing job:', error);
      setStatus('❌ Error analyzing job posting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const prepareApplicationData = (job) => {
    // Map resume data to job application fields
    const mappedData = {
      // Personal Information
      firstName: resumeData?.personalInfo?.firstName || '',
      lastName: resumeData?.personalInfo?.lastName || '',
      email: resumeData?.personalInfo?.email || user?.email || '',
      phone: resumeData?.personalInfo?.phone || '',
      location: resumeData?.personalInfo?.location || '',
      linkedIn: resumeData?.personalInfo?.linkedIn || '',
      
      // Professional Summary
      summary: resumeData?.summary || '',
      
      // Experience
      experience: resumeData?.experience || [],
      totalYearsExperience: calculateTotalExperience(resumeData?.experience),
      
      // Education
      education: resumeData?.education || [],
      highestDegree: getHighestDegree(resumeData?.education),
      
      // Skills
      skills: resumeData?.skills || [],
      
      // Additional Information
      coverLetter: generateCoverLetter(job, resumeData),
      portfolio: resumeData?.personalInfo?.portfolio || '',
      availability: 'Immediately',
      expectedSalary: '',
      
      // Job Specific
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      requiredSkills: job.requiredSkills || [],
      matchScore: calculateMatchScore(job, resumeData)
    };
    
    setApplicationData(mappedData);
  };

  const calculateTotalExperience = (experience) => {
    if (!experience || experience.length === 0) return 0;
    
    let totalMonths = 0;
    experience.forEach(exp => {
      if (exp.startDate && exp.endDate) {
        const start = new Date(exp.startDate);
        const end = exp.current ? new Date() : new Date(exp.endDate);
        const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                      (end.getMonth() - start.getMonth());
        totalMonths += months;
      }
    });
    
    return Math.round(totalMonths / 12 * 10) / 10; // Years with 1 decimal
  };

  const getHighestDegree = (education) => {
    if (!education || education.length === 0) return 'Not specified';
    
    const degreeOrder = ['PhD', 'Doctorate', 'Masters', 'Master', 'Bachelors', 'Bachelor', 'Associate', 'Diploma'];
    
    for (const degree of degreeOrder) {
      const found = education.find(edu => 
        edu.degree && edu.degree.toLowerCase().includes(degree.toLowerCase())
      );
      if (found) return found.degree;
    }
    
    return education[0].degree || 'Not specified';
  };

  const calculateMatchScore = (job, resume) => {
    if (!job.requiredSkills || !resume.skills) return 0;
    
    const jobSkills = job.requiredSkills.map(s => s.toLowerCase());
    const userSkills = resume.skills.map(s => s.toLowerCase());
    
    const matches = jobSkills.filter(skill => 
      userSkills.some(userSkill => userSkill.includes(skill) || skill.includes(userSkill))
    );
    
    return Math.round((matches.length / jobSkills.length) * 100);
  };

  const generateCoverLetter = (job, resume) => {
    // This would be enhanced with AI generation
    return `Dear Hiring Manager,

I am excited to apply for the ${job.title} position at ${job.company}. With my background in ${resume?.experience?.[0]?.title || 'the field'} and expertise in ${resume?.skills?.slice(0, 3).join(', ') || 'relevant technologies'}, I am confident I would be a valuable addition to your team.

${resume?.summary || 'I bring a proven track record of success and am eager to contribute to your organization.'}

I look forward to discussing how my skills and experience align with your needs.

Best regards,
${resume?.personalInfo?.firstName} ${resume?.personalInfo?.lastName}`;
  };

  const submitApplication = async () => {
    if (!jobDetails || !applicationData) {
      setStatus('⚠️ Please parse the job URL first');
      return;
    }

    setLoading(true);
    setStatus('📤 Submitting your application...');

    try {
      const result = await jobParserService.submitApplication({
        jobUrl,
        jobDetails,
        applicationData,
        userId: user?.id
      });
      
      if (result.success) {
        setStatus('🎉 Application submitted successfully!');
        saveApplicationHistory(result.applicationId);
      } else {
        setStatus(`❌ ${result.error}`);
        if (result.fallbackAction === 'manual_application') {
          setStatus(prev => prev + ' Click "Review on Platform" to apply manually.');
        }
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      setStatus('❌ Failed to submit. Please try manual application.');
    } finally {
      setLoading(false);
    }
  };

  const saveApplicationHistory = (applicationId) => {
    const history = JSON.parse(localStorage.getItem('applicationHistory') || '[]');
    history.push({
      id: applicationId,
      jobUrl,
      jobTitle: jobDetails.title,
      company: jobDetails.company,
      submittedAt: new Date().toISOString(),
      status: 'submitted'
    });
    localStorage.setItem('applicationHistory', JSON.stringify(history));
  };

  return (
    <div className="job-submit-modal">
      <div className="job-submit-content">
        <button className="close-btn" onClick={onClose}>×</button>
        
        <h2>🚀 One-Click Job Application</h2>
        <p className="subtitle">Paste a job URL and we'll handle the rest!</p>

        <div className="supported-platforms">
          <span>Supported platforms:</span>
          <div className="platform-icons">
            {supportedPlatforms.map(p => (
              <span key={p.name} title={p.name}>{p.icon}</span>
            ))}
          </div>
        </div>

        <div className="url-input-section">
          <input
            type="url"
            placeholder="Paste job posting URL here..."
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && parseJobUrl()}
            className="job-url-input"
          />
          <button 
            onClick={parseJobUrl} 
            disabled={loading || !jobUrl.trim()}
            className="parse-btn"
          >
            {loading ? '⏳ Analyzing...' : '🔍 Analyze Job'}
          </button>
        </div>

        {status && (
          <div className={`status-message ${status.includes('✅') ? 'success' : status.includes('❌') ? 'error' : ''}`}>
            {status}
          </div>
        )}

        {jobDetails && (
          <div className="job-details">
            <h3>📋 Job Details</h3>
            <div className="detail-grid">
              <div><strong>Position:</strong> {jobDetails.title}</div>
              <div><strong>Company:</strong> {jobDetails.company}</div>
              <div><strong>Location:</strong> {jobDetails.location || 'Not specified'}</div>
              <div><strong>Type:</strong> {jobDetails.type || 'Full-time'}</div>
            </div>
          </div>
        )}

        {applicationData && (
          <div className="application-preview">
            <h3>📝 Your Application Data</h3>
            <div className="match-score">
              <span>Skill Match Score:</span>
              <div className="score-bar">
                <div 
                  className="score-fill" 
                  style={{ width: `${applicationData.matchScore}%` }}
                />
              </div>
              <span>{applicationData.matchScore}%</span>
            </div>
            
            <div className="data-preview">
              <div><strong>Name:</strong> {applicationData.firstName} {applicationData.lastName}</div>
              <div><strong>Email:</strong> {applicationData.email}</div>
              <div><strong>Experience:</strong> {applicationData.totalYearsExperience} years</div>
              <div><strong>Education:</strong> {applicationData.highestDegree}</div>
            </div>

            <div className="cover-letter-preview">
              <strong>Generated Cover Letter:</strong>
              <textarea 
                value={applicationData.coverLetter}
                onChange={(e) => setApplicationData({
                  ...applicationData,
                  coverLetter: e.target.value
                })}
                rows={6}
              />
            </div>
          </div>
        )}

        {jobDetails && applicationData && (
          <div className="action-buttons">
            <button 
              onClick={submitApplication}
              disabled={loading}
              className="submit-btn primary"
            >
              {loading ? '⏳ Submitting...' : '🚀 Submit Application'}
            </button>
            <button 
              onClick={() => {
                // Open job in new tab for manual review
                window.open(jobUrl, '_blank');
              }}
              className="submit-btn secondary"
            >
              👀 Review on Platform
            </button>
          </div>
        )}

        <div className="disclaimer">
          <small>
            ⚠️ Note: Automated submission works best with platforms that have API access. 
            Some applications may require manual completion for security questions or additional documents.
          </small>
        </div>
      </div>
    </div>
  );
};

export default JobSubmit;