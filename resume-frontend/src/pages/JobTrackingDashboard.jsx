import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Link } from 'react-router-dom';
import {
  getUserJobApplications,
  getJobApplication,
  updateJobApplicationStatus,
  deleteJobApplication,
  getJobApplicationStats,
} from '../api';
import './JobTrackingDashboard.css';

const STATUSES = ['applied', 'screening', 'interviewing', 'offered', 'accepted', 'rejected', 'withdrawn'];

const STATUS_LABELS = {
  applied: 'Applied',
  screening: 'Screening',
  interviewing: 'Interviewing',
  offered: 'Offered',
  accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

const VALID_TRANSITIONS = {
  applied: ['screening', 'interviewing', 'offered', 'rejected', 'withdrawn'],
  screening: ['applied', 'interviewing', 'offered', 'rejected', 'withdrawn'],
  interviewing: ['applied', 'screening', 'offered', 'rejected', 'withdrawn'],
  offered: ['applied', 'screening', 'interviewing', 'accepted', 'rejected', 'withdrawn'],
  accepted: ['applied', 'screening', 'interviewing', 'offered', 'withdrawn'],
  rejected: [],
  withdrawn: [],
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const JobTrackingDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [selectedAppHistory, setSelectedAppHistory] = useState([]);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [appsRes, statsRes] = await Promise.all([
        getUserJobApplications(200, 0),
        getJobApplicationStats(),
      ]);
      setApplications(appsRes.applications || []);
      setStats(statsRes);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      showToast('Failed to load applications', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getAppsByStatus = (status) => {
    return applications.filter(app => app.status === status);
  };

  const handleDragEnd = async (result) => {
    const { draggableId, destination, source } = result;
    if (!destination || destination.droppableId === source.droppableId) return;

    const fromStatus = source.droppableId;
    const toStatus = destination.droppableId;
    const allowed = VALID_TRANSITIONS[fromStatus] || [];

    if (!allowed.includes(toStatus)) {
      showToast(`Cannot move from ${STATUS_LABELS[fromStatus]} to ${STATUS_LABELS[toStatus]}`, 'error');
      return;
    }

    const appId = parseInt(draggableId, 10);

    // Optimistic update
    setApplications(prev =>
      prev.map(app => app.id === appId ? { ...app, status: toStatus } : app)
    );

    try {
      await updateJobApplicationStatus(appId, toStatus);
      // Refresh stats
      const statsRes = await getJobApplicationStats();
      setStats(statsRes);
    } catch (err) {
      // Rollback
      setApplications(prev =>
        prev.map(app => app.id === appId ? { ...app, status: fromStatus } : app)
      );
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleCardClick = async (app) => {
    try {
      const detail = await getJobApplication(app.id);
      setSelectedApp(detail.application);
      setSelectedAppHistory(detail.status_history || []);
    } catch {
      setSelectedApp(app);
      setSelectedAppHistory([]);
    }
  };

  const handleDelete = async () => {
    if (!selectedApp) return;
    try {
      await deleteJobApplication(selectedApp.id);
      setApplications(prev => prev.filter(a => a.id !== selectedApp.id));
      setSelectedApp(null);
      setConfirmDelete(false);
      showToast('Application deleted');
      const statsRes = await getJobApplicationStats();
      setStats(statsRes);
    } catch (err) {
      showToast(err.message || 'Failed to delete', 'error');
    }
  };

  if (loading) {
    return (
      <div className="job-tracking-page">
        <p style={{ textAlign: 'center', color: '#64748b', marginTop: '3rem' }}>Loading applications...</p>
      </div>
    );
  }

  const totalApps = stats?.total || applications.length;

  return (
    <div className="job-tracking-page">
      <div className="job-tracking-header">
        <h1>Application Tracker</h1>
        <p>Track and manage your job applications</p>
      </div>

      {/* Stats bar */}
      <div className="job-tracking-stats">
        <div className="stat-card">
          <div className="stat-label">Total</div>
          <div className="stat-value">{totalApps}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">This Week</div>
          <div className="stat-value">{stats?.this_week || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">This Month</div>
          <div className="stat-value">{stats?.this_month || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Response Rate</div>
          <div className="stat-value">
            {stats?.response_rate != null ? `${Math.round(stats.response_rate * 100)}%` : '0%'}
          </div>
        </div>
      </div>

      {/* Kanban board or empty state */}
      {totalApps === 0 ? (
        <div className="kanban-empty">
          <h2>No applications yet</h2>
          <p>Start tracking your job applications by clicking "Start Tracking" on your job matches.</p>
          <Link to="/builder">Go to Job Matches</Link>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="kanban-board">
            {STATUSES.map(status => {
              const statusApps = getAppsByStatus(status);
              return (
                <div className="kanban-column" data-status={status} key={status}>
                  <div className="kanban-column-header">
                    <h3>{STATUS_LABELS[status]}</h3>
                    <span className="column-count">{statusApps.length}</span>
                  </div>
                  <Droppable droppableId={status}>
                    {(provided) => (
                      <div
                        className="kanban-column-body"
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        {statusApps.map((app, index) => (
                          <Draggable
                            key={app.id}
                            draggableId={String(app.id)}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                className={`app-card${snapshot.isDragging ? ' dragging' : ''}`}
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => handleCardClick(app)}
                              >
                                <div className="app-card-top">
                                  <div className="app-card-company-initial">
                                    {(app.company_name || app.job_title || '?')[0].toUpperCase()}
                                  </div>
                                  <div className="app-card-info">
                                    <p className="app-card-title">{app.job_title}</p>
                                    <p className="app-card-company">{app.company_name || 'Unknown'}</p>
                                  </div>
                                </div>
                                <div className="app-card-date">{formatDate(app.applied_at)}</div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {/* Detail modal */}
      {selectedApp && (
        <div className="modal-overlay" onClick={() => { setSelectedApp(null); setConfirmDelete(false); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{selectedApp.job_title}</h2>
                <p style={{ color: '#64748b', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
                  {selectedApp.company_name || 'Unknown company'}
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => { setSelectedApp(null); setConfirmDelete(false); }}>
                &times;
              </button>
            </div>

            <div className="modal-section">
              <h3>Details</h3>
              <div className="modal-detail-row">
                <span className="modal-detail-label">Status</span>
                <span className={`status-badge ${selectedApp.status}`}>{selectedApp.status}</span>
              </div>
              {selectedApp.job_location && (
                <div className="modal-detail-row">
                  <span className="modal-detail-label">Location</span>
                  <span>{selectedApp.job_location}</span>
                </div>
              )}
              <div className="modal-detail-row">
                <span className="modal-detail-label">Applied</span>
                <span>{formatDate(selectedApp.applied_at)}</span>
              </div>
              {selectedApp.job_url && (
                <div className="modal-detail-row">
                  <span className="modal-detail-label">Job URL</span>
                  <a href={selectedApp.job_url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>
                    View posting
                  </a>
                </div>
              )}
            </div>

            {/* Status timeline */}
            {selectedAppHistory.length > 0 && (
              <div className="modal-section">
                <h3>Status Timeline</h3>
                <div className="status-timeline">
                  {selectedAppHistory.map((entry) => (
                    <div className="timeline-entry" key={entry.id}>
                      <div className="timeline-status">{entry.to_status}</div>
                      <div className="timeline-date">{formatDate(entry.changed_at)}</div>
                      {entry.note && <div className="timeline-note">{entry.note}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="modal-section">
              <h3>Notes</h3>
              <textarea
                className="notes-textarea"
                value={selectedApp.notes || ''}
                readOnly
                placeholder="No notes"
              />
            </div>

            {/* Actions */}
            <div className="modal-actions">
              {confirmDelete ? (
                <>
                  <span style={{ fontSize: '0.85rem', color: '#dc2626', alignSelf: 'center' }}>
                    Are you sure?
                  </span>
                  <button className="btn-delete" onClick={handleDelete}>
                    Yes, delete
                  </button>
                  <button className="btn-primary" onClick={() => setConfirmDelete(false)}>
                    Cancel
                  </button>
                </>
              ) : (
                <button className="btn-delete" onClick={() => setConfirmDelete(true)}>
                  Delete Application
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default JobTrackingDashboard;
