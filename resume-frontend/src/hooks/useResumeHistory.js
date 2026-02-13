import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAPIBaseURL } from '../api';

const API_BASE_URL = getAPIBaseURL();

export const useResumeHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { getAuthHeaders } = useAuth();

  const fetchResumeHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const authHeaders = getAuthHeaders();
      console.log('Auth headers:', authHeaders); // Debug log
      console.log('Token from localStorage:', localStorage.getItem('resumeToken')); // Debug log
      
      // Check if we have a valid token
      if (!authHeaders.Authorization || authHeaders.Authorization === 'Bearer undefined') {
        console.log('No valid token found, user will be auto-logged out');
        setError("Session expired. Please log in again.");
        return;
      }
      
      const res = await fetch(`${API_BASE_URL}/api/resume/history`, {
        method: "GET",
        headers: authHeaders,
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Session expired. Please log in again.");
        }
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch resume history.");
      }
      
      const data = await res.json();
      setHistory(data.history || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching resume history:', err);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const deleteResumeFromHistory = useCallback(async (historyId) => {
    try {
      setError(null);
      
      const res = await fetch(`${API_BASE_URL}/api/resume/history/${historyId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete resume from history.");
      }
      
      // Refresh the history after successful deletion
      await fetchResumeHistory();
    } catch (err) {
      setError(err.message);
      console.error('Error deleting resume from history:', err);
      throw err; // Re-throw so the component can handle it
    }
  }, [getAuthHeaders, fetchResumeHistory]);

  const downloadResume = useCallback((s3Path, resumeName) => {
    console.log('Download requested for:', { s3Path, resumeName });

    // Extract filename from S3 path
    let filename;

    // Check if s3Path is a full URL or just a key path
    if (s3Path.startsWith('http://') || s3Path.startsWith('https://')) {
      // It's a full URL, parse it
      try {
        const url = new URL(s3Path);
        const pathParts = url.pathname.split('/');
        filename = pathParts[pathParts.length - 1];
      } catch (error) {
        console.error('Invalid URL:', s3Path);
        alert('Unable to download resume. Invalid file path.');
        return;
      }
    } else {
      // It's just a key like "resumes/filename.pdf"
      const pathParts = s3Path.split('/');
      filename = pathParts[pathParts.length - 1];
    }

    console.log('Extracted filename:', filename);

    // Use our download endpoint to record the history
    const downloadEndpoint = `${API_BASE_URL}/api/resume/download/${filename}`;
    console.log('Download endpoint:', downloadEndpoint);

    fetch(downloadEndpoint, {
      method: 'GET',
      headers: getAuthHeaders(),
    }).then(response => {
      console.log('Download response:', response.status, response);

      if (response.ok) {
        // Parse JSON response
        return response.json();
      } else {
        return response.text().then(text => {
          console.error('Download failed with response:', text);
          throw new Error('Download failed: ' + response.status);
        });
      }
    }).then(data => {
      if (data && data.downloadUrl) {
        console.log('Opening download URL:', data.downloadUrl);
        // Open the S3 presigned URL directly in a new tab
        window.open(data.downloadUrl, '_blank');
      } else {
        throw new Error('No download URL received from server');
      }
    }).catch(error => {
      console.error('Download error:', error);
      alert('Failed to download resume. Please try again.');
    });
  }, [getAuthHeaders]);

  const renameResume = useCallback(async (historyId, newName) => {
    try {
      setError(null);

      const res = await fetch(`${API_BASE_URL}/api/resume/history/${historyId}/rename`, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resume_name: newName }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to rename resume.");
      }

      // Refresh the history after successful rename
      await fetchResumeHistory();
    } catch (err) {
      setError(err.message);
      console.error('Error renaming resume:', err);
      throw err; // Re-throw so the component can handle it
    }
  }, [getAuthHeaders, fetchResumeHistory]);

  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  return {
    history,
    loading,
    error,
    fetchResumeHistory,
    deleteResumeFromHistory,
    downloadResume,
    renameResume,
    formatDate,
  };
};
