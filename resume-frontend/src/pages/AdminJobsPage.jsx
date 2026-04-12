import React, { useEffect, useState, useCallback, useRef } from "react";
import { Helmet } from "react-helmet";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SEO from "../components/SEO";
import {
  adminListJobPostings,
  adminGetJobPosting,
  adminUpdateJobPosting,
  adminDeleteJobPosting,
  adminBulkUpdateJobPostings,
  adminGetJobStats,
  adminListSyncRuns,
  startClassifyBackfill,
  getClassifyBackfillStatus,
  stopClassifyBackfill,
  runBenchmark,
  getBenchmarkStatus,
  getBenchmarkSummary,
  getBenchmarkHistory,
  getBenchmarkResults,
  listKnowledge,
  createKnowledge,
  updateKnowledge,
  deleteKnowledge,
  backfillKnowledgeEmbeddings,
} from "../api";

const PAGE_SIZE = 25;

const SENIORITY_OPTIONS = ["intern", "entry", "mid", "senior", "staff", "lead"];

const BENCHMARK_TYPES = [
  { key: "classification", label: "Classification", group: "factual" },
  { key: "skills", label: "Skill Inference", group: "factual" },
  { key: "intent", label: "Intent Routing", group: "factual" },
  { key: "matching", label: "Job Matching", group: "quality" },
  { key: "fit_reasons", label: "Fit Reasons", group: "quality" },
  { key: "experience", label: "Experience Opt", group: "quality" },
  { key: "summary", label: "Summary Gen", group: "quality" },
  { key: "projects", label: "Project Opt", group: "quality" },
  { key: "chat", label: "Chat Bot", group: "quality" },
  { key: "cover_letter", label: "Cover Letter", group: "quality" },
];

function BenchmarkTab({ benchmarkSummary, setBenchmarkSummary, benchmarkHistory, setBenchmarkHistory, benchmarkStatus, setBenchmarkStatus, benchmarkRunning, setBenchmarkRunning, benchmarkPollRef, cardStyle, btnSmall }) {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  const openReport = async (type, runId) => {
    setReportLoading(true);
    try {
      const res = await getBenchmarkResults(type, runId);
      setReportData(res);
    } catch (err) {
      console.error("Failed to load report", err);
    } finally {
      setReportLoading(false);
    }
  };

  // Load summary + history on mount
  useEffect(() => {
    const load = async () => {
      try {
        const [summaryRes, historyRes, statusRes] = await Promise.all([
          getBenchmarkSummary(),
          getBenchmarkHistory(),
          getBenchmarkStatus(),
        ]);
        setBenchmarkSummary(summaryRes.systems || []);
        setBenchmarkHistory((historyRes.history || []).slice(0, 20));
        setBenchmarkStatus(statusRes);
        if (statusRes.running) {
          setBenchmarkRunning(true);
          if (!benchmarkPollRef.current) {
            benchmarkPollRef.current = setInterval(async () => {
              const s = await getBenchmarkStatus();
              setBenchmarkStatus(s);
              if (!s.running) {
                clearInterval(benchmarkPollRef.current);
                benchmarkPollRef.current = null;
                setBenchmarkRunning(false);
                const [sr, hr] = await Promise.all([getBenchmarkSummary(), getBenchmarkHistory()]);
                setBenchmarkSummary(sr.systems || []);
                setBenchmarkHistory((hr.history || []).slice(0, 20));
              }
            }, 3000);
          }
        }
      } catch (err) {
        console.error("Failed to load benchmark data", err);
      }
    };
    load();
    return () => { if (benchmarkPollRef.current) clearInterval(benchmarkPollRef.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRun = async (type) => {
    setLoading(true);
    try {
      await runBenchmark(type, 20);
      setBenchmarkRunning(true);
      if (benchmarkPollRef.current) clearInterval(benchmarkPollRef.current);
      benchmarkPollRef.current = setInterval(async () => {
        const s = await getBenchmarkStatus();
        setBenchmarkStatus(s);
        if (!s.running) {
          clearInterval(benchmarkPollRef.current);
          benchmarkPollRef.current = null;
          setBenchmarkRunning(false);
          const [sr, hr] = await Promise.all([getBenchmarkSummary(), getBenchmarkHistory()]);
          setBenchmarkSummary(sr.systems || []);
          setBenchmarkHistory((hr.history || []).slice(0, 20));
        }
      }, 3000);
    } catch (err) {
      console.error("Failed to run benchmark", err);
    } finally {
      setLoading(false);
    }
  };

  const getScore = (type) => {
    const sys = benchmarkSummary.find((s) => s.benchmark_type === type);
    if (!sys) return { label: "Not yet run", color: "#94a3b8" };
    const score = sys.overall_score;
    if (score > 0.8) return { label: `${(score * 100).toFixed(0)}%`, color: "#16a34a" };
    if (score > 0.6) return { label: `${(score * 100).toFixed(0)}%`, color: "#ca8a04" };
    return { label: `${(score * 100).toFixed(0)}%`, color: "#dc2626" };
  };

  const getScoreForQuality = (type) => {
    const sys = benchmarkSummary.find((s) => s.benchmark_type === type);
    if (!sys) return { label: "Not yet run", color: "#94a3b8" };
    const score = sys.overall_score;
    const display = (score * 5).toFixed(1);
    if (score > 0.8) return { label: `${display}/5`, color: "#16a34a" };
    if (score > 0.6) return { label: `${display}/5`, color: "#ca8a04" };
    return { label: `${display}/5`, color: "#dc2626" };
  };

  const factual = BENCHMARK_TYPES.filter((t) => t.group === "factual");
  const quality = BENCHMARK_TYPES.filter((t) => t.group === "quality");

  return (
    <div>
      {/* Status bar */}
      {benchmarkRunning && benchmarkStatus && (
        <div style={{ ...cardStyle, marginBottom: "1rem", background: "#eff6ff", border: "1px solid #bfdbfe" }}>
          <span style={{ fontSize: "0.85rem", color: "#1d4ed8", fontWeight: 600 }}>
            Running: {benchmarkStatus.type} — {benchmarkStatus.progress}/{benchmarkStatus.total} processed
          </span>
        </div>
      )}

      {/* Run All button */}
      <div style={{ ...cardStyle, marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong style={{ fontSize: "0.95rem" }}>AI Quality Dashboard</strong>
        <button
          style={{ ...btnSmall, background: "#2563eb", color: "#fff", padding: "0.4rem 1rem", opacity: benchmarkRunning || loading ? 0.5 : 1 }}
          disabled={benchmarkRunning || loading}
          onClick={() => handleRun("all")}
        >
          {loading ? "Starting..." : "Run All Benchmarks"}
        </button>
      </div>

      {/* Factual Systems */}
      <div style={{ ...cardStyle, marginBottom: "1rem" }}>
        <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.85rem", color: "#334155", textTransform: "uppercase", letterSpacing: "0.05em" }}>Factual Systems</h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
          {factual.map((t) => {
            const s = getScore(t.key);
            return (
              <div key={t.key} style={{ padding: "0.75rem", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 600, fontSize: "0.82rem" }}>{t.label}</span>
                  <span style={{ fontWeight: 700, color: s.color, fontSize: "0.85rem" }}>{s.label}</span>
                </div>
                <div style={{ display: "flex", gap: "4px", marginTop: "0.5rem" }}>
                  <button
                    style={{ ...btnSmall, fontSize: "0.7rem", opacity: benchmarkRunning ? 0.5 : 1 }}
                    disabled={benchmarkRunning}
                    onClick={() => handleRun(t.key)}
                  >
                    Run
                  </button>
                  <button
                    style={{ ...btnSmall, fontSize: "0.7rem", color: "#2563eb" }}
                    onClick={() => openReport(t.key)}
                    disabled={reportLoading}
                  >
                    Report
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quality Systems */}
      <div style={{ ...cardStyle, marginBottom: "1rem" }}>
        <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.85rem", color: "#334155", textTransform: "uppercase", letterSpacing: "0.05em" }}>Quality Systems</h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
          {quality.map((t) => {
            const s = getScoreForQuality(t.key);
            return (
              <div key={t.key} style={{ padding: "0.75rem", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 600, fontSize: "0.82rem" }}>{t.label}</span>
                  <span style={{ fontWeight: 700, color: s.color, fontSize: "0.85rem" }}>{s.label}</span>
                </div>
                <div style={{ display: "flex", gap: "4px", marginTop: "0.5rem" }}>
                  <button
                    style={{ ...btnSmall, fontSize: "0.7rem", opacity: benchmarkRunning ? 0.5 : 1 }}
                    disabled={benchmarkRunning}
                    onClick={() => handleRun(t.key)}
                  >
                    Run
                  </button>
                  <button
                    style={{ ...btnSmall, fontSize: "0.7rem", color: "#2563eb" }}
                    onClick={() => openReport(t.key)}
                    disabled={reportLoading}
                  >
                    Report
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Run History */}
      {benchmarkHistory.length > 0 && (
        <div style={cardStyle}>
          <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.85rem", color: "#334155", textTransform: "uppercase", letterSpacing: "0.05em" }}>Run History</h4>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ textAlign: "left", padding: "4px 8px" }}>Date</th>
                <th style={{ textAlign: "left", padding: "4px 8px" }}>Type</th>
                <th style={{ textAlign: "left", padding: "4px 8px" }}>Samples</th>
                <th style={{ textAlign: "left", padding: "4px 8px" }}>Score</th>
                <th style={{ textAlign: "left", padding: "4px 8px" }}>Report</th>
              </tr>
            </thead>
            <tbody>
              {benchmarkHistory.map((h, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "4px 8px" }}>{new Date(h.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: "4px 8px" }}>{h.benchmark_type}</td>
                  <td style={{ padding: "4px 8px" }}>{h.sample_size}</td>
                  <td style={{ padding: "4px 8px" }}>
                    {h.accuracy?.overall != null ? `${(h.accuracy.overall * 100).toFixed(0)}%` : ""}
                    {h.average_scores?.overall != null ? ` ${h.average_scores.overall.toFixed(1)}/5` : ""}
                  </td>
                  <td style={{ padding: "4px 8px" }}>
                    <button style={{ ...btnSmall, fontSize: "0.7rem", color: "#2563eb" }} onClick={() => openReport(h.benchmark_type, h.run_id)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Report Modal */}
      {reportData && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setReportData(null)}>
          <div style={{ background: "#fff", borderRadius: "12px", padding: "1.5rem", maxWidth: "700px", width: "90%", maxHeight: "80vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0 }}>{reportData.benchmark_type ? reportData.benchmark_type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : ""} Report</h3>
              <button style={{ ...btnSmall, fontSize: "0.8rem" }} onClick={() => setReportData(null)}>Close</button>
            </div>

            {/* Summary */}
            {reportData.summary && Object.keys(reportData.summary).length > 0 && (
              <div style={{ ...cardStyle, marginBottom: "1rem", background: "#f8fafc" }}>
                <strong style={{ fontSize: "0.82rem" }}>Summary</strong>
                <div style={{ marginTop: "0.5rem", fontSize: "0.8rem" }}>
                  {Object.entries(reportData.summary).map(([k, v]) => (
                    <div key={k}>{k.replace(/_/g, " ")}: <strong>{typeof v === "number" ? (v <= 1 ? `${(v * 100).toFixed(0)}%` : v.toFixed(1)) : v}</strong></div>
                  ))}
                </div>
              </div>
            )}

            {/* Insights */}
            {reportData.insights && (
              <div style={{ ...cardStyle, marginBottom: "1rem", background: "#fffbeb", border: "1px solid #fde68a" }}>
                <strong style={{ fontSize: "0.82rem", color: "#92400e" }}>Insights</strong>
                <p style={{ margin: "0.5rem 0 0", fontSize: "0.8rem", color: "#78350f" }}>{reportData.insights}</p>
              </div>
            )}

            {/* Failures */}
            {reportData.failures && reportData.failures.length > 0 && (
              <div style={{ ...cardStyle, marginBottom: "1rem", background: "#fef2f2", border: "1px solid #fecaca" }}>
                <strong style={{ fontSize: "0.82rem", color: "#991b1b" }}>Failures ({reportData.failures.length})</strong>
                <div style={{ marginTop: "0.5rem" }}>
                  {reportData.failures.map((f, i) => (
                    <div key={i} style={{ padding: "0.5rem", marginBottom: "0.4rem", background: "#fff", borderRadius: "6px", border: "1px solid #fee2e2", fontSize: "0.78rem" }}>
                      <div><strong>Field:</strong> {f.field_name} {f.entity_id ? `(#${f.entity_id})` : ""}</div>
                      {f.ai_value && <div><strong>AI said:</strong> {f.ai_value.length > 100 ? f.ai_value.substring(0, 100) + "..." : f.ai_value}</div>}
                      {f.expected_value && <div><strong>Expected:</strong> {f.expected_value}</div>}
                      {f.score != null && <div><strong>Score:</strong> {f.score}/5</div>}
                      {f.reasoning && <div style={{ color: "#64748b", marginTop: "0.25rem" }}>{f.reasoning}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All passed */}
            {(!reportData.failures || reportData.failures.length === 0) && (
              <div style={{ ...cardStyle, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <strong style={{ color: "#166534" }}>All benchmarks passed!</strong>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "-";

function normalizeRemoteType(raw) {
  if (!raw) return "Unspecified";
  const v = raw.toLowerCase().replace(/[\[\]]/g, "").trim();
  if (!v || v === "nil" || v === "unspecified" || v === "null") return "Unspecified";
  if (v.includes("hybrid") && v.includes("remote")) return "Hybrid Remote";
  if (v.includes("remote")) return "Remote";
  if (v.includes("hybrid")) return "Hybrid";
  if (v.includes("onsite") || v.includes("on-site") || v.includes("office")) return "Onsite";
  return "Unspecified";
}

function normalizeEmploymentType(raw) {
  if (!raw) return "Unspecified";
  const v = raw.toLowerCase().replace(/[\[\]]/g, "").trim();
  if (!v || v === "nil" || v === "unspecified" || v === "null") return "Unspecified";
  if (v.includes("intern")) return "Internship";
  if (v.includes("part-time") || v.includes("part time")) return "Part-time";
  if (v.includes("contract") || v.includes("fixed term")) return "Contract";
  if (v.includes("temporary") || v.includes("temp")) return "Temporary";
  if (v.includes("full") || v.includes("regular") || v.includes("permanent") || v.includes("employee") || v.includes("exempt") || v === "employee") return "Full-time";
  return "Other";
}

function groupStats(items, keyField, normalizeFn) {
  const groups = {};
  for (const item of (items || [])) {
    const normalized = normalizeFn(item[keyField]);
    groups[normalized] = (groups[normalized] || 0) + (item.count || 0);
  }
  return Object.entries(groups)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "-" : d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

// Styles
const cardStyle = {
  background: "#ffffff",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
  padding: "1.25rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
};

const btnPrimary = {
  display: "inline-flex", alignItems: "center", gap: "6px",
  padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid #2563eb",
  color: "#fff", background: "#2563eb", fontWeight: 600, fontSize: "0.85rem",
  cursor: "pointer", textDecoration: "none",
};

const btnDanger = { ...btnPrimary, background: "#dc2626", border: "1px solid #dc2626" };

const btnOutline = {
  ...btnPrimary, background: "transparent", color: "#2563eb",
};

const btnSmall = {
  padding: "0.3rem 0.6rem", borderRadius: "6px", border: "1px solid #d1d5db",
  background: "#fff", color: "#374151", fontSize: "0.78rem", cursor: "pointer", fontWeight: 500,
};

const inputStyle = {
  padding: "0.5rem 0.75rem", borderRadius: "8px", border: "1px solid #d1d5db",
  fontSize: "0.85rem", outline: "none", minWidth: 0,
};

const selectStyle = { ...inputStyle, cursor: "pointer" };

const tableStyle = {
  width: "100%", borderCollapse: "separate", borderSpacing: 0,
  fontSize: "0.82rem",
};

const thStyle = {
  textAlign: "left", padding: "0.6rem 0.75rem", fontWeight: 600,
  borderBottom: "2px solid #e5e7eb", color: "#6b7280", whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "0.6rem 0.75rem", borderBottom: "1px solid #f3f4f6",
  verticalAlign: "top",
};

const modalOverlay = {
  position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
  background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
  justifyContent: "center", zIndex: 1000,
};

const modalContent = {
  background: "#fff", borderRadius: "16px", padding: "2rem",
  maxWidth: "700px", width: "90%", maxHeight: "80vh", overflow: "auto",
  boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
};

const tabBtn = (active) => ({
  padding: "0.6rem 1.2rem", borderRadius: "8px 8px 0 0", border: "1px solid #e5e7eb",
  borderBottom: active ? "2px solid #2563eb" : "1px solid #e5e7eb",
  background: active ? "#eff6ff" : "#fff", color: active ? "#2563eb" : "#6b7280",
  fontWeight: active ? 700 : 500, cursor: "pointer", fontSize: "0.9rem",
});

const KNOWLEDGE_CATEGORIES = ["product", "resume_tips", "interview", "career", "job_search", "faq"];

function KnowledgeTab({ cardStyle, btnSmall }) {
  const [entries, setEntries] = useState([]);
  const [filterCat, setFilterCat] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("product");
  const [formContent, setFormContent] = useState("");
  const [saving, setSaving] = useState(false);

  const loadEntries = useCallback(async () => {
    try {
      const res = await listKnowledge();
      setEntries(res.entries || []);
    } catch (err) {
      console.error("Failed to load knowledge", err);
    }
  }, []);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editEntry) {
        await updateKnowledge(editEntry.id, formTitle, formCategory, formContent);
      } else {
        await createKnowledge(formTitle, formCategory, formContent);
      }
      setShowForm(false);
      setEditEntry(null);
      setFormTitle("");
      setFormCategory("product");
      setFormContent("");
      await loadEntries();
    } catch (err) {
      console.error("Save failed", err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (entry) => {
    setEditEntry(entry);
    setFormTitle(entry.title);
    setFormCategory(entry.category);
    setFormContent(entry.content);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this entry?")) return;
    await deleteKnowledge(id);
    await loadEntries();
  };

  const handleBackfill = async () => {
    const res = await backfillKnowledgeEmbeddings();
    alert(`Backfill complete: ${res.processed} entries embedded`);
    await loadEntries();
  };

  const filtered = filterCat ? entries.filter(e => e.category === filterCat) : entries;
  const tdStyle = { padding: "6px 8px", borderBottom: "1px solid #f3f4f6", fontSize: "0.8rem" };
  const thStyle = { padding: "6px 8px", borderBottom: "1px solid #e5e7eb", textAlign: "left", fontSize: "0.8rem", fontWeight: 600 };

  return (
    <div>
      <div style={{ ...cardStyle, marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <strong style={{ fontSize: "0.95rem" }}>Knowledge Base ({entries.length} entries)</strong>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ padding: "0.3rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.8rem" }}>
            <option value="">All Categories</option>
            {KNOWLEDGE_CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button style={{ ...btnSmall, background: "#2563eb", color: "#fff", padding: "0.35rem 0.8rem" }} onClick={() => { setEditEntry(null); setFormTitle(""); setFormCategory("product"); setFormContent(""); setShowForm(true); }}>Add Entry</button>
          <button style={{ ...btnSmall, padding: "0.35rem 0.8rem" }} onClick={handleBackfill}>Backfill Embeddings</button>
        </div>
      </div>

      {showForm && (
        <div style={{ ...cardStyle, marginBottom: "1rem", background: "#f8fafc" }}>
          <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.85rem" }}>{editEntry ? "Edit Entry" : "Add Entry"}</h4>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <input placeholder="Title" value={formTitle} onChange={e => setFormTitle(e.target.value)} style={{ flex: 1, padding: "0.4rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.8rem" }} />
            <select value={formCategory} onChange={e => setFormCategory(e.target.value)} style={{ padding: "0.4rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.8rem" }}>
              {KNOWLEDGE_CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <textarea placeholder="Content (200-400 words of expert advice)" value={formContent} onChange={e => setFormContent(e.target.value)} rows={6} style={{ width: "100%", padding: "0.4rem", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.8rem", resize: "vertical", boxSizing: "border-box" }} />
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button style={{ ...btnSmall, background: "#2563eb", color: "#fff", padding: "0.35rem 0.8rem", opacity: saving ? 0.5 : 1 }} disabled={saving || !formTitle || !formContent} onClick={handleSave}>{saving ? "Saving..." : "Save"}</button>
            <button style={{ ...btnSmall, padding: "0.35rem 0.8rem" }} onClick={() => { setShowForm(false); setEditEntry(null); }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={cardStyle}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Title</th>
              <th style={thStyle}>Category</th>
              <th style={thStyle}>Content</th>
              <th style={thStyle}>Embed</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(e => (
              <tr key={e.id} style={{ opacity: e.is_active ? 1 : 0.4 }}>
                <td style={tdStyle}>{e.title}</td>
                <td style={tdStyle}><span style={{ background: "#e0e7ff", padding: "2px 6px", borderRadius: "4px", fontSize: "0.7rem" }}>{e.category}</span></td>
                <td style={{ ...tdStyle, maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.content}</td>
                <td style={tdStyle}>{e.has_embedding ? "✓" : "✗"}</td>
                <td style={tdStyle}>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button style={{ ...btnSmall, fontSize: "0.7rem" }} onClick={() => handleEdit(e)}>Edit</button>
                    <button style={{ ...btnSmall, fontSize: "0.7rem", color: "#dc2626" }} onClick={() => handleDelete(e.id)}>Del</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const navLinkStyle = {
  display: "inline-flex", alignItems: "center", gap: "6px",
  padding: "0.65rem 1rem", borderRadius: "10px", border: "1px solid #2563eb",
  color: "#ffffff", background: "#2563eb", fontWeight: 600, textDecoration: "none",
  boxShadow: "0 6px 14px rgba(37, 99, 235, 0.18)", fontSize: "0.85rem",
};

export default function AdminJobsPage() {
  const { user, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState("postings");
  const [error, setError] = useState("");

  // --- Postings state ---
  const [postings, setPostings] = useState([]);
  const [postingsLoading, setPostingsLoading] = useState(false);
  const [postingsPage, setPostingsPage] = useState(1);
  const [postingsTotal, setPostingsTotal] = useState(0);
  const [postingsTotalPages, setPostingsTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [filterCompanyId, setFilterCompanyId] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [filterRemote, setFilterRemote] = useState("");
  const [filterEmployment, setFilterEmployment] = useState("");
  const [filterSeniority, setFilterSeniority] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortDir, setSortDir] = useState("desc");
  const [selectedIds, setSelectedIds] = useState(new Set());

  // --- Classify Backfill state ---
  const [backfillStatus, setBackfillStatus] = useState(null);
  const [backfillSinceDays, setBackfillSinceDays] = useState(30);
  const [backfillStarting, setBackfillStarting] = useState(false);
  const backfillPollRef = useRef(null);

  // --- Benchmark state ---
  const [benchmarkSummary, setBenchmarkSummary] = useState([]);
  const [benchmarkHistory, setBenchmarkHistory] = useState([]);
  const [benchmarkStatus, setBenchmarkStatus] = useState(null);
  const [benchmarkRunning, setBenchmarkRunning] = useState(false);
  const benchmarkPollRef = useRef(null);
  const [companies, setCompanies] = useState([]);

  // --- View/Edit modals ---
  const [viewPosting, setViewPosting] = useState(null);
  const [editPosting, setEditPosting] = useState(null);
  const [editFields, setEditFields] = useState({});
  const [saving, setSaving] = useState(false);

  // --- Sync Runs state ---
  const [syncRuns, setSyncRuns] = useState([]);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncPage, setSyncPage] = useState(1);
  const [syncTotal, setSyncTotal] = useState(0);
  const [syncTotalPages, setSyncTotalPages] = useState(1);
  const [syncCompanyId, setSyncCompanyId] = useState("");
  const [syncStatus, setSyncStatus] = useState("");
  const [syncDateFrom, setSyncDateFrom] = useState("");
  const [syncDateTo, setSyncDateTo] = useState("");

  // --- Stats state ---
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // --- Data fetching ---
  const loadPostings = useCallback(async () => {
    setPostingsLoading(true);
    setError("");
    try {
      const data = await adminListJobPostings({
        page: postingsPage, page_size: PAGE_SIZE,
        search, company_id: filterCompanyId, is_active: filterActive,
        remote_type: filterRemote, employment_type: filterEmployment,
        seniority: filterSeniority,
        date_from: dateFrom, date_to: dateTo,
        sort_by: sortBy, sort_dir: sortDir,
      });
      setPostings(data.postings || []);
      setPostingsTotal(data.total || 0);
      setPostingsTotalPages(data.total_pages || 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setPostingsLoading(false);
    }
  }, [postingsPage, search, filterCompanyId, filterActive, filterRemote, filterEmployment, filterSeniority, dateFrom, dateTo, sortBy, sortDir]);

  // --- Classify Backfill handlers ---
  const pollBackfillStatus = useCallback(async () => {
    try {
      const status = await getClassifyBackfillStatus();
      setBackfillStatus(status);
      if (!status.running && backfillPollRef.current) {
        clearInterval(backfillPollRef.current);
        backfillPollRef.current = null;
      }
    } catch (err) {
      console.error("Failed to get backfill status", err);
    }
  }, []);

  const handleStartBackfill = useCallback(async () => {
    setBackfillStarting(true);
    try {
      await startClassifyBackfill(20, backfillSinceDays);
      // Start polling
      pollBackfillStatus();
      if (backfillPollRef.current) clearInterval(backfillPollRef.current);
      backfillPollRef.current = setInterval(pollBackfillStatus, 3000);
    } catch (err) {
      console.error("Failed to start backfill", err);
    } finally {
      setBackfillStarting(false);
    }
  }, [backfillSinceDays, pollBackfillStatus]);

  const handleStopBackfill = useCallback(async () => {
    try {
      await stopClassifyBackfill();
      pollBackfillStatus();
    } catch (err) {
      console.error("Failed to stop backfill", err);
    }
  }, [pollBackfillStatus]);

  // Fetch initial status + start polling if running
  useEffect(() => {
    pollBackfillStatus();
    return () => {
      if (backfillPollRef.current) clearInterval(backfillPollRef.current);
    };
  }, [pollBackfillStatus]);

  useEffect(() => {
    if (backfillStatus?.running && !backfillPollRef.current) {
      backfillPollRef.current = setInterval(pollBackfillStatus, 3000);
    }
  }, [backfillStatus?.running, pollBackfillStatus]);

  const loadCompanies = useCallback(async () => {
    try {
      const token = localStorage.getItem("resumeToken");
      const API_BASE_URL = window.location.hostname === "localhost" ? "http://localhost:8081" : "";
      const res = await fetch(`${API_BASE_URL}/api/admin/jobs/companies?page_size=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCompanies(data.companies || []);
    } catch { /* ignore */ }
  }, []);

  const loadSyncRuns = useCallback(async () => {
    setSyncLoading(true);
    setError("");
    try {
      const data = await adminListSyncRuns({
        page: syncPage, page_size: PAGE_SIZE,
        company_id: syncCompanyId, status: syncStatus,
        date_from: syncDateFrom, date_to: syncDateTo,
      });
      setSyncRuns(data.sync_runs || []);
      setSyncTotal(data.total || 0);
      setSyncTotalPages(data.total_pages || 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setSyncLoading(false);
    }
  }, [syncPage, syncCompanyId, syncStatus, syncDateFrom, syncDateTo]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setError("");
    try {
      const data = await adminGetJobStats();
      setStats(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => { loadCompanies(); }, [loadCompanies]);

  useEffect(() => {
    if (activeTab === "postings") loadPostings();
  }, [activeTab, loadPostings]);

  useEffect(() => {
    if (activeTab === "sync") loadSyncRuns();
  }, [activeTab, loadSyncRuns]);

  useEffect(() => {
    if (activeTab === "stats") loadStats();
  }, [activeTab, loadStats]);

  // --- Actions ---
  const handleView = async (id) => {
    try {
      const data = await adminGetJobPosting(id);
      setViewPosting(data);
    } catch (e) { setError(e.message); }
  };

  const handleEditOpen = async (id) => {
    try {
      const data = await adminGetJobPosting(id);
      setEditPosting(data);
      setEditFields({
        title: data.title || "",
        location: data.location || "",
        salary_min: data.salary_min ?? "",
        salary_max: data.salary_max ?? "",
        salary_currency: data.salary_currency || "",
        seniority_level: data.seniority_level ?? 2,
        remote_type: data.remote_type || "",
        employment_type: data.employment_type || "",
        is_active: data.is_active ?? true,
      });
    } catch (e) { setError(e.message); }
  };

  const handleEditSave = async () => {
    if (!editPosting) return;
    setSaving(true);
    try {
      const fields = { ...editFields };
      if (fields.salary_min !== "") fields.salary_min = Number(fields.salary_min);
      else delete fields.salary_min;
      if (fields.salary_max !== "") fields.salary_max = Number(fields.salary_max);
      else delete fields.salary_max;
      if (fields.seniority_level !== "") fields.seniority_level = Number(fields.seniority_level);
      await adminUpdateJobPosting(editPosting.id, fields);
      setEditPosting(null);
      loadPostings();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this job posting? This cannot be undone.")) return;
    try {
      await adminDeleteJobPosting(id);
      loadPostings();
    } catch (e) { setError(e.message); }
  };

  const handleBulkUpdate = async (active) => {
    if (selectedIds.size === 0) return;
    try {
      await adminBulkUpdateJobPostings([...selectedIds], active);
      setSelectedIds(new Set());
      loadPostings();
    } catch (e) { setError(e.message); }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === postings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(postings.map((p) => p.id)));
    }
  };

  const handleSort = (col) => {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
    setPostingsPage(1);
  };

  const resetFilters = () => {
    setSearch(""); setFilterCompanyId(""); setFilterActive(""); setFilterRemote("");
    setFilterEmployment(""); setFilterSeniority(""); setDateFrom(""); setDateTo("");
    setPostingsPage(1);
  };

  // --- Render ---
  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div>
      <SEO
        title="Admin Job Management | HiHired"
        description="Manage job postings, view sync history, and monitor job statistics."
        canonical="https://hihired.org/admin/jobs"
      />
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>

      <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>Job Management</h1>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link to="/admin/memberships" style={navLinkStyle}>Memberships</Link>
            <Link to="/admin/analytics" style={{ ...navLinkStyle, background: "#7c3aed", border: "1px solid #7c3aed", boxShadow: "0 6px 14px rgba(124,58,237,0.18)" }}>Analytics</Link>
            <Link to="/admin/experiments" style={{ ...navLinkStyle, background: "#10b981", border: "1px solid #10b981", boxShadow: "0 6px 14px rgba(16,185,129,0.18)" }}>Experiments</Link>
          </div>
        </div>

        {error && (
          <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1rem" }}>
            {error}
            <button onClick={() => setError("")} style={{ float: "right", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>x</button>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "1rem" }}>
          <button style={tabBtn(activeTab === "postings")} onClick={() => setActiveTab("postings")}>Postings</button>
          <button style={tabBtn(activeTab === "sync")} onClick={() => setActiveTab("sync")}>Sync History</button>
          <button style={tabBtn(activeTab === "stats")} onClick={() => setActiveTab("stats")}>Statistics</button>
          <button style={tabBtn(activeTab === "benchmark")} onClick={() => setActiveTab("benchmark")}>AI Benchmark</button>
          <button style={tabBtn(activeTab === "knowledge")} onClick={() => setActiveTab("knowledge")}>Knowledge Base</button>
        </div>

        {/* ==================== POSTINGS TAB ==================== */}
        {activeTab === "postings" && (
          <div>
            {/* Classify Backfill Controls */}
            <div style={{ ...cardStyle, marginBottom: "1rem", background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                <strong style={{ fontSize: "0.85rem", color: "#166534" }}>Classify Backfill</strong>
                <label style={{ fontSize: "0.8rem", color: "#334155", display: "flex", alignItems: "center", gap: "4px" }}>
                  Since days:
                  <input
                    type="number"
                    value={backfillSinceDays}
                    onChange={(e) => setBackfillSinceDays(Number(e.target.value) || 0)}
                    style={{ ...inputStyle, width: "60px", padding: "4px 6px" }}
                    min={0}
                  />
                </label>
                <button
                  style={{ ...btnSmall, background: "#16a34a", color: "#fff", opacity: backfillStatus?.running || backfillStarting ? 0.5 : 1 }}
                  disabled={backfillStatus?.running || backfillStarting}
                  onClick={handleStartBackfill}
                >
                  {backfillStarting ? "Starting..." : "Start"}
                </button>
                <button
                  style={{ ...btnSmall, background: "#dc2626", color: "#fff", opacity: backfillStatus?.running ? 1 : 0.5 }}
                  disabled={!backfillStatus?.running}
                  onClick={handleStopBackfill}
                >
                  Stop
                </button>
                {backfillStatus && (
                  <span style={{ fontSize: "0.8rem", color: "#475569" }}>
                    {backfillStatus.running
                      ? `Running — ${backfillStatus.processed}/${backfillStatus.total} processed, ${backfillStatus.errors} errors`
                      : backfillStatus.finished_at
                        ? `Finished — ${backfillStatus.processed}/${backfillStatus.total} processed, ${backfillStatus.errors} errors`
                        : "Idle"}
                  </span>
                )}
              </div>
            </div>

            {/* Filters */}
            <div style={{ ...cardStyle, marginBottom: "1rem" }}>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "flex-end" }}>
                <input style={{ ...inputStyle, flex: "1 1 200px" }} placeholder="Search title / location..." value={search} onChange={(e) => { setSearch(e.target.value); setPostingsPage(1); }} />
                <select style={selectStyle} value={filterCompanyId} onChange={(e) => { setFilterCompanyId(e.target.value); setPostingsPage(1); }}>
                  <option value="">All Companies</option>
                  {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select style={selectStyle} value={filterActive} onChange={(e) => { setFilterActive(e.target.value); setPostingsPage(1); }}>
                  <option value="">Active & Inactive</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
                <select style={selectStyle} value={filterRemote} onChange={(e) => { setFilterRemote(e.target.value); setPostingsPage(1); }}>
                  <option value="">All Remote Types</option>
                  <option value="remote">Remote</option>
                  <option value="onsite">Onsite</option>
                  <option value="hybrid">Hybrid</option>
                </select>
                <select style={selectStyle} value={filterEmployment} onChange={(e) => { setFilterEmployment(e.target.value); setPostingsPage(1); }}>
                  <option value="">All Employment</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
                <select style={selectStyle} value={filterSeniority} onChange={(e) => { setFilterSeniority(e.target.value); setPostingsPage(1); }}>
                  <option value="">All Seniority</option>
                  {SENIORITY_OPTIONS.map((s) => <option key={s} value={s}>{capitalize(s)}</option>)}
                </select>
                <input type="date" style={inputStyle} value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPostingsPage(1); }} title="From date" />
                <input type="date" style={inputStyle} value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPostingsPage(1); }} title="To date" />
                <button style={btnSmall} onClick={resetFilters}>Reset</button>
              </div>
            </div>

            {/* Bulk actions */}
            {selectedIds.size > 0 && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "0.75rem" }}>
                <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>{selectedIds.size} selected</span>
                <button style={{ ...btnSmall, color: "#059669" }} onClick={() => handleBulkUpdate(true)}>Activate</button>
                <button style={{ ...btnSmall, color: "#dc2626" }} onClick={() => handleBulkUpdate(false)}>Deactivate</button>
              </div>
            )}

            {/* Table */}
            <div style={{ ...cardStyle, overflow: "auto" }}>
              {postingsLoading ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>Loading...</div>
              ) : postings.length === 0 ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>No postings found.</div>
              ) : (
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}><input type="checkbox" checked={selectedIds.size === postings.length && postings.length > 0} onChange={toggleSelectAll} /></th>
                      <th style={{ ...thStyle, cursor: "pointer" }} onClick={() => handleSort("id")}>ID {sortBy === "id" ? (sortDir === "asc" ? "^" : "v") : ""}</th>
                      <th style={{ ...thStyle, cursor: "pointer" }} onClick={() => handleSort("title")}>Title {sortBy === "title" ? (sortDir === "asc" ? "^" : "v") : ""}</th>
                      <th style={{ ...thStyle, cursor: "pointer" }} onClick={() => handleSort("company_name")}>Company {sortBy === "company_name" ? (sortDir === "asc" ? "^" : "v") : ""}</th>
                      <th style={{ ...thStyle, cursor: "pointer" }} onClick={() => handleSort("location")}>Location {sortBy === "location" ? (sortDir === "asc" ? "^" : "v") : ""}</th>
                      <th style={thStyle}>Remote</th>
                      <th style={thStyle}>Type</th>
                      <th style={{ ...thStyle, cursor: "pointer" }} onClick={() => handleSort("seniority_level")}>Seniority {sortBy === "seniority_level" ? (sortDir === "asc" ? "^" : "v") : ""}</th>
                      <th style={thStyle}>Active</th>
                      <th style={thStyle}>Career Field</th>
                      <th style={thStyle}>Skills</th>
                      <th style={{ ...thStyle, cursor: "pointer" }} onClick={() => handleSort("posted_at")}>Posted {sortBy === "posted_at" ? (sortDir === "asc" ? "^" : "v") : ""}</th>
                      <th style={thStyle}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {postings.map((p) => (
                      <tr key={p.id} style={{ background: selectedIds.has(p.id) ? "#eff6ff" : "transparent" }}>
                        <td style={tdStyle}><input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} /></td>
                        <td style={tdStyle}>{p.id}</td>
                        <td style={{ ...tdStyle, maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</td>
                        <td style={tdStyle}>{p.company_name}</td>
                        <td style={{ ...tdStyle, maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.location || "-"}</td>
                        <td style={tdStyle}>{p.remote_type || "-"}</td>
                        <td style={tdStyle}>{p.employment_type || "-"}</td>
                        <td style={tdStyle}>{capitalize(p.seniority || "")}</td>
                        <td style={tdStyle}>
                          <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600, background: p.is_active ? "#d1fae5" : "#fee2e2", color: p.is_active ? "#065f46" : "#991b1b" }}>
                            {p.is_active ? "Yes" : "No"}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, fontSize: "0.7rem" }}>{p.career_field || "-"}</td>
                        <td style={{ ...tdStyle, maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.7rem" }}>
                          {Array.isArray(p.extracted_skills) && p.extracted_skills.length > 0 ? p.extracted_skills.slice(0, 3).join(", ") + (p.extracted_skills.length > 3 ? ` +${p.extracted_skills.length - 3}` : "") : "-"}
                        </td>
                        <td style={tdStyle}>{formatDate(p.posted_at)}</td>
                        <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                          <button style={{ ...btnSmall, marginRight: "4px" }} onClick={() => handleView(p.id)}>View</button>
                          <button style={{ ...btnSmall, marginRight: "4px" }} onClick={() => handleEditOpen(p.id)}>Edit</button>
                          <button style={{ ...btnSmall, color: "#dc2626" }} onClick={() => handleDelete(p.id)}>Del</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Pagination */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", borderTop: "1px solid #e5e7eb" }}>
                <span style={{ fontSize: "0.82rem", color: "#6b7280" }}>{postingsTotal} total</span>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <button style={btnSmall} disabled={postingsPage <= 1} onClick={() => setPostingsPage((p) => p - 1)}>Prev</button>
                  <span style={{ fontSize: "0.82rem" }}>Page {postingsPage} / {postingsTotalPages}</span>
                  <button style={btnSmall} disabled={postingsPage >= postingsTotalPages} onClick={() => setPostingsPage((p) => p + 1)}>Next</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== SYNC HISTORY TAB ==================== */}
        {activeTab === "sync" && (
          <div>
            <div style={{ ...cardStyle, marginBottom: "1rem" }}>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "flex-end" }}>
                <select style={selectStyle} value={syncCompanyId} onChange={(e) => { setSyncCompanyId(e.target.value); setSyncPage(1); }}>
                  <option value="">All Companies</option>
                  {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select style={selectStyle} value={syncStatus} onChange={(e) => { setSyncStatus(e.target.value); setSyncPage(1); }}>
                  <option value="">All Statuses</option>
                  <option value="running">Running</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
                <input type="date" style={inputStyle} value={syncDateFrom} onChange={(e) => { setSyncDateFrom(e.target.value); setSyncPage(1); }} title="From date" />
                <input type="date" style={inputStyle} value={syncDateTo} onChange={(e) => { setSyncDateTo(e.target.value); setSyncPage(1); }} title="To date" />
              </div>
            </div>

            <div style={{ ...cardStyle, overflow: "auto" }}>
              {syncLoading ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>Loading...</div>
              ) : syncRuns.length === 0 ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>No sync runs found.</div>
              ) : (
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>ID</th>
                      <th style={thStyle}>Company</th>
                      <th style={thStyle}>Started</th>
                      <th style={thStyle}>Finished</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Found</th>
                      <th style={thStyle}>Created</th>
                      <th style={thStyle}>Updated</th>
                      <th style={thStyle}>Closed</th>
                      <th style={thStyle}>Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {syncRuns.map((r) => (
                      <tr key={r.id}>
                        <td style={tdStyle}>{r.id}</td>
                        <td style={tdStyle}>{r.company_name}</td>
                        <td style={tdStyle}>{formatDateTime(r.started_at)}</td>
                        <td style={tdStyle}>{formatDateTime(r.finished_at)}</td>
                        <td style={tdStyle}>
                          <span style={{
                            display: "inline-block", padding: "2px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600,
                            background: r.status === "completed" ? "#d1fae5" : r.status === "failed" ? "#fee2e2" : "#fef3c7",
                            color: r.status === "completed" ? "#065f46" : r.status === "failed" ? "#991b1b" : "#92400e",
                          }}>
                            {r.status}
                          </span>
                        </td>
                        <td style={tdStyle}>{r.jobs_found}</td>
                        <td style={tdStyle}>{r.jobs_created}</td>
                        <td style={tdStyle}>{r.jobs_updated}</td>
                        <td style={tdStyle}>{r.jobs_closed}</td>
                        <td style={{ ...tdStyle, maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.message || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", borderTop: "1px solid #e5e7eb" }}>
                <span style={{ fontSize: "0.82rem", color: "#6b7280" }}>{syncTotal} total</span>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <button style={btnSmall} disabled={syncPage <= 1} onClick={() => setSyncPage((p) => p - 1)}>Prev</button>
                  <span style={{ fontSize: "0.82rem" }}>Page {syncPage} / {syncTotalPages}</span>
                  <button style={btnSmall} disabled={syncPage >= syncTotalPages} onClick={() => setSyncPage((p) => p + 1)}>Next</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== STATISTICS TAB ==================== */}
        {activeTab === "stats" && (
          <div>
            {statsLoading ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280" }}>Loading...</div>
            ) : stats ? (
              <>
                {/* Summary cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                  <div style={{ ...cardStyle, textAlign: "center" }}>
                    <div style={{ fontSize: "2rem", fontWeight: 700, color: "#2563eb" }}>{stats.total_postings?.toLocaleString()}</div>
                    <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>Total Postings</div>
                  </div>
                  <div style={{ ...cardStyle, textAlign: "center" }}>
                    <div style={{ fontSize: "2rem", fontWeight: 700, color: "#059669" }}>{stats.active_postings?.toLocaleString()}</div>
                    <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>Active</div>
                  </div>
                  <div style={{ ...cardStyle, textAlign: "center" }}>
                    <div style={{ fontSize: "2rem", fontWeight: 700, color: "#dc2626" }}>{stats.inactive_postings?.toLocaleString()}</div>
                    <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>Inactive</div>
                  </div>
                </div>

                {/* Breakdown tables */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                  {/* By Company */}
                  <div style={cardStyle}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 600, marginTop: 0, marginBottom: "0.75rem" }}>By Company (Top 50)</h3>
                    <div style={{ maxHeight: "300px", overflow: "auto" }}>
                      <table style={tableStyle}>
                        <thead><tr><th style={thStyle}>Company</th><th style={thStyle}>Total</th><th style={thStyle}>Active</th></tr></thead>
                        <tbody>
                          {(stats.by_company || []).map((r, i) => (
                            <tr key={i}><td style={tdStyle}>{r.company_name}</td><td style={tdStyle}>{r.total}</td><td style={tdStyle}>{r.active}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* By Seniority */}
                  <div style={cardStyle}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 600, marginTop: 0, marginBottom: "0.75rem" }}>By Seniority Level</h3>
                    <table style={tableStyle}>
                      <thead><tr><th style={thStyle}>Level</th><th style={thStyle}>Count</th></tr></thead>
                      <tbody>
                        {(stats.by_seniority || []).map((r, i) => (
                          <tr key={i}><td style={tdStyle}>{capitalize(r.seniority_level != null ? String(r.seniority_level) : "")}</td><td style={tdStyle}>{r.count}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* By Remote Type (normalized) */}
                  <div style={cardStyle}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 600, marginTop: 0, marginBottom: "0.75rem" }}>By Remote Type</h3>
                    <table style={tableStyle}>
                      <thead><tr><th style={thStyle}>Type</th><th style={thStyle}>Count</th></tr></thead>
                      <tbody>
                        {groupStats(stats.by_remote_type, "remote_type", normalizeRemoteType).map((r, i) => (
                          <tr key={i}><td style={tdStyle}>{r.type}</td><td style={tdStyle}>{r.count.toLocaleString()}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* By Employment Type (normalized) */}
                  <div style={cardStyle}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 600, marginTop: 0, marginBottom: "0.75rem" }}>By Employment Type</h3>
                    <table style={tableStyle}>
                      <thead><tr><th style={thStyle}>Type</th><th style={thStyle}>Count</th></tr></thead>
                      <tbody>
                        {groupStats(stats.by_employment_type, "employment_type", normalizeEmploymentType).map((r, i) => (
                          <tr key={i}><td style={tdStyle}>{r.type}</td><td style={tdStyle}>{r.count.toLocaleString()}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 30-day trend */}
                <div style={cardStyle}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 600, marginTop: 0, marginBottom: "0.75rem" }}>New Postings (Last 30 Days)</h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", alignItems: "flex-end" }}>
                    {(stats.recent_trend || []).map((r, i) => {
                      const max = Math.max(...(stats.recent_trend || []).map((t) => t.count), 1);
                      const height = Math.max((r.count / max) * 120, 4);
                      return (
                        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "1 1 20px", minWidth: "20px" }}>
                          <div style={{ fontSize: "0.65rem", color: "#6b7280", marginBottom: "2px" }}>{r.count}</div>
                          <div style={{ width: "100%", maxWidth: "24px", height: `${height}px`, background: "#3b82f6", borderRadius: "3px 3px 0 0" }} title={`${r.date}: ${r.count}`} />
                          <div style={{ fontSize: "0.55rem", color: "#9ca3af", marginTop: "2px", transform: "rotate(-45deg)", whiteSpace: "nowrap" }}>{r.date.slice(5)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* ==================== AI BENCHMARK TAB ==================== */}
        {activeTab === "benchmark" && (
          <BenchmarkTab
            benchmarkSummary={benchmarkSummary}
            setBenchmarkSummary={setBenchmarkSummary}
            benchmarkHistory={benchmarkHistory}
            setBenchmarkHistory={setBenchmarkHistory}
            benchmarkStatus={benchmarkStatus}
            setBenchmarkStatus={setBenchmarkStatus}
            benchmarkRunning={benchmarkRunning}
            setBenchmarkRunning={setBenchmarkRunning}
            benchmarkPollRef={benchmarkPollRef}
            cardStyle={cardStyle}
            btnSmall={btnSmall}
          />
        )}

        {/* ==================== KNOWLEDGE BASE TAB ==================== */}
        {activeTab === "knowledge" && (
          <KnowledgeTab cardStyle={cardStyle} btnSmall={btnSmall} />
        )}

        {/* ==================== VIEW MODAL ==================== */}
        {viewPosting && (
          <div style={modalOverlay} onClick={() => setViewPosting(null)}>
            <div style={modalContent} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                <h2 style={{ margin: 0, fontSize: "1.25rem" }}>{viewPosting.title}</h2>
                <button onClick={() => setViewPosting(null)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}>x</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem 1rem", fontSize: "0.85rem", marginBottom: "1rem" }}>
                <div><strong>ID:</strong> {viewPosting.id}</div>
                <div><strong>Company:</strong> {viewPosting.company_name}</div>
                <div><strong>Location:</strong> {viewPosting.location || "-"}</div>
                <div><strong>Remote:</strong> {viewPosting.remote_type || "-"}</div>
                <div><strong>Employment:</strong> {viewPosting.employment_type || "-"}</div>
                <div><strong>Seniority:</strong> {capitalize(viewPosting.seniority || "")}</div>
                <div><strong>Active:</strong> {viewPosting.is_active ? "Yes" : "No"}</div>
                <div><strong>Department:</strong> {viewPosting.department || "-"}</div>
                <div><strong>Salary:</strong> {viewPosting.salary_min || viewPosting.salary_max ? `${viewPosting.salary_min ?? "?"} - ${viewPosting.salary_max ?? "?"} ${viewPosting.salary_currency || ""}` : "-"}</div>
                <div><strong>Posted:</strong> {formatDate(viewPosting.posted_at)}</div>
                <div><strong>First Seen:</strong> {formatDate(viewPosting.first_seen_at)}</div>
                <div><strong>Last Seen:</strong> {formatDate(viewPosting.last_seen_at)}</div>
                <div style={{ gridColumn: "1 / -1" }}><strong>Job URL:</strong> <a href={viewPosting.job_url} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb" }}>{viewPosting.job_url}</a></div>
                {viewPosting.application_url && <div style={{ gridColumn: "1 / -1" }}><strong>Apply URL:</strong> <a href={viewPosting.application_url} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb" }}>{viewPosting.application_url}</a></div>}
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <strong>Description:</strong>
                <div style={{ marginTop: "0.5rem", padding: "0.75rem", background: "#f9fafb", borderRadius: "8px", fontSize: "0.82rem", maxHeight: "200px", overflow: "auto", whiteSpace: "pre-wrap" }}>
                  {viewPosting.description || "(empty)"}
                </div>
              </div>
              {viewPosting.raw_payload && (
                <div>
                  <strong>Raw Payload:</strong>
                  <pre style={{ marginTop: "0.5rem", padding: "0.75rem", background: "#f1f5f9", borderRadius: "8px", fontSize: "0.72rem", maxHeight: "200px", overflow: "auto" }}>
                    {JSON.stringify(viewPosting.raw_payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== EDIT MODAL ==================== */}
        {editPosting && (
          <div style={modalOverlay} onClick={() => setEditPosting(null)}>
            <div style={modalContent} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Edit Posting #{editPosting.id}</h2>
                <button onClick={() => setEditPosting(null)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}>x</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.85rem" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  Title
                  <input style={inputStyle} value={editFields.title} onChange={(e) => setEditFields({ ...editFields, title: e.target.value })} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  Location
                  <input style={inputStyle} value={editFields.location} onChange={(e) => setEditFields({ ...editFields, location: e.target.value })} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  Remote Type
                  <select style={selectStyle} value={editFields.remote_type} onChange={(e) => setEditFields({ ...editFields, remote_type: e.target.value })}>
                    <option value="">-</option>
                    <option value="remote">Remote</option>
                    <option value="onsite">Onsite</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  Employment Type
                  <select style={selectStyle} value={editFields.employment_type} onChange={(e) => setEditFields({ ...editFields, employment_type: e.target.value })}>
                    <option value="">-</option>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  Seniority
                  <select style={selectStyle} value={editFields.seniority_level} onChange={(e) => setEditFields({ ...editFields, seniority_level: e.target.value })}>
                    {SENIORITY_OPTIONS.map((s) => <option key={s} value={s}>{capitalize(s)}</option>)}
                  </select>
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  Salary Currency
                  <input style={inputStyle} value={editFields.salary_currency} onChange={(e) => setEditFields({ ...editFields, salary_currency: e.target.value })} placeholder="USD" />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  Salary Min
                  <input style={inputStyle} type="number" value={editFields.salary_min} onChange={(e) => setEditFields({ ...editFields, salary_min: e.target.value })} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  Salary Max
                  <input style={inputStyle} type="number" value={editFields.salary_max} onChange={(e) => setEditFields({ ...editFields, salary_max: e.target.value })} />
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", gridColumn: "1 / -1" }}>
                  <input type="checkbox" checked={editFields.is_active} onChange={(e) => setEditFields({ ...editFields, is_active: e.target.checked })} />
                  Active
                </label>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "1.25rem" }}>
                <button style={btnOutline} onClick={() => setEditPosting(null)}>Cancel</button>
                <button style={btnPrimary} onClick={handleEditSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
