import React, { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAPIBaseURL } from "../api";
import SEO from "../components/SEO";

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
  const jobStartIndex = jobTotalCount === 0 ? 0 : (jobPage - 1) * 20 + 1;
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
      page_size: '20',
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

  // ... existing handlers and JSX remain unchanged

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading…</div>;
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="admin-membership-page">
      <SEO
        title="Admin Dashboard | Manage Users & ATS Companies | HiHired"
        description="Monitor memberships, manage ATS integrations, and trigger job syncs from the HiHired admin dashboard."
        canonical="https://hihired.org/admin/memberships"
        keywords="hihired admin, ats sync management, resume builder admin"
      />
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      {/* existing JSX */}
    </div>
  );
};

export default AdminMembershipPage;
