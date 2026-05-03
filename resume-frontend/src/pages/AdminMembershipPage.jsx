
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAPIBaseURL } from "../api";
import SEO from "../components/SEO";

const JOB_COMPANY_PAGE_SIZE = 20;
const USER_PAGE_SIZE = 20;

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const tabStyle = (active) => ({
  padding: "0.6rem 1.2rem",
  borderRadius: "8px 8px 0 0",
  border: "1px solid #e5e7eb",
  borderBottom: active ? "2px solid #2563eb" : "1px solid #e5e7eb",
  background: active ? "#ffffff" : "#f9fafb",
  color: active ? "#2563eb" : "#6b7280",
  fontWeight: active ? 700 : 500,
  cursor: "pointer",
  fontSize: "0.9rem",
  transition: "all 0.15s",
});

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  padding: "1rem 1.25rem",
  flex: "1 1 140px",
  minWidth: "140px",
};

const AdminMembershipPage = () => {
  const { user, isAdmin, loading, getAuthHeaders } = useAuth();
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedPlans, setSelectedPlans] = useState({});
  const [updating, setUpdating] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("users");
  const [userPage, setUserPage] = useState(1);

  // ATS Job Sync state
  const [jobCompanies, setJobCompanies] = useState([]);
  const [jobLoading, setJobLoading] = useState(false);
  const [jobError, setJobError] = useState("");
  const [jobMessage, setJobMessage] = useState("");
  const [jobPage, setJobPage] = useState(1);
  const [emailExportMode, setEmailExportMode] = useState(null);
  const [jobTotalPages, setJobTotalPages] = useState(1);
  const [jobTotalCount, setJobTotalCount] = useState(0);
  const [jobStatusUpdating, setJobStatusUpdating] = useState({});
  const [syncingAll, setSyncingAll] = useState(false);
  const [importingCompanies, setImportingCompanies] = useState(false);
  const [importErrors, setImportErrors] = useState([]);
  const [newCompany, setNewCompany] = useState({
    name: "",
    website_url: "",
    careers_url: "",
    ats_provider: "greenhouse",
    external_identifier: "",
    sync_interval_minutes: 180,
  });

  const API_BASE_URL = getAPIBaseURL();
  const importInputRef = useRef(null);

  const jobStartIndex = jobTotalCount === 0 ? 0 : (jobPage - 1) * JOB_COMPANY_PAGE_SIZE + 1;
  const jobEndIndex = jobTotalCount === 0 ? 0 : Math.min(jobTotalCount, jobStartIndex + jobCompanies.length - 1);

  useEffect(() => {
    if (!loading && isAdmin) loadData();
  }, [loading, isAdmin]);

  // ── Data Loading ──────────────────────────────────────────

  const loadJobCompanies = async (page = jobPage) => {
    setJobLoading(true);
    setJobError("");
    const params = new URLSearchParams({ page: String(page), page_size: String(JOB_COMPANY_PAGE_SIZE), status: "all" });
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/jobs/companies?${params.toString()}`, { headers: getAuthHeaders() });
      let payload = {};
      try { payload = await response.json(); } catch { payload = {}; }
      if (!response.ok) throw new Error(payload?.error || "Failed to load job companies");
      setJobCompanies(Array.isArray(payload.companies) ? payload.companies : []);
      setJobPage(typeof payload.page === "number" && payload.page > 0 ? payload.page : page);
      setJobTotalPages(Math.max(1, typeof payload.total_pages === "number" ? payload.total_pages : 1));
      setJobTotalCount(typeof payload.total === "number" ? payload.total : (payload.companies || []).length);
    } catch (err) {
      setJobError(err.message || "Failed to load job companies");
      setJobCompanies([]);
      setJobTotalPages(1);
      setJobTotalCount(0);
      setJobPage(1);
    } finally {
      setJobLoading(false);
    }
  };

  const loadData = async () => {
    setLoadingData(true);
    setError("");
    try {
      const [usersRes, plansRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/memberships/users`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/api/plans`),
      ]);
      const usersJson = await usersRes.json();
      if (!usersRes.ok) throw new Error(usersJson.error || "Failed to load members");
      const fetchedUsers = Array.isArray(usersJson.users) ? usersJson.users : [];
      setUsers(fetchedUsers);
      const defaults = {};
      fetchedUsers.forEach((e) => { defaults[e.id] = e.plan_name || "free"; });
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
      setError(err.message || "Failed to load admin data");
    } finally {
      setLoadingData(false);
    }
  };

  // ── User Handlers ─────────────────────────────────────────

  const planOptions = useMemo(() => plans.map((p) => ({ value: p.name, label: p.display_name || p.name })), [plans]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const q = searchTerm.trim().toLowerCase();
    return users.filter((e) => (e.email || "").toLowerCase().includes(q) || (e.name || "").toLowerCase().includes(q));
  }, [users, searchTerm]);

  // Paginated users
  const userTotalPages = Math.max(1, Math.ceil(filteredUsers.length / USER_PAGE_SIZE));
  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * USER_PAGE_SIZE;
    return filteredUsers.slice(start, start + USER_PAGE_SIZE);
  }, [filteredUsers, userPage]);

  // Reset to page 1 when search changes
  useEffect(() => { setUserPage(1); }, [searchTerm]);

  const handlePlanChange = (userId, planName) => setSelectedPlans((p) => ({ ...p, [userId]: planName }));

  const handleUpdate = async (userId) => {
    const selectedPlanName = selectedPlans[userId];
    if (!selectedPlanName) { setError("Please select a plan before updating."); return; }
    setUpdating((p) => ({ ...p, [userId]: true }));
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/memberships/users/${userId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ plan_name: selectedPlanName, status: selectedPlanName === "free" ? "free" : "active", cancel_at_period_end: false }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to update membership");
      if (result.user) {
        setUsers((prev) => prev.map((e) => (e.id === userId ? result.user : e)));
        setSelectedPlans((p) => ({ ...p, [userId]: result.user.plan_name || selectedPlanName }));
        setMessage(`Updated ${result.user.email || "user"}.`);
      } else {
        setMessage("Membership updated.");
      }
    } catch (err) {
      setError(err.message || "Failed to update membership");
    } finally {
      setUpdating((p) => ({ ...p, [userId]: false }));
    }
  };

  const handleDownloadEmails = async (includeAll = false) => {
    setEmailExportMode(includeAll ? "all" : "opted");
    setError("");
    try {
      const params = new URLSearchParams({ format: "csv" });
      if (includeAll) params.set("all", "true");
      const response = await fetch(`${API_BASE_URL}/api/admin/users/emails?${params.toString()}`, {
        headers: { ...getAuthHeaders(), Accept: "text/csv" },
      });
      if (!response.ok) throw new Error((await response.text().catch(() => "")) || "Failed to export");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = includeAll ? "user-emails-all.csv" : "user-emails-opted-in.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setMessage(includeAll ? "Downloaded all emails." : "Downloaded opted-in emails.");
    } catch (err) {
      setError(err.message || "Failed to export");
    } finally {
      setEmailExportMode(null);
    }
  };

  // ── ATS Handlers ──────────────────────────────────────────

  const handleNewCompanyChange = (field, value) => setNewCompany((p) => ({ ...p, [field]: value }));

  const handleCreateCompany = async (event) => {
    if (event) event.preventDefault();
    setJobError("");
    setJobMessage("");
    try {
      const payload = { ...newCompany };
      if (!payload.name || !payload.careers_url || !payload.ats_provider) throw new Error("Name, careers url, and ATS provider are required");
      if (typeof payload.sync_interval_minutes !== "number" || payload.sync_interval_minutes <= 0) payload.sync_interval_minutes = 180;
      const response = await fetch(`${API_BASE_URL}/api/admin/jobs/companies`, { method: "POST", headers: getAuthHeaders(), body: JSON.stringify(payload) });
      let data = {};
      try { data = await response.json(); } catch { data = {}; }
      if (!response.ok) throw new Error(data?.error || "Failed to create company");
      setJobMessage(`Added ${data.company?.name || "company"}.`);
      setNewCompany({ name: "", website_url: "", careers_url: "", ats_provider: payload.ats_provider, external_identifier: "", sync_interval_minutes: 180 });
      setJobPage(1);
      await loadJobCompanies(1);
    } catch (err) {
      setJobError(err.message || "Failed to create company");
    }
  };

  const handleTriggerJobSync = async (companyId) => {
    setJobError("");
    setJobMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/jobs/companies/${companyId}/sync`, { method: "POST", headers: getAuthHeaders() });
      let data = {};
      try { data = await response.json(); } catch { data = {}; }
      if (!response.ok) throw new Error(data?.error || "Failed to trigger sync");
      setJobMessage(`Sync started. Found ${data?.result?.jobsFound ?? data?.result?.jobs_found ?? 0} jobs.`);
      await loadJobCompanies(jobPage);
    } catch (err) {
      setJobError(err.message || "Failed to trigger sync");
    }
  };

  const handleTriggerSyncAll = async () => {
    setJobError("");
    setJobMessage("");
    setSyncingAll(true);

    const formatProgress = (status) => {
      const r = status?.last_result || {};
      const total = r.total_companies ?? 0;
      const succeeded = r.succeeded ?? 0;
      const failed = r.failed ?? 0;
      const processed = succeeded + failed;
      if (status?.running) {
        if (total > 0) {
          const pct = total > 0 ? Math.round((processed / total) * 100) : 0;
          return `Syncing... ${processed} / ${total} companies (${pct}%) — ${succeeded} OK, ${failed} failed`;
        }
        return "Sync started, gathering company list...";
      }
      if (status?.last_error) {
        return `Sync ended with error: ${status.last_error}. ${succeeded} OK, ${failed} failed.`;
      }
      const found = r.total_jobs_found ?? 0;
      const created = r.total_jobs_created ?? 0;
      const updated = r.total_jobs_updated ?? 0;
      const closed = r.total_jobs_closed ?? 0;
      return `Sync done. ${succeeded} OK, ${failed} failed. Jobs: ${found} found (${created} new, ${updated} updated, ${closed} closed).`;
    };

    const pollUntilDone = async () => {
      // poll every 3s until status.running becomes false
      while (true) {
        let statusResp;
        try {
          statusResp = await fetch(`${API_BASE_URL}/api/admin/jobs/companies/sync-all/status`, {
            headers: getAuthHeaders(),
          });
        } catch (err) {
          setJobMessage(`Lost connection while polling: ${err.message}`);
          return;
        }
        let status = {};
        try { status = await statusResp.json(); } catch {}
        setJobMessage(formatProgress(status));
        if (!status?.running) {
          // Final refresh of the company list once the run is over
          await loadJobCompanies(jobPage);
          return;
        }
        await new Promise((r) => setTimeout(r, 3000));
      }
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/jobs/companies/sync-all`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      let data = {};
      try { data = await response.json(); } catch { data = {}; }

      if (response.status === 409) {
        // Already running — pick up the existing run and poll it
        setJobMessage("A sync is already running — tracking progress...");
      } else if (!response.ok) {
        throw new Error(data?.error || "Failed to start sync");
      } else {
        setJobMessage(formatProgress(data?.status));
      }

      await pollUntilDone();
    } catch (err) {
      setJobError(err.message || "Failed to sync");
    } finally {
      setSyncingAll(false);
    }
  };

  const handleCompanyStatusChange = async (companyId, nextActive) => {
    setJobError("");
    setJobMessage("");
    setJobStatusUpdating((p) => ({ ...p, [companyId]: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/jobs/companies/${companyId}/status`, { method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify({ is_active: nextActive }) });
      let payload = {};
      try { payload = await response.json(); } catch { payload = {}; }
      if (!response.ok) throw new Error(payload?.error || "Failed to update status");
      setJobMessage(nextActive ? "Company reactivated." : "Company paused.");
      await loadJobCompanies(jobPage);
    } catch (err) {
      setJobError(err.message || "Failed to update status");
    } finally {
      setJobStatusUpdating((p) => { const n = { ...p }; delete n[companyId]; return n; });
    }
  };

  const handleJobPageChange = (p) => { if (p >= 1 && p <= jobTotalPages) { setJobPage(p); loadJobCompanies(p); } };

  const handleImportCompanies = async (file) => {
    setImportErrors([]);
    setJobError("");
    setJobMessage("");
    setImportingCompanies(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const headers = { ...getAuthHeaders() };
      delete headers["Content-Type"];
      const response = await fetch(`${API_BASE_URL}/api/admin/jobs/companies/import`, { method: "POST", headers, body: formData });
      let payload = {};
      try { payload = await response.json(); } catch { payload = {}; }
      if (!response.ok) throw new Error(payload?.error || "Failed to import");
      const summary = payload.summary;
      if (summary?.errors) setImportErrors(summary.errors);
      else setImportErrors([]);
      if (summary && typeof summary === "object") {
        setJobMessage(`Processed ${summary.processed_rows ?? summary.processed ?? 0} of ${summary.total_rows ?? summary.total ?? 0} rows. ${summary.inserted ?? 0} inserted, ${summary.updated ?? 0} updated${(summary.skipped ?? 0) > 0 ? `, ${summary.skipped} skipped` : ""}.`);
      } else {
        setJobMessage(payload.message || "Import completed.");
      }
      setJobPage(1);
      await loadJobCompanies(1);
    } catch (err) {
      setJobError(err.message || "Failed to import");
    } finally {
      setImportingCompanies(false);
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  const handleImportButtonClick = () => importInputRef.current?.click();
  const handleImportInputChange = (e) => { const f = e.target.files?.[0]; if (f) handleImportCompanies(f); };

  const formatPlanPreference = (v) => {
    if (!v) return "-";
    const n = String(v).toLowerCase();
    if (n === "free") return "Free";
    if (n === "premium") return "Premium";
    if (n === "ultimate") return "Ultimate";
    return v;
  };

  // ── Stats ─────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = users.length;
    const paid = users.filter((u) => u.plan_name && u.plan_name !== "free").length;
    const admins = users.filter((u) => u.is_admin).length;
    const optedIn = users.filter((u) => u.marketing_opt_in).length;
    return { total, paid, free: total - paid, admins, optedIn };
  }, [users]);

  // ── Render ────────────────────────────────────────────────

  if (loading) return <div style={{ padding: "2rem" }}>Loading...</div>;
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="admin-membership-page">
      <SEO
        title="Admin Dashboard | Manage Users & ATS Companies | HiHired"
        description="Monitor memberships, manage ATS integrations, and trigger job syncs."
        canonical="https://hihired.org/admin/memberships"
        keywords="hihired admin, ats sync management"
      />
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>

      <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>Admin Dashboard</h1>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link to="/admin/analytics" style={{ display: "inline-flex", alignItems: "center", padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid #2563eb", color: "#fff", background: "#2563eb", fontWeight: 600, textDecoration: "none", fontSize: "0.85rem" }}>Analytics</Link>
            <Link to="/admin/experiments" style={{ display: "inline-flex", alignItems: "center", padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid #10b981", color: "#0f172a", background: "#34d399", fontWeight: 600, textDecoration: "none", fontSize: "0.85rem" }}>A/B Tests</Link>
            <Link to="/admin/jobs" style={{ display: "inline-flex", alignItems: "center", padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid #f59e0b", color: "#0f172a", background: "#fbbf24", fontWeight: 600, textDecoration: "none", fontSize: "0.85rem" }}>Jobs</Link>
          </div>
        </div>

        {/* Alerts */}
        {error && <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1rem" }}>{error}</div>}
        {message && <div style={{ background: "#dcfce7", border: "1px solid #86efac", color: "#166534", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1rem" }}>{message}</div>}

        {/* Stats Cards */}
        {!loadingData && (
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "1.5rem" }}>
            <div style={cardStyle}>
              <div style={{ fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Users</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827" }}>{stats.total}</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Paid</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#059669" }}>{stats.paid}</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Free</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#6b7280" }}>{stats.free}</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>Marketing Opt-in</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#2563eb" }}>{stats.optedIn}</div>
            </div>
            <div style={cardStyle}>
              <div style={{ fontSize: "0.75rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>ATS Companies</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f59e0b" }}>{jobTotalCount}</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid #e5e7eb", marginBottom: "1.5rem" }}>
          <button type="button" onClick={() => setActiveTab("users")} style={tabStyle(activeTab === "users")}>Users ({filteredUsers.length})</button>
          <button type="button" onClick={() => setActiveTab("ats")} style={tabStyle(activeTab === "ats")}>ATS Job Sync ({jobTotalCount})</button>
        </div>

        {/* ═══ Users Tab ═══ */}
        {activeTab === "users" && (
          <div>
            {/* Toolbar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button type="button" onClick={loadData} disabled={loadingData} style={{ padding: "0.45rem 0.9rem", borderRadius: "6px", border: "1px solid #d1d5db", background: loadingData ? "#e5e7eb" : "#fff", cursor: loadingData ? "not-allowed" : "pointer", fontWeight: 500 }}>
                  {loadingData ? "Refreshing..." : "Refresh"}
                </button>
                <button type="button" onClick={() => handleDownloadEmails(false)} disabled={emailExportMode !== null} style={{ padding: "0.45rem 0.9rem", borderRadius: "6px", border: "1px solid #22c55e", background: emailExportMode === "opted" ? "#e5e7eb" : "#22c55e", color: emailExportMode === "opted" ? "#6b7280" : "#fff", cursor: emailExportMode ? "not-allowed" : "pointer", fontWeight: 500 }}>
                  {emailExportMode === "opted" ? "Preparing..." : "Export Opted-in"}
                </button>
                <button type="button" onClick={() => handleDownloadEmails(true)} disabled={emailExportMode !== null} style={{ padding: "0.45rem 0.9rem", borderRadius: "6px", border: "1px solid #0ea5e9", background: emailExportMode === "all" ? "#e5e7eb" : "#0ea5e9", color: emailExportMode === "all" ? "#6b7280" : "#fff", cursor: emailExportMode ? "not-allowed" : "pointer", fontWeight: 500 }}>
                  {emailExportMode === "all" ? "Preparing..." : "Export All"}
                </button>
              </div>
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by email or name..." style={{ padding: "0.45rem 0.75rem", borderRadius: "6px", border: "1px solid #d1d5db", minWidth: "220px" }} />
            </div>

            {loadingData ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#4b5563" }}>Loading...</div>
            ) : (
              <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                    <thead style={{ background: "#f9fafb", textAlign: "left" }}>
                      <tr>
                        {["User", "Plan", "Status", "Limit", "Period End", "Opt-in", "Interest", "Actions"].map((h) => (
                          <th key={h} style={{ padding: "0.65rem 0.75rem", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedUsers.map((entry) => {
                        const planSelection = selectedPlans[entry.id] || entry.plan_name || "free";
                        const isSelf = user?.email && user.email === entry.email;
                        return (
                          <tr key={entry.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                            <td style={{ padding: "0.6rem 0.75rem" }}>
                              <div style={{ fontWeight: 600, color: "#111827", fontSize: "0.85rem" }}>{entry.email}</div>
                              <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{entry.name || "(no name)"}</div>
                              {entry.is_admin && <span style={{ display: "inline-block", background: "#eef2ff", color: "#4338ca", fontSize: "0.65rem", padding: "1px 6px", borderRadius: "999px", marginTop: "2px" }}>Admin</span>}
                              {isSelf && !entry.is_admin && <span style={{ display: "inline-block", background: "#fef3c7", color: "#b45309", fontSize: "0.65rem", padding: "1px 6px", borderRadius: "999px", marginTop: "2px" }}>You</span>}
                            </td>
                            <td style={{ padding: "0.6rem 0.75rem" }}>
                              <select value={planSelection} onChange={(e) => handlePlanChange(entry.id, e.target.value)} style={{ padding: "0.35rem 0.5rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.8rem", width: "100%" }}>
                                {planOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                {!planOptions.some((o) => o.value === planSelection) && <option value={planSelection}>{planSelection}</option>}
                              </select>
                            </td>
                            <td style={{ padding: "0.6rem 0.75rem" }}>
                              <div style={{ fontSize: "0.85rem", fontWeight: 500 }}>{entry.billing_status || entry.subscription_status || "-"}</div>
                              {entry.cancel_at_period_end && <div style={{ fontSize: "0.7rem", color: "#b91c1c" }}>Cancels at end</div>}
                            </td>
                            <td style={{ padding: "0.6rem 0.75rem", fontSize: "0.85rem" }}>{entry.resume_limit ?? "-"}</td>
                            <td style={{ padding: "0.6rem 0.75rem", fontSize: "0.85rem" }}>{formatDate(entry.current_period_end)}</td>
                            <td style={{ padding: "0.6rem 0.75rem" }}>
                              <span style={{ fontWeight: 500, color: entry.marketing_opt_in ? "#047857" : "#9ca3af", fontSize: "0.85rem" }}>{entry.marketing_opt_in ? "Yes" : "No"}</span>
                            </td>
                            <td style={{ padding: "0.6rem 0.75rem", fontSize: "0.85rem" }}>{formatPlanPreference(entry.signup_plan_preference)}</td>
                            <td style={{ padding: "0.6rem 0.75rem" }}>
                              <button type="button" onClick={() => handleUpdate(entry.id)} disabled={!!updating[entry.id]} style={{ padding: "0.35rem 0.7rem", borderRadius: "6px", border: "none", background: updating[entry.id] ? "#e5e7eb" : "#2563eb", color: updating[entry.id] ? "#6b7280" : "#fff", cursor: updating[entry.id] ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "0.8rem" }}>
                                {updating[entry.id] ? "..." : "Update"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {filteredUsers.length === 0 && (
                  <div style={{ padding: "1.5rem", textAlign: "center", color: "#6b7280" }}>{users.length === 0 ? "No users found." : "No users match your search."}</div>
                )}

                {/* User Pagination */}
                {filteredUsers.length > USER_PAGE_SIZE && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", borderTop: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: "0.8rem", color: "#4b5563" }}>
                      Showing {(userPage - 1) * USER_PAGE_SIZE + 1}-{Math.min(filteredUsers.length, userPage * USER_PAGE_SIZE)} of {filteredUsers.length}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <button type="button" onClick={() => setUserPage((p) => Math.max(1, p - 1))} disabled={userPage <= 1} style={{ padding: "0.35rem 0.7rem", borderRadius: "6px", border: "1px solid #d1d5db", background: userPage <= 1 ? "#f3f4f6" : "#fff", color: userPage <= 1 ? "#9ca3af" : "#1f2937", cursor: userPage <= 1 ? "not-allowed" : "pointer", fontSize: "0.8rem" }}>Prev</button>
                      <span style={{ fontSize: "0.8rem", color: "#4b5563" }}>Page {userPage} / {userTotalPages}</span>
                      <button type="button" onClick={() => setUserPage((p) => Math.min(userTotalPages, p + 1))} disabled={userPage >= userTotalPages} style={{ padding: "0.35rem 0.7rem", borderRadius: "6px", border: "1px solid #d1d5db", background: userPage >= userTotalPages ? "#f3f4f6" : "#fff", color: userPage >= userTotalPages ? "#9ca3af" : "#1f2937", cursor: userPage >= userTotalPages ? "not-allowed" : "pointer", fontSize: "0.8rem" }}>Next</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══ ATS Tab ═══ */}
        {activeTab === "ats" && (
          <div>
            {/* ATS Alerts */}
            {jobError && <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "0.75rem" }}>{jobError}</div>}
            {jobMessage && <div style={{ background: "#dbeafe", border: "1px solid #93c5fd", color: "#1d4ed8", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "0.75rem" }}>{jobMessage}</div>}
            {importErrors.length > 0 && (
              <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", color: "#92400e", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "0.75rem" }}>
                <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Import errors:</div>
                <ul style={{ paddingLeft: "1.25rem", margin: 0 }}>{importErrors.map((issue, i) => <li key={`${issue.row ?? i}-${issue.message}`} style={{ marginBottom: "0.25rem" }}>Row {issue.row ?? issue.Row ?? i + 1}: {issue.message}</li>)}</ul>
              </div>
            )}

            {/* ATS Toolbar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0 }}>ATS Companies</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                <button type="button" onClick={handleImportButtonClick} disabled={importingCompanies} style={{ padding: "0.45rem 0.9rem", borderRadius: "6px", border: "1px solid #d1d5db", background: importingCompanies ? "#e5e7eb" : "#fff", cursor: importingCompanies ? "not-allowed" : "pointer", fontWeight: 500 }}>
                  {importingCompanies ? "Importing..." : "Import CSV"}
                </button>
                <button type="button" onClick={handleTriggerSyncAll} disabled={syncingAll || jobLoading} style={{ padding: "0.45rem 0.9rem", borderRadius: "6px", border: "1px solid #2563eb", background: syncingAll || jobLoading ? "#e5e7eb" : "#2563eb", color: syncingAll || jobLoading ? "#6b7280" : "#fff", cursor: syncingAll || jobLoading ? "not-allowed" : "pointer", fontWeight: 600 }}>
                  {syncingAll ? "Syncing..." : "Sync All"}
                </button>
                <button type="button" onClick={() => loadJobCompanies(jobPage)} disabled={jobLoading} style={{ padding: "0.45rem 0.9rem", borderRadius: "6px", border: "1px solid #d1d5db", background: jobLoading ? "#e5e7eb" : "#fff", cursor: jobLoading ? "not-allowed" : "pointer", fontWeight: 500 }}>
                  {jobLoading ? "..." : "Refresh"}
                </button>
              </div>
              <input type="file" accept=".csv,text/csv" ref={importInputRef} style={{ display: "none" }} onChange={handleImportInputChange} />
            </div>

            {/* Add Company Form */}
            <form onSubmit={handleCreateCompany} style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "1rem", marginBottom: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4b5563" }}>Company Name</label>
                <input type="text" value={newCompany.name} onChange={(e) => handleNewCompanyChange("name", e.target.value)} placeholder="Acme Corp" style={{ padding: "0.4rem 0.6rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.85rem" }} required />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4b5563" }}>Careers URL</label>
                <input type="url" value={newCompany.careers_url} onChange={(e) => handleNewCompanyChange("careers_url", e.target.value)} placeholder="https://boards.greenhouse.io/..." style={{ padding: "0.4rem 0.6rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.85rem" }} required />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4b5563" }}>ATS Provider</label>
                <select value={newCompany.ats_provider} onChange={(e) => handleNewCompanyChange("ats_provider", e.target.value)} style={{ padding: "0.4rem 0.6rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.85rem" }} required>
                  <option value="greenhouse">Greenhouse</option>
                  <option value="lever">Lever</option>
                  <option value="workday">Workday</option>
                  <option value="ashby">Ashby</option>
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4b5563" }}>Board Token</label>
                <input type="text" value={newCompany.external_identifier} onChange={(e) => handleNewCompanyChange("external_identifier", e.target.value)} placeholder="company-board" style={{ padding: "0.4rem 0.6rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.85rem" }} />
              </div>
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button type="submit" disabled={jobLoading} style={{ padding: "0.5rem 1rem", borderRadius: "6px", border: "none", background: jobLoading ? "#e5e7eb" : "#2563eb", color: jobLoading ? "#6b7280" : "#fff", fontWeight: 600, cursor: jobLoading ? "not-allowed" : "pointer", fontSize: "0.85rem" }}>
                  {jobLoading ? "..." : "Add Company"}
                </button>
              </div>
            </form>

            {/* Companies Table */}
            <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
              {jobLoading ? (
                <div style={{ padding: "1.5rem", textAlign: "center", color: "#4b5563" }}>Loading...</div>
              ) : jobCompanies.length === 0 ? (
                <div style={{ padding: "1.5rem", textAlign: "center", color: "#6b7280" }}>No companies configured.</div>
              ) : (
                <div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                      <thead style={{ background: "#f9fafb", textAlign: "left" }}>
                        <tr>
                          {["Company", "ATS", "Last Sync", "Status", "Actions"].map((h) => (
                            <th key={h} style={{ padding: "0.65rem 0.75rem", fontSize: "0.8rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {jobCompanies.map((company) => (
                          <tr key={company.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                            <td style={{ padding: "0.6rem 0.75rem" }}>
                              <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{company.name}</div>
                              <a href={company.careers_url} target="_blank" rel="noreferrer" style={{ fontSize: "0.75rem", color: "#2563eb", wordBreak: "break-all" }}>{company.careers_url}</a>
                              {company.external_identifier && <div style={{ fontSize: "0.7rem", color: "#6b7280", marginTop: "2px" }}>ID: {company.external_identifier}</div>}
                            </td>
                            <td style={{ padding: "0.6rem 0.75rem" }}>
                              <div style={{ textTransform: "capitalize", fontSize: "0.85rem" }}>{company.ats_provider || "Unknown"}</div>
                              {company.sync_interval_minutes && <div style={{ fontSize: "0.7rem", color: "#6b7280" }}>Every {company.sync_interval_minutes}m</div>}
                            </td>
                            <td style={{ padding: "0.6rem 0.75rem" }}>
                              <div style={{ fontSize: "0.85rem" }}>{company.last_synced_at ? new Date(company.last_synced_at).toLocaleString() : "Never"}</div>
                              {company.last_sync_status && <div style={{ fontSize: "0.7rem", color: "#6b7280" }}>{company.last_sync_status}</div>}
                            </td>
                            <td style={{ padding: "0.6rem 0.75rem" }}>
                              <span style={{ fontWeight: 600, color: company.is_active ? "#15803d" : "#b91c1c", fontSize: "0.85rem" }}>{company.is_active ? "Active" : "Paused"}</span>
                              {company.sync_failure_count > 0 && <div style={{ fontSize: "0.7rem", color: "#b91c1c" }}>Failures: {company.sync_failure_count}</div>}
                              {company.last_sync_error && <div style={{ fontSize: "0.7rem", color: "#b91c1c", wordBreak: "break-word" }}>{company.last_sync_error}</div>}
                            </td>
                            <td style={{ padding: "0.6rem 0.75rem" }}>
                              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                                <button type="button" onClick={() => handleTriggerJobSync(company.id)} disabled={!company.is_active || syncingAll || !!jobStatusUpdating[company.id]} style={{ padding: "0.35rem 0.7rem", borderRadius: "6px", border: "none", background: !company.is_active || syncingAll ? "#e5e7eb" : "#2563eb", color: !company.is_active || syncingAll ? "#6b7280" : "#fff", fontWeight: 600, cursor: !company.is_active || syncingAll ? "not-allowed" : "pointer", fontSize: "0.8rem" }}>Sync</button>
                                <button type="button" onClick={() => handleCompanyStatusChange(company.id, !company.is_active)} disabled={!!jobStatusUpdating[company.id]} style={{ padding: "0.35rem 0.7rem", borderRadius: "6px", border: "none", background: jobStatusUpdating[company.id] ? "#e5e7eb" : company.is_active ? "#f97316" : "#059669", color: jobStatusUpdating[company.id] ? "#6b7280" : "#fff", fontWeight: 600, cursor: jobStatusUpdating[company.id] ? "not-allowed" : "pointer", fontSize: "0.8rem" }}>{company.is_active ? "Pause" : "Resume"}</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* ATS Pagination */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", borderTop: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: "0.8rem", color: "#4b5563" }}>{jobTotalCount === 0 ? "No companies." : `Showing ${jobStartIndex}-${jobEndIndex} of ${jobTotalCount}`}</div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <button type="button" onClick={() => handleJobPageChange(jobPage - 1)} disabled={jobPage <= 1 || jobLoading} style={{ padding: "0.35rem 0.7rem", borderRadius: "6px", border: "1px solid #d1d5db", background: jobPage <= 1 ? "#f3f4f6" : "#fff", color: jobPage <= 1 ? "#9ca3af" : "#1f2937", cursor: jobPage <= 1 ? "not-allowed" : "pointer", fontSize: "0.8rem" }}>Prev</button>
                      <span style={{ fontSize: "0.8rem", color: "#4b5563" }}>Page {jobTotalCount === 0 ? 1 : jobPage} / {Math.max(1, jobTotalPages)}</span>
                      <button type="button" onClick={() => handleJobPageChange(jobPage + 1)} disabled={jobPage >= jobTotalPages || jobLoading || jobTotalCount === 0} style={{ padding: "0.35rem 0.7rem", borderRadius: "6px", border: "1px solid #d1d5db", background: jobPage >= jobTotalPages ? "#f3f4f6" : "#fff", color: jobPage >= jobTotalPages ? "#9ca3af" : "#1f2937", cursor: jobPage >= jobTotalPages ? "not-allowed" : "pointer", fontSize: "0.8rem" }}>Next</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMembershipPage;
