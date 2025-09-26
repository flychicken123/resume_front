import React from "react";

const badgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "0.15rem 0.55rem",
  borderRadius: "999px",
  fontSize: "0.75rem",
  fontWeight: 500,
  background: "#eef2ff",
  color: "#4338ca",
  marginRight: "0.5rem",
  marginBottom: "0.5rem"
};

const COUNTRY_LABELS = {
  us: 'United States',
  uk: 'United Kingdom',
  ca: 'Canada',
  au: 'Australia',
  de: 'Germany',
  fr: 'France',
  in: 'India',
  sg: 'Singapore',
  nz: 'New Zealand'
};

const JobRecommendations = ({
  matches = [],
  loading = false,
  error = null,
  onRetry,
  onClose,
  metadata = {}
}) => {
  const safeMetadata = metadata || {};
  const countryCode = safeMetadata.countryHint ? safeMetadata.countryHint.toLowerCase() : '';
  const countryLabel = countryCode ? (COUNTRY_LABELS[countryCode] || countryCode.toUpperCase()) : '';

  const hasMatches = matches && matches.length > 0;
  const resumeKeywords = safeMetadata.resumeKeywords || [];
  const providersUsed = safeMetadata.providersUsed || [];
  const providersSkipped = safeMetadata.providersSkipped || [];
  const fetchedAt = safeMetadata.fetchedAt instanceof Date ? safeMetadata.fetchedAt : (safeMetadata.fetchedAt ? new Date(safeMetadata.fetchedAt) : null);
  const fetchedLabel = fetchedAt ? fetchedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : null;

  return (
    <div style={{
      marginTop: "1rem",
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: "16px",
      padding: "1.5rem",
      boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
      display: "flex",
      flexDirection: "column",
      gap: "1rem"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
        <div>
          <h3 style={{ margin: 0, color: "#0f172a", fontSize: "1.25rem" }}>Recommended Jobs</h3>
          <p style={{ margin: "0.35rem 0 0", color: "#475569", fontSize: "0.9rem" }}>
            Tailored matches using your resume details{countryLabel ? ` · focused on ${countryLabel}` : ''}{resumeKeywords.length > 0 ? ` · focus on ${resumeKeywords.slice(0, 3).join(', ')}` : ''}{fetchedLabel ? ` · updated ${fetchedLabel}` : ''}
            {fetchedLabel ? ` · updated ${fetchedLabel}` : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={onRetry}
            disabled={loading}
            style={{
              padding: "0.4rem 0.85rem",
              borderRadius: "8px",
              border: "1px solid #cbd5f5",
              background: loading ? "#e0e7ff" : "#eef2ff",
              color: "#4338ca",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 500,
              fontSize: "0.85rem"
            }}
          >
            {loading ? "Refreshing…" : "Refresh matches"}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "0.4rem 0.85rem",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              background: "white",
              color: "#475569",
              cursor: "pointer",
              fontSize: "0.85rem"
            }}
          >
            Hide
          </button>
        </div>
      </div>

      {providersUsed.length > 0 && (
        <div style={{ color: "#6366f1", fontSize: "0.8rem" }}>
          Sources: {providersUsed.join(", ")}
          {providersSkipped.length > 0 && (
            <span style={{ color: "#94a3b8", marginLeft: "0.5rem" }}>
              (skipped: {providersSkipped.join(", ")})
            </span>
          )}
        </div>
      )}

      {error && !loading && (
        <div style={{
          padding: "0.9rem 1.1rem",
          borderRadius: "12px",
          background: "#fef2f2",
          border: "1px solid #fecaca",
          color: "#b91c1c",
          fontSize: "0.9rem"
        }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{
          padding: "0.9rem 1.1rem",
          borderRadius: "12px",
          background: "#fff",
          border: "1px dashed #cbd5f5",
          color: "#6366f1",
          fontSize: "0.9rem"
        }}>
          Matching your resume to current openings…
        </div>
      )}

      {!loading && !error && !hasMatches && (
        <div style={{
          padding: "1.1rem 1.2rem",
          borderRadius: "12px",
          background: "#fff",
          border: "1px dashed #cbd5f5",
          color: "#475569",
          textAlign: "center",
          fontSize: "0.9rem"
        }}>
          No close matches yet. Try refreshing after editing your resume or adding a job description.
        </div>
      )}

      {hasMatches && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "1rem"
        }}>
          {matches.map((job) => (
            <div
              key={`${job.source}:${job.sourceId}`}
              style={{
                background: "white",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                padding: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.65rem",
                boxShadow: "0 6px 16px rgba(15, 23, 42, 0.06)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b" }}>{job.source}</div>
                  <h4 style={{ margin: "0.2rem 0 0", color: "#0f172a", fontSize: "1.05rem" }}>{job.title}</h4>
                  <p style={{ margin: "0.15rem 0 0", color: "#475569", fontSize: "0.9rem" }}>
                    {job.company || "Hiring company"} · {job.location || "Location not provided"}
                  </p>
                </div>
                <span style={{
                  display: "inline-flex",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "10px",
                  background: job.score >= 7 ? "#dcfce7" : job.score >= 4 ? "#fef9c3" : "#e2e8f0",
                  color: job.score >= 7 ? "#166534" : job.score >= 4 ? "#92400e" : "#475569",
                  fontSize: "0.75rem",
                  fontWeight: 600
                }}>
                  {job.score > 0 ? `${job.scoreLabel}` : "Suggested"}
                </span>
              </div>

              {job.matchedSkills && job.matchedSkills.length > 0 && (
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.3rem" }}>Matched skills</div>
                  <div>
                    {job.matchedSkills.slice(0, 4).map((skill) => (
                      <span key={skill} style={badgeStyle}>{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {job.matchedKeywords && job.matchedKeywords.length > 0 && (
                <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                  Also matched: {job.matchedKeywords.slice(0, 4).join(", ")}
                </div>
              )}

              <p style={{ margin: 0, color: "#475569", fontSize: "0.85rem", lineHeight: 1.5 }}>
                {job.description}
              </p>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", gap: "0.5rem" }}>
                {job.publishedAt && (
                  <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                    {new Date(job.publishedAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                  </span>
                )}
                <a
                  href={job.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: "0.5rem 0.85rem",
                    borderRadius: "8px",
                    background: "#3b82f6",
                    color: "white",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    textDecoration: "none"
                  }}
                >
                  View & Apply
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobRecommendations;

