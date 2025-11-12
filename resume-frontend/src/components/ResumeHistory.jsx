import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useResumeHistory } from '../hooks/useResumeHistory';
import './ResumeHistory.css';

const ResumeHistory = ({ onClose, onSelectResume, importingResumeId }) => {
  const { user } = useAuth();
  const {
    history,
    loading,
    error,
    fetchResumeHistory,
    deleteResumeFromHistory,
    downloadResume,
    renameResume,
    formatDate,
  } = useResumeHistory();
  const [editingId, setEditingId] = useState(null);
  const [newName, setNewName] = useState('');

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

  const handleRename = (item) => {
    setEditingId(item.id);
    setNewName(item.resume_name);
  };

  const handleSaveRename = async (historyId) => {
    if (!newName.trim()) {
      alert('Resume name cannot be empty');
      return;
    }

    try {
      await renameResume(historyId, newName.trim());
      setEditingId(null);
      setNewName('');
    } catch (err) {
      console.error('Rename failed:', err);
      alert('Failed to rename resume. Please try again.');
    }
  };

  const handleCancelRename = () => {
    setEditingId(null);
    setNewName('');
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

  const isSelectionMode = typeof onSelectResume === 'function';

  const modalBody = (
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
                    {editingId === item.id ? (
                      <div className="rename-input-container">
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveRename(item.id);
                            } else if (e.key === 'Escape') {
                              handleCancelRename();
                            }
                          }}
                          className="rename-input"
                          autoFocus
                        />
                        <button
                          className="save-rename-button"
                          onClick={() => handleSaveRename(item.id)}
                        >
                          Save
                        </button>
                        <button
                          className="cancel-rename-button"
                          onClick={handleCancelRename}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <h3>{item.resume_name}</h3>
                        <p className="history-date">Generated: {formatDate(item.generated_at)}</p>
                      </>
                    )}
                  </div>
                  <div className="history-item-actions">
                    {editingId !== item.id && (
                      <>
                        {isSelectionMode && (
                          <button
                            className="import-button"
                            onClick={() => onSelectResume(item)}
                            disabled={importingResumeId === item.id}
                          >
                            {importingResumeId === item.id ? 'Importing…' : 'Use in Builder'}
                          </button>
                        )}
                        <button
                          className="rename-button"
                          onClick={() => handleRename(item)}
                        >
                          Rename
                        </button>
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
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(modalBody, document.body);
};

export default ResumeHistory;
