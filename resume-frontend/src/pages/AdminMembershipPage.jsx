import React, { useEffect, useMemo, useState } from "react";
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

  const API_BASE_URL = getAPIBaseURL();

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
    } catch (err) {
      console.error("Failed to load admin data", err);
      setError(err.message || "Failed to load admin data");
    } finally {
      setLoadingData(false);
    }
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

