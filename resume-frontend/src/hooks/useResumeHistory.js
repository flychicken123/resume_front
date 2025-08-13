import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

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
    // Extract filename from S3 path
    const url = new URL(s3Path);
    const pathParts = url.pathname.split('/');
    const filename = pathParts[pathParts.length - 1];
    
    // Use our download endpoint to record the history
    const downloadEndpoint = `${API_BASE_URL}/api/resume/download/${filename}`;
    
    fetch(downloadEndpoint, {
      method: 'GET',
      headers: getAuthHeaders(),
      redirect: 'follow', // Explicitly follow redirects
    }).then(response => {
      if (response.ok || response.status === 307) {
        // For 307 redirects, get the Location header
        if (response.status === 307) {
          const redirectUrl = response.headers.get('Location');
          if (redirectUrl) {
            window.open(redirectUrl, '_blank');
            return;
          }
        }
        // For successful responses, try to get the URL from response
        return response.url;
      } else {
        throw new Error('Download failed');
      }
    }).then(url => {
      if (url) {
        window.open(url, '_blank');
      }
    }).catch(error => {
      console.error('Download error:', error);
      // Fallback to direct URL
      window.open(s3Path, '_blank');
    });
  }, [getAuthHeaders]);

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
    formatDate,
  };
};
