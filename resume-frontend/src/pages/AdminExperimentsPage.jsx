import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { deleteExperiment, getExperimentMetrics, listExperiments, saveExperiment } from '../api';
import { useAuth } from '../context/AuthContext';

const createVariantId = () => `variant-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const newVariant = (suffix) => ({
  id: createVariantId(),
  key: suffix ? `variant-${suffix}` : '',
  name: suffix ? `Variant ${suffix.toUpperCase()}` : '',
  description: '',
  weight: 50,
  is_control: false,
});

const AdminExperimentsPage = () => {
  const { user, isAdmin, loading } = useAuth();
  const [experiments, setExperiments] = useState([]);
  const [selectedKey, setSelectedKey] = useState('');
  const [metrics, setMetrics] = useState(null);
  const [formState, setFormState] = useState({
    key: '',
    name: '',
    description: '',
    status: 'running',
    start_at: '',
    end_at: '',
    variants: [
      { ...newVariant('a'), key: 'control', name: 'Control', is_control: true },
      { ...newVariant('b') },
    ],
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (loading || !isAdmin) {
      return;
    }
    refreshExperiments();
  }, [loading, isAdmin]);

  const refreshExperiments = async () => {
    setLoadingList(true);
    setError('');
    try {
      const data = await listExperiments();
      const list = data?.experiments || [];
      setExperiments(list);
      if (!selectedKey && list.length > 0) {
        setSelectedKey(list[0]?.experiment?.key || '');
      }
    } catch (err) {
      setError(err.message || 'Failed to load experiments');
    } finally {
      setLoadingList(false);
    }
  };

  const loadMetrics = async (key) => {
    if (!key) return;
    setLoadingMetrics(true);
    setError('');
    try {
      const data = await getExperimentMetrics(key);
      setMetrics(data?.experiment || null);
    } catch (err) {
      setError(err.message || 'Failed to load metrics');
      setMetrics(null);
    } finally {
      setLoadingMetrics(false);
    }
  };

  useEffect(() => {
    if (selectedKey) {
      loadMetrics(selectedKey);
    }
  }, [selectedKey]);

  // Populate the form when an experiment is selected
  useEffect(() => {
    if (!selectedKey) return;
    const match = experiments.find((item) => item?.experiment?.key === selectedKey);
    if (!match) return;

    const exp = match.experiment || {};
    const variants = Array.isArray(match.variants) ? match.variants : [];

    setFormState({
      key: exp.key || '',
      name: exp.name || '',
      description: exp.description || '',
      status: exp.status || 'running',
      start_at: exp.start_at || '',
      end_at: exp.end_at || '',
      variants: variants.length
        ? variants.map((v) => ({
            key: v.variant_key || v.key || '',
            name: v.name || '',
            description: v.description || '',
            weight: typeof v.weight === 'number' ? v.weight : 50,
            is_control: !!v.is_control,
          }))
        : [
            { key: 'control', name: 'Control', description: '', weight: 50, is_control: true },
            { key: 'variant-b', name: 'Variant B', description: '', weight: 50, is_control: false },
          ],
    });
  }, [selectedKey, experiments]);

  const handleVariantChange = (index, field, value) => {
    setFormState((prev) => {
      const updated = [...prev.variants];

      // If the user adjusts weight, auto-balance others to sum ~100 when only two variants exist
      if (field === 'weight') {
        const clamped = Math.max(0, Math.min(100, Number(value)));
        updated[index] = { ...updated[index], weight: clamped };

        if (updated.length === 2) {
          const other = index === 0 ? 1 : 0;
          updated[other] = { ...updated[other], weight: Math.max(0, 100 - clamped) };
        }
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return { ...prev, variants: updated };
    });
  };

  const handleControlToggle = (index) => {
    setFormState((prev) => {
      const updated = prev.variants.map((variant, idx) => ({
        ...variant,
        is_control: idx === index,
      }));
      return { ...prev, variants: updated };
    });
  };

  const handleRemoveVariant = (index) => {
    setFormState((prev) => {
      const next = [...prev.variants];
      if (next.length <= 1) {
        return prev;
      }
      next.splice(index, 1);
      if (!next.some((variant) => variant.is_control) && next.length) {
        next[0] = { ...next[0], is_control: true };
      }
      return { ...prev, variants: next };
    });
  };

  const addVariantRow = () => {
    setFormState((prev) => ({
      ...prev,
      variants: [...prev.variants, newVariant(String.fromCharCode(97 + prev.variants.length))],
    }));
  };

  const saveExperimentForm = async () => {
    if (!formState.key.trim() || !formState.name.trim()) {
      setError('Experiment key and name are required');
      return;
    }
    if (formState.variants.length < 2) {
      setError('Add at least two variants to run a valid A/B test');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...formState,
        variants: formState.variants.map(({ id, ...variant }) => variant),
        start_at: formState.start_at ? new Date(formState.start_at).toISOString() : '',
        end_at: formState.end_at ? new Date(formState.end_at).toISOString() : '',
      };
      await saveExperiment(payload);
      await refreshExperiments();
      setSelectedKey(formState.key);
    } catch (err) {
      setError(err.message || 'Failed to save experiment');
    } finally {
      setSaving(false);
    }
  };

  if (!loading && !user) {
    return <Navigate to="/login" replace />;
  }

  if (!loading && user && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const variantMetrics = metrics?.metrics || [];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0f172a 0%, #0b1220 45%, #0f172a 100%)' }}>
      <SEO
        title="Experiment Lab — HiHired Admin"
        description="Plan, launch, and monitor A/B tests for both frontend flows and backend requests."
        canonical="https://hihired.org/admin/experiments"
      />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '28px 20px 48px', color: '#e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem', color: '#f8fafc' }}>Experiment Lab</h1>
            <p style={{ margin: '6px 0 0', color: '#cbd5e1' }}>
              Control traffic splits, bucket users, and compare outcomes across variants.
            </p>
          </div>
          <Link
            to="/admin/memberships"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              borderRadius: 12,
              background: '#38bdf8',
              color: '#0f172a',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 8px 24px rgba(56,189,248,0.25)',
            }}
          >
            Back to Admin
          </Link>
        </div>

        {error && (
          <div style={{ background: '#fecdd3', color: '#9f1239', padding: '10px 12px', borderRadius: 10, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, alignItems: 'start' }}>
          <div style={{ background: '#0b1220', borderRadius: 14, padding: 16, border: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h2 style={{ margin: 0, color: '#e2e8f0' }}>Active Experiments</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={refreshExperiments}
                disabled={loadingList}
                style={{
                  padding: '6px 12px',
                  borderRadius: 10,
                  border: '1px solid #38bdf8',
                  background: 'transparent',
                  color: '#38bdf8',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {loadingList ? 'Refreshing…' : 'Refresh'}
              </button>
              {selectedKey && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.confirm('Delete this experiment? This cannot be undone.')) return;
                    setDeleting(true);
                    setError('');
                    try {
                      await deleteExperiment(selectedKey);
                      await refreshExperiments();
                      setSelectedKey('');
                      setMetrics(null);
                      setFormState({
                        key: '',
                        name: '',
                        description: '',
                        status: 'running',
                        start_at: '',
                        end_at: '',
                        variants: [
                          { key: 'control', name: 'Control', description: '', weight: 50, is_control: true },
                          { key: 'variant-b', name: 'Variant B', description: '', weight: 50, is_control: false },
                        ],
                      });
                    } catch (err) {
                      setError(err.message || 'Failed to delete experiment');
                    } finally {
                      setDeleting(false);
                    }
                  }}
                  disabled={deleting}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 10,
                    border: '1px solid #ef4444',
                    background: 'transparent',
                    color: '#ef4444',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              )}
            </div>
          </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {experiments.map((item) => {
                const exp = item?.experiment;
                if (!exp) return null;
                const isSelected = exp.key === selectedKey;
                return (
                  <button
                    key={exp.id}
                    onClick={() => setSelectedKey(exp.key)}
                    style={{
                      textAlign: 'left',
                      borderRadius: 12,
                      padding: '12px 14px',
                      border: isSelected ? '1px solid #38bdf8' : '1px solid #1f2937',
                      background: isSelected ? 'rgba(56,189,248,0.08)' : '#111827',
                      color: '#e2e8f0',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 700 }}>{exp.name}</div>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: 999,
                        background: '#0ea5e9',
                        color: '#0b1220',
                        fontSize: 12,
                        fontWeight: 700,
                      }}>
                        {exp.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: '#cbd5e1', marginTop: 4 }}>{exp.description || 'No description'}</div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                      {item.variants?.map((variant) => (
                        <span
                          key={`${exp.key}-${variant.variant_key}`}
                          style={{
                            padding: '4px 8px',
                            borderRadius: 10,
                            background: variant.is_control ? '#22c55e33' : '#38bdf833',
                            color: '#cbd5e1',
                            fontSize: 12,
                            border: '1px solid #1f2937',
                          }}
                        >
                          {variant.name} · {variant.weight}%
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
              {experiments.length === 0 && (
                <div style={{ padding: '12px 10px', borderRadius: 10, border: '1px dashed #334155', color: '#cbd5e1' }}>
                  No experiments yet. Create your first split below.
                </div>
              )}
            </div>
          </div>

          <div style={{ background: '#0b1220', borderRadius: 14, padding: 16, border: '1px solid #1e293b' }}>
            <h2 style={{ margin: '0 0 10px', color: '#e2e8f0' }}>Create / Update Experiment</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ color: '#cbd5e1', fontWeight: 700 }}>Key</label>
              <input
                value={formState.key}
                onChange={(e) => setFormState((prev) => ({ ...prev, key: e.target.value }))}
                placeholder="signup-flow-test"
                style={inputStyle}
              />
              <label style={{ color: '#cbd5e1', fontWeight: 700 }}>Name</label>
              <input
                value={formState.name}
                onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Signup flow redesign"
                style={inputStyle}
              />
              <label style={{ color: '#cbd5e1', fontWeight: 700 }}>Description</label>
              <textarea
                value={formState.description}
                onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="What are we testing and why?"
                style={{ ...inputStyle, minHeight: 70 }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ color: '#cbd5e1', fontWeight: 700 }}>Status</label>
                  <select
                    value={formState.status}
                    onChange={(e) => setFormState((prev) => ({ ...prev, status: e.target.value }))}
                    style={{ ...inputStyle, background: '#0f172a', color: '#e2e8f0' }}
                  >
                    <option value="running">Running</option>
                    <option value="draft">Draft</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ color: '#cbd5e1', fontWeight: 700 }}>Start (optional)</label>
                  <input
                    type="datetime-local"
                    value={formState.start_at}
                    onChange={(e) => setFormState((prev) => ({ ...prev, start_at: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ color: '#cbd5e1', fontWeight: 700 }}>End (optional)</label>
                <input
                  type="datetime-local"
                  value={formState.end_at}
                  onChange={(e) => setFormState((prev) => ({ ...prev, end_at: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h3 style={{ margin: 0, color: '#e2e8f0' }}>Variants</h3>
                  <button
                    type="button"
                    onClick={addVariantRow}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 10,
                      border: '1px solid #22c55e',
                      background: 'transparent',
                      color: '#22c55e',
                      cursor: 'pointer',
                      fontWeight: 700,
                    }}
                  >
                    + Add Variant
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {formState.variants.map((variant, index) => (
                    <div
                      key={variant.id || index}
                      style={{
                        border: variant.is_control ? '1px solid #22c55e' : '1px solid #1f2937',
                        background: '#0f172a',
                        borderRadius: 12,
                        padding: '10px 12px',
                        display: 'grid',
                        gridTemplateColumns: '1.1fr 1.1fr 0.8fr 0.6fr',
                        gap: 8,
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, letterSpacing: 0.3 }}>KEY</span>
                        <input
                          value={variant.key}
                          onChange={(e) => handleVariantChange(index, 'key', e.target.value)}
                          placeholder="control or new-layout"
                          style={inputStyle}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, letterSpacing: 0.3 }}>NAME</span>
                        <input
                          value={variant.name}
                          onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                          placeholder="Current Layout"
                          style={inputStyle}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, letterSpacing: 0.3 }}>WEIGHT</span>
                        <input
                          type="number"
                          min="0"
                          value={variant.weight}
                          onChange={(e) => handleVariantChange(index, 'weight', Number(e.target.value))}
                          style={inputStyle}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'center' }}>
                        <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, letterSpacing: 0.3 }}>CONTROL</span>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#cbd5e1', fontSize: 13 }}>
                          <input
                            type="radio"
                            checked={variant.is_control}
                            onChange={() => handleControlToggle(index)}
                          />
                          Set as control
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(index)}
                          disabled={formState.variants.length <= 1}
                          style={{
                            marginTop: 6,
                            padding: '6px 10px',
                            borderRadius: 8,
                            border: '1px solid #ef4444',
                            background: formState.variants.length <= 1 ? '#1f2937' : '#991b1b',
                            color: '#fef2f2',
                            cursor: formState.variants.length <= 1 ? 'not-allowed' : 'pointer',
                            opacity: formState.variants.length <= 1 ? 0.5 : 1,
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={saveExperimentForm}
                disabled={saving}
                style={{
                  marginTop: 12,
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(90deg, #22c55e, #38bdf8)',
                  color: '#0f172a',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 10px 30px rgba(34,197,94,0.3)',
                }}
              >
                {saving ? 'Saving…' : 'Save Experiment'}
              </button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 18, background: '#0b1220', borderRadius: 14, padding: 16, border: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h2 style={{ margin: 0, color: '#e2e8f0' }}>Variant Performance</h2>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>
              {loadingMetrics ? 'Updating…' : selectedKey || 'Select an experiment'}
            </span>
          </div>
          {variantMetrics.length === 0 && !loadingMetrics && (
            <div style={{ padding: '12px 10px', borderRadius: 10, border: '1px dashed #334155', color: '#cbd5e1' }}>
              No metrics yet. Assign traffic to start collecting results.
            </div>
          )}
          {loadingMetrics && (
            <div style={{ color: '#cbd5e1' }}>Loading metrics…</div>
          )}
          {variantMetrics.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e2e8f0' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #1f2937' }}>
                    <th style={{ padding: '8px 6px' }}>Variant</th>
                    <th style={{ padding: '8px 6px' }}>Weight</th>
                    <th style={{ padding: '8px 6px' }}>Assignments</th>
                    <th style={{ padding: '8px 6px' }}>Events</th>
                  </tr>
                </thead>
                <tbody>
                  {variantMetrics.map((variant) => (
                    <tr key={variant.variant_id} style={{ borderBottom: '1px solid #111827' }}>
                      <td style={{ padding: '8px 6px', fontWeight: 700 }}>
                        {variant.variant_name} {variant.is_control ? '• Control' : ''}
                      </td>
                      <td style={{ padding: '8px 6px', color: '#cbd5e1' }}>{variant.weight}%</td>
                      <td style={{ padding: '8px 6px', color: '#cbd5e1' }}>{variant.assignments}</td>
                      <td style={{ padding: '8px 6px' }}>
                        {variant.events?.length ? variant.events.map((ev) => (
                          <span key={`${variant.variant_id}-${ev.event_name}`} style={{ display: 'inline-block', marginRight: 10 }}>
                            {ev.event_name}: {ev.total_events} ({ev.unique_users} users)
                          </span>
                        )) : <span style={{ color: '#94a3b8' }}>No events</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #1f2937',
  background: '#0f172a',
  color: '#e2e8f0',
  fontWeight: 600,
};

export default AdminExperimentsPage;
