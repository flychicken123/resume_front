import React, { useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAPIBaseURL } from "../api";

const formatDate = (value) => {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const JOB_COMPANY_PAGE_SIZE = 20;

const AdminMembershipPage = () => {
  const { user, isAdmin, loading, getAuthHeaders } = useAuth();
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedPlans, setSelectedPlans] = useState({});
  const [updating, setUpdating] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [jobCompanies, setJobCompanies] = useState([]);
  const [jobLoading, setJobLoading] = useState(false);
  const [jobError, setJobError] = useState('');
  const [jobMessage, setJobMessage] = useState('');
  const [jobPage, setJobPage] = useState(1);
  const [jobTotalPages, setJobTotalPages] = useState(1);
  const [jobTotalCount, setJobTotalCount] = useState(0);
  const [jobStatusUpdating, setJobStatusUpdating] = useState({});
  const [syncingAll, setSyncingAll] = useState(false);
  const [importingCompanies, setImportingCompanies] = useState(false);
  const [importErrors, setImportErrors] = useState([]);
  const [newCompany, setNewCompany] = useState({
    name: '',
    website_url: '',
    careers_url: '',
    ats_provider: 'greenhouse',
    external_identifier: '',
    sync_interval_minutes: 180,
  });

  const API_BASE_URL = getAPIBaseURL();
  const importInputRef = useRef(null);

  const jobStartIndex = jobTotalCount === 0 ? 0 : (jobPage - 1) * JOB_COMPANY_PAGE_SIZE + 1;
  const jobEndIndex = jobTotalCount === 0 ? 0 : Math.min(jobTotalCount, jobStartIndex + jobCompanies.length - 1);

  useEffect(() => {
    if (!loading && isAdmin) {
      loadData();
    }
  }, [loading, isAdmin]);

  const loadData = async () => {
    setLoadingData(true);
    setError("");
    try {
      const [usersRes, plansRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/memberships/users`, {
          headers: getAuthHeaders(),
        }),
        fetch(`${API_BASE_URL}/api/plans`),
      ]);

      const usersJson = await usersRes.json();
      if (!usersRes.ok) {
        throw new Error(usersJson.error || "Failed to load members");
      }
      const fetchedUsers = Array.isArray(usersJson.users) ? usersJson.users : [];
      setUsers(fetchedUsers);
      const defaults = {};
      fetchedUsers.forEach((entry) => {
        defaults[entry.id] = entry.plan_name || "free";
      });
      setSelectedPlans(defaults);

      if (plansRes.ok) {
        const plansJson = await plansRes.json();
        setPlans(Array.isArray(plansJson.plans) ? plansJson.plans : []);
      } else {
        setPlans([]);
      }

      setJobPage(1);
      await loadJobCompanies(1);
    } catch (err) {
      console.error("Failed to load admin data", err);
      setError(err.message || "Failed to load admin data");
    } finally {
      setLoadingData(false);
    }
  };

  const loadJobCompanies = async (page = jobPage) => {
    setJobLoading(true);
    setJobError('');
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(JOB_COMPANY_PAGE_SIZE),
      status: 'all',
    });

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/jobs/companies?${params.toString()}`, {
        headers: getAuthHeaders(),
      });

      let payload = {};
      try {
        payload = await response.json();
      } catch (parseErr) {
        payload = {};
      }

      if (!response.ok) {
        const message = payload && typeof payload.error === 'string' ? payload.error : 'Failed to load job companies';
        throw new Error(message);
      }

      const companies = Array.isArray(payload.companies) ? payload.companies : [];
      setJobCompanies(companies);

      const incomingPage = typeof payload.page === 'number' && payload.page > 0 ? payload.page : page;
      setJobPage(incomingPage);

      const totalPages = typeof payload.total_pages === 'number' && payload.total_pages > 0 ? payload.total_pages : 1;
      setJobTotalPages(Math.max(1, totalPages));

      const totalCount = typeof payload.total === 'number' && payload.total >= 0 ? payload.total : companies.length;
      setJobTotalCount(totalCount);
    } catch (err) {
      console.error('Failed to load job companies', err);
      setJobError(err.message || 'Failed to load job companies');
      setJobCompanies([]);
      setJobTotalPages(1);
      setJobTotalCount(0);
      setJobPage(1);
    } finally {
      setJobLoading(false);
    }
  };

  const handleNewCompanyChange = (field, value) => {
    setNewCompany((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateCompany = async (event) => {
    if (event) {
      event.preventDefault();
    }
    setJobError('');
    setJobMessage('');
    try {
      const payload = { ...newCompany };
      if (!payload.name || !payload.careers_url || !payload.ats_provider) {
        throw new Error('Name, careers url, and ATS provider are required');
      }
      if (typeof payload.sync_interval_minutes !== 'number' || payload.sync_interval_minutes <= 0) {
        payload.sync_interval_minutes = 180;
      }
      const response = await fetch(`${API_BASE_URL}/api/admin/jobs/companies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create company');
      }
      setJobMessage(`Added ${data.company?.name || 'company'} to ATS sync list.`);
      setNewCompany({
        name: '',
        website_url: '',
        careers_url: '',
        ats_provider: payload.ats_provider,
        external_identifier: '',
        sync_interval_minutes: 180,
      });
      setJobPage(1);
      await loadJobCompanies(1);
    } catch (err) {
      console.error('Failed to create company', err);
      setJobError(err.message || 'Failed to create company');
    }
  };

  const handleOpenImportDialog = () => {
    if (importInputRef.current) {
      importInputRef.current.value = '';
      importInputRef.current.click();
    }
  };

  const handleImportCompanies = async (event) => {
    const { files } = event.target;
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];
    event.target.value = '';
    setJobError('');
    setJobMessage('');
    setImportErrors([]);
    setImportingCompanies(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const authHeaders = getAuthHeaders() || {};
      const headers = { ...authHeaders };
      delete headers['Content-Type'];
      delete headers['content-type'];

      const response = await fetch(`${API_BASE_URL}/api/admin/jobs/companies/import`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to import companies');
      }

      const summary = payload.summary || {};
      const inserted = summary.inserted ?? 0;
      const updated = summary.updated ?? 0;
      const skipped = summary.skipped ?? 0;
      const processed = summary.processed ?? 0;
      const errors = Array.isArray(summary.errors) ? summary.errors : [];

      const parts = [`Processed ${processed} rows`, `${inserted} inserted`, `${updated} updated`];
      if (skipped > 0) {
        parts.push(`${skipped} skipped`);
      }
      setJobMessage(`${payload.message || 'Import completed.'} ${parts.join(', ')}.`);
      setImportErrors(errors);

      setJobPage(1);
      await loadJobCompanies(1);
    } catch (err) {
      console.error('Company import failed', err);
      setJobError(err.message || 'Failed to import companies');
      setImportErrors([]);
    } finally {
      setImportingCompanies(false);
    }
  };

  const handleTriggerJobSync = async (companyId) => {
    setJobError('');
    setJobMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/jobs/companies/${companyId}/sync`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to trigger sync');
      }
      setJobMessage(`Sync started. Found ${data.result?.jobsFound ?? 0} jobs.`);
      await loadJobCompanies(jobPage);
    } catch (err) {
      console.error('Failed to trigger job sync', err);
      setJobError(err.message || 'Failed to trigger job sync');
    }
  };

  const handleTriggerSyncAll = async () => {
    setJobError('');
    setJobMessage('');
    setSyncingAll(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/jobs/companies/sync-all`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync companies');
      }

      if (data.result && typeof data.result === 'object') {
        const summary = data.result;
        const ran = typeof summary.ran === 'number' ? summary.ran : summary.total_companies || 0;
        const succeeded = summary.succeeded ?? 0;
        const failed = summary.failed ?? 0;
        const found = summary.total_jobs_found ?? 0;
        const created = summary.total_jobs_created ?? 0;
        const updated = summary.total_jobs_updated ?? 0;
        const closed = summary.total_jobs_closed ?? 0;
        const parts = [
          `Ran ${ran} ${ran === 1 ? 'company' : 'companies'}`,
          `${succeeded} succeeded${failed ? `, ${failed} failed` : ''}`,
          `Jobs: ${found} found (${created} new, ${updated} updated, ${closed} closed)`
        ];
        setJobMessage(parts.join('. ') + '.');
      } else {
        setJobMessage(data.message || 'Sync completed.');
      }

      await loadJobCompanies(jobPage);
    } catch (err) {
      console.error('Failed to sync all companies', err);
      setJobError(err.message || 'Failed to sync all companies');
    } finally {
      setSyncingAll(false);
    }
  };

  const handleCompanyStatusChange = async (companyId, nextActive) => {
    setJobError('');
    setJobMessage('');
    setJobStatusUpdating((prev) => ({ ...prev, [companyId]: true }));

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/jobs/companies/${companyId}/status`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: nextActive }),
      });

      let payload = {};
      try {
        payload = await response.json();
      } catch (parseErr) {
        payload = {};
      }

      if (!response.ok) {
        const message = typeof payload.error === 'string' ? payload.error : 'Failed to update company status';
        throw new Error(message);
      }

      if (nextActive) {
        setJobMessage('Company reactivated. Trigger a sync to refresh listings.');
      } else {
        setJobMessage('Company paused. It will no longer be synced automatically.');
      }

      await loadJobCompanies(jobPage);
    } catch (err) {
      console.error('Failed to update company status', err);
      setJobError(err.message || 'Failed to update company status');
    } finally {
      setJobStatusUpdating((prev) => {
        const next = { ...prev };
        delete next[companyId];
        return next;
      });
    }
  };

  const handleJobPageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > jobTotalPages) {
      return;
    }
    setJobPage(nextPage);
    loadJobCompanies(nextPage);
  };

  const planOptions = useMemo(() => {
    if (!plans.length) {
      return [];
    }
    return plans.map((plan) => ({
      value: plan.name,
      label: plan.display_name || plan.name,
    }));
  }, [plans]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) {
      return users;
    }
    const query = searchTerm.trim().toLowerCase();
    return users.filter((entry) => {
      const email = entry.email ? entry.email.toLowerCase() : '';
      const name = entry.name ? entry.name.toLowerCase() : '';
      return email.includes(query) || name.includes(query);
    });
  }, [users, searchTerm]);

  const handlePlanChange = (userId, planName) => {
    setSelectedPlans((prev) => ({ ...prev, [userId]: planName }));
  };

  const handleUpdate = async (userId) => {
    const selectedPlanName = selectedPlans[userId];
    if (!selectedPlanName) {
      setError("Please select a plan before updating.");
      return;
    }

    setUpdating((prev) => ({ ...prev, [userId]: true }));
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/memberships/users/${userId}`, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          plan_name: selectedPlanName,
          status: selectedPlanName === "free" ? "free" : "active",
          cancel_at_period_end: false,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to update membership");
      }

      if (result.user) {
        setUsers((prev) => prev.map((entry) => (entry.id === userId ? result.user : entry)));
        setSelectedPlans((prev) => ({ ...prev, [userId]: result.user.plan_name || selectedPlanName }));
        setMessage(`Membership updated for ${result.user.email || "user"}.`);
      } else {
        setMessage("Membership updated.");
      }
    } catch (err) {
      console.error("Failed to update membership", err);
      setError(err.message || "Failed to update membership");
    } finally {
      setUpdating((prev) => ({ ...prev, [userId]: false }));
    }
  };

  if (!loading && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "1.5rem" }}>Membership Management</h1>

      {error && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      {message && (
        <div style={{ background: "#dcfce7", border: "1px solid #86efac", color: "#166534", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1rem" }}>
          {message}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <button
            type="button"
            onClick={loadData}
            disabled={loadingData}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              background: loadingData ? "#e5e7eb" : "#ffffff",
              color: "#111827",
              cursor: loadingData ? "not-allowed" : "pointer",
              fontWeight: 500,
            }}
          >
            {loadingData ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by email or name..."
            style={{
              padding: "0.45rem 0.75rem",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              minWidth: "220px",
              background: "#ffffff",
            }}
          />
          <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>
            Signed in as {user?.email || ""}
          </div>
        </div>
      </div>


      <section style={{ marginTop: "2rem", marginBottom: "2rem" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>ATS Job Sync</h2>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleTriggerSyncAll}
              disabled={syncingAll || jobLoading}
              style={{
                padding: '0.6rem 1.2rem',
                borderRadius: '6px',
                border: 'none',
                background: syncingAll ? '#1d4ed8' : '#2563eb',
                color: '#ffffff',
                fontWeight: 600,
                cursor: syncingAll || jobLoading ? 'not-allowed' : 'pointer',
                opacity: syncingAll || jobLoading ? 0.85 : 1
              }}
            >
              {syncingAll ? 'Running Sync...' : 'Run Manual Sync'}
            </button>
            <button
              type="button"
              onClick={() => loadJobCompanies(jobPage)}
              disabled={jobLoading || syncingAll}
              style={{
                padding: '0.6rem 1.2rem',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                background: '#ffffff',
                cursor: jobLoading || syncingAll ? 'not-allowed' : 'pointer',
                fontWeight: 500,
                color: '#111827'
              }}
            >
              {jobLoading ? 'Refreshing...' : 'Refresh Companies'}
            </button>
            <button
              type="button"
              onClick={handleOpenImportDialog}
              disabled={importingCompanies || jobLoading || syncingAll}
              style={{
                padding: '0.6rem 1.2rem',
                borderRadius: '6px',
                border: '1px solid #15803d',
                background: importingCompanies ? '#bbf7d0' : '#d1fae5',
                color: '#047857',
                fontWeight: 600,
                cursor: importingCompanies || jobLoading || syncingAll ? 'not-allowed' : 'pointer',
                opacity: importingCompanies || jobLoading || syncingAll ? 0.8 : 1
              }}
            >
              {importingCompanies ? 'Importing...' : 'Import CSV'}
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept=".csv,text/csv"
              style={{ display: 'none' }}
              onChange={handleImportCompanies}
            />
          </div>
        </div>
        {jobError && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '0.75rem' }}>
            {jobError}
          </div>
        )}
        {jobMessage && (
          <div style={{ background: '#dbeafe', border: '1px solid #93c5fd', color: '#1d4ed8', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '0.75rem' }}>
            {jobMessage}
          </div>
        )}
        {importErrors.length > 0 && (
          <div style={{ background: '#fef3c7', border: '1px solid #facc15', color: '#92400e', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '0.75rem' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Some rows were skipped during import:</div>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.85rem' }}>
              {importErrors.slice(0, 5).map((entry, index) => (
                <li key={`${entry.row}-${index}`}>
                  Row {entry.row}: {entry.message}
                </li>
              ))}
            </ul>
            {importErrors.length > 5 && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>+ {importErrors.length - 5} more issues. Check your CSV and try again.</div>
            )}
          </div>
        )}

        <form
          onSubmit={handleCreateCompany}
          style={{
            display: 'grid',
            gap: '0.75rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4b5563' }}>Company Name</label>
            <input
              type="text"
              value={newCompany.name}
              onChange={(event) => handleNewCompanyChange('name', event.target.value)}
              placeholder="Acme Corp"
              style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
              required
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4b5563' }}>Careers URL</label>
            <input
              type="url"
              value={newCompany.careers_url}
              onChange={(event) => handleNewCompanyChange('careers_url', event.target.value)}
              placeholder="https://boards.greenhouse.io/your-board"
              style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
              required
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4b5563' }}>Website URL</label>
            <input
              type="url"
              value={newCompany.website_url}
              onChange={(event) => handleNewCompanyChange('website_url', event.target.value)}
              placeholder="https://company.com"
              style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4b5563' }}>ATS Provider</label>
            <select
              value={newCompany.ats_provider}
              onChange={(event) => handleNewCompanyChange('ats_provider', event.target.value)}
              style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
              required
            >
              <option value="greenhouse">Greenhouse</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4b5563' }}>Board Token / External ID</label>
            <input
              type="text"
              value={newCompany.external_identifier}
              onChange={(event) => handleNewCompanyChange('external_identifier', event.target.value)}
              placeholder="company-board"
              style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4b5563' }}>Sync Interval (minutes)</label>
            <input
              type="number"
              min="30"
              value={newCompany.sync_interval_minutes}
              onChange={(event) => handleNewCompanyChange('sync_interval_minutes', Number(event.target.value))}
              style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="submit"
              style={{ padding: '0.6rem 1.2rem', borderRadius: '6px', border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}
            >
              Add Company
            </button>
          </div>
        </form>

        <div style={{ overflowX: 'auto', background: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '2rem' }}>
          {jobLoading ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#4b5563' }}>Loading companies...</div>
          ) : jobCompanies.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#6b7280' }}>No companies configured yet.</div>
          ) : (
            <>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead style={{ background: '#f9fafb', textAlign: 'left' }}>
                  <tr>
                    <th style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Company</th>
                    <th style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ATS</th>
                    <th style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Sync</th>
                    <th style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                    <th style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobCompanies.map((company) => (
                    <tr key={company.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '0.75rem', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 600 }}>{company.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{company.careers_url}</div>
                      </td>
                      <td style={{ padding: '0.75rem', verticalAlign: 'top' }}>{company.ats_provider}</td>
                      <td style={{ padding: '0.75rem', verticalAlign: 'top' }}>
                        <div>{company.last_synced_at ? new Date(company.last_synced_at).toLocaleString() : 'Never'}</div>
                        {company.last_sync_status && (
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                            Status: {company.last_sync_status}
                        </div>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 600, color: company.is_active ? '#15803d' : '#b91c1c' }}>
                          {company.is_active ? 'Active' : 'Paused'}
                      </div>
                        {company.sync_failure_count > 0 && (
                          <div style={{ fontSize: '0.75rem', color: '#b91c1c', marginTop: '0.25rem' }}>
                            Failures: {company.sync_failure_count}
                        </div>
                        )}
                        {company.last_sync_error && (
                          <div style={{ fontSize: '0.75rem', color: '#b91c1c', marginTop: '0.25rem', wordBreak: 'break-word' }}>
                            {company.last_sync_error}
                        </div>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <button
                            type='button'
                            onClick={() => handleTriggerJobSync(company.id)}
                            disabled={!company.is_active || syncingAll || !!jobStatusUpdating[company.id]}
                            style={{
                              padding: '0.45rem 0.9rem',
                              borderRadius: '6px',
                              border: '1px solid #2563eb',
                              background: !company.is_active || syncingAll || jobStatusUpdating[company.id] ? '#e5e7eb' : '#2563eb',
                              color: !company.is_active || syncingAll || jobStatusUpdating[company.id] ? '#6b7280' : '#fff',
                              fontWeight: 600,
                              cursor: !company.is_active || syncingAll || jobStatusUpdating[company.id] ? 'not-allowed' : 'pointer',
                              opacity: !company.is_active || syncingAll || jobStatusUpdating[company.id] ? 0.85 : 1
                            }}
                          >
                            Trigger Sync
                          </button>
                          <button
                            type='button'
                            onClick={() => handleCompanyStatusChange(company.id, !company.is_active)}
                            disabled={!!jobStatusUpdating[company.id]}
                            style={{
                              padding: '0.45rem 0.9rem',
                              borderRadius: '6px',
                              border: '1px solid',
                              borderColor: jobStatusUpdating[company.id] ? '#d1d5db' : (company.is_active ? '#f97316' : '#059669'),
                              background: jobStatusUpdating[company.id] ? '#e5e7eb' : (company.is_active ? '#f97316' : '#059669'),
                              color: jobStatusUpdating[company.id] ? '#6b7280' : '#ffffff',
                              fontWeight: 600,
                              cursor: jobStatusUpdating[company.id] ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {company.is_active ? 'Pause' : 'Reactivate'}
                          </button>
                      </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderTop: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '0.8rem', color: '#4b5563' }}>
                  {jobTotalCount === 0 ? 'No companies to display.' : `Showing ${jobStartIndex}-${jobEndIndex} of ${jobTotalCount}`}
              </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type='button'
                    onClick={() => handleJobPageChange(jobPage - 1)}
                    disabled={jobPage <= 1 || jobLoading}
                    style={{
                      padding: '0.4rem 0.9rem',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      background: jobPage <= 1 || jobLoading ? '#f3f4f6' : '#ffffff',
                      color: jobPage <= 1 || jobLoading ? '#9ca3af' : '#1f2937',
                      cursor: jobPage <= 1 || jobLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Previous
                  </button>
                  <div style={{ fontSize: '0.8rem', color: '#4b5563' }}>
                    Page {jobTotalCount === 0 ? 1 : jobPage} of {Math.max(1, jobTotalPages)}
                </div>
                  <button
                    type='button'
                    onClick={() => handleJobPageChange(jobPage + 1)}
                    disabled={jobPage >= jobTotalPages || jobLoading || jobTotalCount === 0}
                    style={{
                      padding: '0.4rem 0.9rem',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      background: jobPage >= jobTotalPages || jobLoading || jobTotalCount === 0 ? '#f3f4f6' : '#ffffff',
                      color: jobPage >= jobTotalPages || jobLoading || jobTotalCount === 0 ? '#9ca3af' : '#1f2937',
                      cursor: jobPage >= jobTotalPages || jobLoading || jobTotalCount === 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Next
                  </button>
              </div>
            </div>
            </>
          )}
        </div>
      </section>
      {loadingData ? (
        <div style={{ padding: "2rem", textAlign: "center", color: "#4b5563" }}>Loading memberships...</div>
      ) : (
        <div style={{ overflowX: "auto", background: "#ffffff", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
            <thead style={{ background: "#f9fafb", textAlign: "left" }}>
              <tr>
                <th style={{ padding: "0.75rem", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280" }}>User</th>
                <th style={{ padding: "0.75rem", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280" }}>Current Plan</th>
                <th style={{ padding: "0.75rem", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280" }}>Billing Status</th>
                <th style={{ padding: "0.75rem", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280" }}>Resume Limit</th>
                <th style={{ padding: "0.75rem", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280" }}>Current Period Ends</th>
                <th style={{ padding: "0.75rem", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((entry) => {
                const planSelection = selectedPlans[entry.id] || entry.plan_name || "free";
                const isSelf = user?.email && user.email === entry.email;
                return (
                  <tr key={entry.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "0.75rem", verticalAlign: "top" }}>
                      <div style={{ fontWeight: 600, color: "#111827" }}>{entry.email}</div>
                      <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>{entry.name || "(no name)"}</div>
                      {entry.is_admin && (
                        <div style={{ marginTop: "0.35rem", display: "inline-block", background: "#eef2ff", color: "#4338ca", fontSize: "0.7rem", padding: "0.1rem 0.45rem", borderRadius: "999px" }}>
                          Admin
                      </div>
                      )}
                      {isSelf && !entry.is_admin && (
                        <div style={{ marginTop: "0.35rem", display: "inline-block", background: "#fef3c7", color: "#b45309", fontSize: "0.7rem", padding: "0.1rem 0.45rem", borderRadius: "999px" }}>
                          You
                      </div>
                      )}
                    </td>
                    <td style={{ padding: "0.75rem", verticalAlign: "top" }}>
                      <select
                        value={planSelection}
                        onChange={(event) => handlePlanChange(entry.id, event.target.value)}
                        style={{
                          padding: "0.4rem 0.6rem",
                          borderRadius: "6px",
                          border: "1px solid #d1d5db",
                          width: "100%",
                          background: "#ffffff",
                        }}
                      >
                        {planOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                        {!planOptions.some((option) => option.value === planSelection) && (
                          <option value={planSelection}>{planSelection}</option>
                        )}
                      </select>
                      <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
                        {entry.plan_display_name || entry.plan_name || "-"}
                    </div>
                    </td>
                    <td style={{ padding: "0.75rem", verticalAlign: "top" }}>
                      <div style={{ fontWeight: 500, color: "#111827" }}>{entry.billing_status || entry.subscription_status || "-"}</div>
                      {entry.cancel_at_period_end && (
                        <div style={{ fontSize: "0.75rem", color: "#b91c1c" }}>Cancels at period end</div>
                      )}
                    </td>
                    <td style={{ padding: "0.75rem", verticalAlign: "top" }}>
                      <div>{entry.resume_limit ?? "-"}</div>
                      <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{entry.resume_period || "-"}</div>
                    </td>
                    <td style={{ padding: "0.75rem", verticalAlign: "top" }}>
                      <div>{formatDate(entry.current_period_end)}</div>
                      <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>Trial ends: {formatDate(entry.trial_end_date)}</div>
                    </td>
                    <td style={{ padding: "0.75rem", verticalAlign: "top" }}>
                      <button
                        type="button"
                        onClick={() => handleUpdate(entry.id)}
                        disabled={!!updating[entry.id]}
                        style={{
                          padding: "0.4rem 0.85rem",
                          borderRadius: "6px",
                          border: "none",
                          background: updating[entry.id] ? "#e5e7eb" : "#2563eb",
                          color: updating[entry.id] ? "#6b7280" : "#ffffff",
                          cursor: updating[entry.id] ? "not-allowed" : "pointer",
                          fontWeight: 600,
                        }}
                      >
                        {updating[entry.id] ? "Updating..." : "Update"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div style={{ padding: "1.5rem", textAlign: "center", color: "#6b7280" }}>
              {users.length === 0 ? 'No users found.' : 'No users match your search.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminMembershipPage;










