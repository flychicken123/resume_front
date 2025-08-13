import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useResumeHistory } from '../hooks/useResumeHistory';
import './ResumeHistory.css';

const ResumeHistory = ({ onClose }) => {
  const { user } = useAuth();
  const {
    history,
    loading,
    error,
    fetchResumeHistory,
    deleteResumeFromHistory,
    downloadResume,
    formatDate,
  } = useResumeHistory();

  useEffect(() => {
    if (user) {
      fetchResumeHistory();
    }
  }, [user, fetchResumeHistory]);

  const handleDelete = async (historyId) => {
    if (!window.confirm('Are you sure you want to delete this resume from history?')) {
      return;
    }

    try {
      await deleteResumeFromHistory(historyId);
    } catch (err) {
      // Error is already handled in the hook
      console.error('Delete failed:', err);
    }
  };

  if (!user) {
    return (
      <div className="resume-history-modal">
        <div className="resume-history-content">
          <div className="resume-history-header">
            <h2>Resume History</h2>
            <button className="close-button" onClick={onClose}>×</button>
          </div>
          <div className="resume-history-body">
            <p>Please log in to view your resume history.</p>
            <button 
              onClick={() => window.location.href = '/login'}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="resume-history-modal">
      <div className="resume-history-content">
        <div className="resume-history-header">
          <h2>Resume History</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="resume-history-body">
          {loading ? (
            <div className="loading">Loading resume history...</div>
          ) : error ? (
            <div className="error">Error: {error}</div>
          ) : history.length === 0 ? (
            <div className="empty-state">
              <p>No resume history found.</p>
              <p>Your generated resumes will appear here.</p>
            </div>
          ) : (
            <div className="history-list">
              {history.map((item) => (
                <div key={item.id} className="history-item">
                  <div className="history-item-info">
                    <h3>{item.resume_name}</h3>
                    <p className="history-date">Generated: {formatDate(item.generated_at)}</p>
                  </div>
                  <div className="history-item-actions">
                                         <button
                       className="download-button"
                       onClick={() => downloadResume(item.s3_path, item.resume_name)}
                     >
                       Download
                     </button>
                    <button
                      className="delete-button"
                      onClick={() => handleDelete(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeHistory;
