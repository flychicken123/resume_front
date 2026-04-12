import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAPIBaseURL } from '../api';
import SEO from '../components/SEO';

const RANGE_OPTIONS = [
  { label: 'Today', value: 1 },
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 14 days', value: 14 },
  { label: 'Last 30 days', value: 30 },
];

const formatDateTime = (value) => {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDuration = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    return '—';
  }
  return `${value.toFixed(1)}s`;
};

const formatPercentage = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    return '—';
  }
  return `${value.toFixed(1)}%`;
};

const AdminExitAnalyticsPage = () => {
  const { user, isAdmin, loading, getAuthHeaders } = useAuth();
  const [rangeDays, setRangeDays] = useState(14);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const API_BASE_URL = getAPIBaseURL();

  useEffect(() => {
    if (loading || !isAdmin) {
      return;
    }

    let isCancelled = false;
    const controller = new AbortController();

    const loadSummary = async () => {
      setFetching(true);
      setError('');

      try {
        const headers = getAuthHeaders ? getAuthHeaders() : { 'Content-Type': 'application/json' };
        const params = new URLSearchParams({ days: String(rangeDays) });
        const response = await fetch(`${API_BASE_URL}/api/admin/analytics/exit-summary?${params.toString()}`, {
          method: 'GET',
          headers,
          signal: controller.signal,
        });

        if (!response.ok) {
          let message = 'Failed to load exit analytics';
          try {
            const payload = await response.json();
            if (payload && typeof payload.error === 'string') {
              message = payload.error;
            }
          } catch (parseErr) {
            // ignore JSON parse errors, we'll use default message
          }
          throw new Error(message);
        }

        const payload = await response.json();
        if (!isCancelled) {
          setSummary(payload);
        }
      } catch (err) {
        if (!isCancelled) {
          if (err.name === 'AbortError') {
            return;
          }
          setError(err.message || 'Failed to load exit analytics');
          setSummary(null);
        }
      } finally {
        if (!isCancelled) {
          setFetching(false);
        }
      }
    };

    loadSummary();

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [API_BASE_URL, getAuthHeaders, isAdmin, loading, rangeDays, refreshCount]);

  const totals = useMemo(() => {
    if (!summary) {
      return { exits: 0, uniquePages: 0 };
    }
    return {
      exits: summary.total_exits ?? 0,
      uniquePages: summary.unique_pages ?? 0,
    };
  }, [summary]);

  if (!loading && !user) {
    return <Navigate to="/login" replace />;
  }

  if (!loading && user && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const pageSummaries = summary?.page_summaries ?? [];
  const referrerSummaries = summary?.home_referrers ?? [];
  const sinceLabel = formatDateTime(summary?.since);
  const untilLabel = formatDateTime(summary?.until);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <SEO
        title="Exit Analytics — HiHired Admin"
        description="Bounce and exit analytics across your HiHired funnel."
        canonical="https://hihired.org/admin/analytics"
      />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px 60px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem', color: '#0f172a' }}>Exit Funnel Analytics</h1>
            <p style={{ margin: '8px 0 0', color: '#475569' }}>
              Understand where visitors drop off and how long they engage before leaving.
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/admin/memberships"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: 10,
                textDecoration: 'none',
                border: '1px solid #0f172a',
                background: '#0f172a',
                color: '#ffffff',
                fontWeight: 600,
                boxShadow: '0 6px 12px rgba(15, 23, 42, 0.18)',
              }}
            >
              Back to Memberships
            </Link>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <label htmlFor="exit-range" style={{ color: '#334155', fontWeight: 600 }}>
              Time Range
            </label>
            <select
              id="exit-range"
              value={rangeDays}
              onChange={(event) => setRangeDays(Number(event.target.value))}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5f5',
                background: '#ffffff',
                fontWeight: 500,
              }}
            >
              {RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setRefreshCount((count) => count + 1)}
              disabled={fetching}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: '1px solid #2563eb',
                background: fetching ? '#dbeafe' : '#2563eb',
                color: fetching ? '#475569' : '#ffffff',
                cursor: fetching ? 'not-allowed' : 'pointer',
                fontWeight: 600,
              }}
            >
              {fetching ? 'Refreshing…' : 'Refresh'}
            </button>
            <div style={{ marginLeft: 'auto', color: '#64748b', fontSize: '0.9rem' }}>
              <span>Since {sinceLabel}</span>
              <span style={{ margin: '0 6px' }}>→</span>
              <span>{untilLabel}</span>
            </div>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              borderRadius: 8,
              border: '1px solid #fca5a5',
              background: '#fee2e2',
              color: '#b91c1c',
              padding: '12px 16px',
              marginBottom: '24px',
            }}
          >
            {error}
          </div>
        )}

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              borderRadius: 12,
              padding: '18px 20px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              boxShadow: '0 10px 20px rgba(15, 23, 42, 0.04)',
            }}
          >
            <div style={{ color: '#475569', fontSize: '0.85rem', marginBottom: '6px' }}>Exit events</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a' }}>
              {totals.exits.toLocaleString()}
            </div>
          </div>
          <div
            style={{
              borderRadius: 12,
              padding: '18px 20px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              boxShadow: '0 10px 20px rgba(15, 23, 42, 0.04)',
            }}
          >
            <div style={{ color: '#475569', fontSize: '0.85rem', marginBottom: '6px' }}>Pages affected</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a' }}>
              {totals.uniquePages.toLocaleString()}
            </div>
          </div>
          <div
            style={{
              borderRadius: 12,
              padding: '18px 20px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              boxShadow: '0 10px 20px rgba(15, 23, 42, 0.04)',
            }}
          >
            <div style={{ color: '#475569', fontSize: '0.85rem', marginBottom: '6px' }}>Top exit page</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 600, color: '#0f172a' }}>
              {pageSummaries.length > 0 ? pageSummaries[0].page_path : '—'}
            </div>
          </div>
        </section>

        <section style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a' }}>Exit events by page</h2>
            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
              Showing top {pageSummaries.length} pages
            </span>
          </div>
          <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #e2e8f0', background: '#ffffff' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '720px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>Page</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>Exits</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>Avg session</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>Avg on page</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>Last step delta</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>Direct exits</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#475569', fontWeight: 600, minWidth: '160px' }}>Top reasons</th>
                </tr>
              </thead>
              <tbody>
                {pageSummaries.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: '24px 16px', textAlign: 'center', color: '#94a3b8' }}>
                      {fetching ? 'Loading exit data…' : 'No exit events found for this range.'}
                    </td>
                  </tr>
                )}
                {pageSummaries.map((row) => (
                  <tr key={row.page_path} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px 16px', color: '#0f172a', fontWeight: 500 }}>{row.page_path}</td>
                    <td style={{ padding: '12px 16px', color: '#0f172a' }}>{row.exit_count.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', color: '#334155' }}>{formatDuration(row.avg_session_seconds)}</td>
                    <td style={{ padding: '12px 16px', color: '#334155' }}>{formatDuration(row.avg_page_seconds)}</td>
                    <td style={{ padding: '12px 16px', color: '#334155' }}>{formatDuration(row.avg_last_step_seconds)}</td>
                    <td style={{ padding: '12px 16px', color: '#334155' }}>{formatPercentage(row.direct_exit_rate)}</td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>
                      {Array.isArray(row.top_reasons) && row.top_reasons.length > 0 ? (
                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {row.top_reasons.map((reason) => (
                            <li key={`${row.page_path}-${reason.reason}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                              <span>{reason.reason}</span>
                              <span style={{ color: '#0f172a', fontWeight: 600 }}>
                                {formatPercentage(reason.share)} · {reason.count.toLocaleString()}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#0f172a' }}>Home exits by referrer</h2>
            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
              Focused on visitors who drop from the landing page
            </span>
          </div>
          <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #e2e8f0', background: '#ffffff' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '520px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>Referrer</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>Exits</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>Avg on page</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>Avg session</th>
                </tr>
              </thead>
              <tbody>
                {referrerSummaries.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '24px 16px', textAlign: 'center', color: '#94a3b8' }}>
                      {fetching ? 'Loading referrer data…' : 'No referrers recorded for this range.'}
                    </td>
                  </tr>
                )}
                {referrerSummaries.map((row) => (
                  <tr key={row.referrer} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px 16px', color: '#0f172a', fontWeight: 500 }}>{row.referrer}</td>
                    <td style={{ padding: '12px 16px', color: '#0f172a' }}>{row.exit_count.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', color: '#334155' }}>{formatDuration(row.avg_page_seconds)}</td>
                    <td style={{ padding: '12px 16px', color: '#334155' }}>{formatDuration(row.avg_session_seconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminExitAnalyticsPage;
