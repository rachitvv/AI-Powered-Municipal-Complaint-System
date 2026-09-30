import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Clock, CheckCircle2, XCircle, MapPin, User, Phone, Mail, FileText, Image, Activity, LogOut, Loader2, X, ArrowRight } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '/api';
const BACKEND = import.meta.env.VITE_BACKEND_URL || '';

export default function AdminDashboard() {
  const nav = useNavigate();
  const adminName = sessionStorage.getItem('admin_name') || 'Officer';

  const [tab, setTab] = useState('new');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);     // popup ticket
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem('admin_name')) nav('/auth/admin');
  }, []);

  useEffect(() => { fetchTickets(); }, [tab]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/complaints?status=${tab}`);
      const data = await res.json();
      setTickets(data);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (ticketId, newStatus, note = '') => {
    setActionLoading(true);
    try {
      await fetch(`${API}/admin/complaint/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, detail: note }),
      });
      setDetail(null);
      fetchTickets();
    } catch (err) {
      alert('Failed to update');
    } finally {
      setActionLoading(false);
    }
  };

  const tabs = [
    { id: 'new', label: 'New Issues', icon: <AlertCircle size={16} /> },
    { id: 'progress', label: 'In Progress', icon: <Clock size={16} /> },
    { id: 'resolved', label: 'Resolved', icon: <CheckCircle2 size={16} /> },
  ];

  const badgeClass = (s) => s === 'new' ? 'badge-new' : s === 'progress' ? 'badge-progress' : s === 'resolved' ? 'badge-resolved' : 'badge-rejected';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="page-wrap" style={{ maxWidth: '1100px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Command Center</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
            <Activity size={14} color="var(--success)" /> Welcome, {adminName}
          </p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => { sessionStorage.removeItem('admin_name'); nav('/'); }}>
          <LogOut size={16} /> Logout
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '99px', padding: '0.3rem', marginBottom: '2rem', width: 'fit-content' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '0.55rem 1.25rem', borderRadius: '99px', border: 'none', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s',
              background: tab === t.id ? 'var(--text-primary)' : 'transparent',
              color: tab === t.id ? 'var(--bg-base)' : 'var(--text-secondary)',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Ticket Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : tickets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '1.1rem' }}>No tickets in this category.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          <AnimatePresence>
            {tickets.map((t, i) => (
              <motion.div
                key={t.ticket_id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                className="card-sm"
                style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
                onClick={() => setDetail(t)}
              >
                {/* Top row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>{t.ticket_id}</span>
                  <span className={`badge ${badgeClass(t.status)}`}>{t.status}</span>
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.5rem' }}>{t.damage_type}</h3>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
                  <User size={14} /> {t.citizen_name}
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={14} /> {t.latitude?.toFixed(4)}, {t.longitude?.toFixed(4)}
                </p>

                {/* AI Confidence Bar */}
                <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    <span>AI Confidence</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{Math.round(t.confidence * 100)}%</span>
                  </div>
                  <div className="progress-track">
                    <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${t.confidence * 100}%` }} transition={{ duration: 1 }} style={{ background: t.confidence > 0.85 ? 'var(--danger)' : 'var(--warning)' }} />
                  </div>
                </div>

                {/* Progress bar for in-progress tickets */}
                {t.status === 'progress' && (
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                      <span>Work Progress</span>
                      <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{t.progress_percent}%</span>
                    </div>
                    <div className="progress-track">
                      <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${t.progress_percent}%` }} transition={{ duration: 1.2 }} style={{ background: 'var(--accent-blue)' }} />
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{t.progress_detail}</p>
                  </div>
                )}

                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                  Click to view full details →
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ═══ Detail Modal ═══ */}
      <AnimatePresence>
        {detail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) setDetail(null); }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="card"
              style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}
            >
              <button onClick={() => setDetail(null)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={22} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{detail.ticket_id}</h2>
                <span className={`badge ${badgeClass(detail.status)}`}>{detail.status}</span>
              </div>

              {/* Evidence Image */}
              {detail.image_url && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <p className="field-label" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Image size={14} /> Evidence Photo</p>
                  <img src={`${BACKEND}${detail.image_url}`} alt="Evidence" style={{ width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }} />
                </div>
              )}

              {/* Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {[
                  [<User size={14} />, 'Complainant', detail.citizen_name],
                  [<Mail size={14} />, 'Email', detail.citizen_email],
                  [<Phone size={14} />, 'Phone', detail.citizen_phone || 'N/A'],
                  [<MapPin size={14} />, 'Location', `${detail.latitude?.toFixed(5)}, ${detail.longitude?.toFixed(5)}`],
                  [<AlertCircle size={14} />, 'Damage', detail.damage_type],
                  [<Activity size={14} />, 'Severity', `${Math.round(detail.severity_score * 100)}%`],
                ].map(([icon, label, value], idx) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>{icon} {label}</p>
                    <p style={{ fontWeight: 500, fontSize: '0.92rem' }}>{value}</p>
                  </div>
                ))}
              </div>

              {detail.description && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <p className="field-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><FileText size={14} /> Description</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>{detail.description}</p>
                </div>
              )}

              {detail.citizen_address && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <p className="field-label">Address</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>{detail.citizen_address}</p>
                </div>
              )}

              {/* Progress info for in-progress tickets */}
              {detail.status === 'progress' && (
                <div style={{ background: 'rgba(59,130,246,0.06)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(59,130,246,0.15)', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <p style={{ fontWeight: 500, fontSize: '0.9rem' }}>Work Progress</p>
                    <span style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>{detail.progress_percent}%</span>
                  </div>
                  <div className="progress-track" style={{ marginBottom: '0.75rem' }}>
                    <div className="progress-fill" style={{ width: `${detail.progress_percent}%`, background: 'var(--accent-blue)' }} />
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{detail.progress_detail}</p>
                </div>
              )}

              {/* Resolved info */}
              {detail.status === 'resolved' && (
                <div style={{ background: 'rgba(34,197,94,0.06)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(34,197,94,0.15)', marginBottom: '1.5rem' }}>
                  <p style={{ fontWeight: 500, color: 'var(--success)', marginBottom: '0.25rem' }}>✓ Issue Resolved</p>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{detail.progress_detail}</p>
                </div>
              )}

              {/* Rejection info */}
              {detail.status === 'rejected' && (
                <div style={{ background: 'rgba(239,68,68,0.06)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.15)', marginBottom: '1.5rem' }}>
                  <p style={{ fontWeight: 500, color: 'var(--danger)', marginBottom: '0.25rem' }}>✕ Rejected</p>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{detail.rejection_reason}</p>
                </div>
              )}

              {/* Action Buttons */}
              {detail.status === 'new' && (
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button className="btn btn-primary" disabled={actionLoading} style={{ flex: 1 }} onClick={() => updateStatus(detail.ticket_id, 'progress', 'Field team has been dispatched to inspect the site.')}>
                    {actionLoading ? <Loader2 size={16} /> : <><ArrowRight size={16} /> Start Working</>}
                  </button>
                  <button className="btn btn-danger" disabled={actionLoading} style={{ flex: 1 }} onClick={() => updateStatus(detail.ticket_id, 'rejected', 'Complaint does not meet actionable criteria after review.')}>
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              )}

              {detail.status === 'progress' && (
                <button className="btn btn-success" disabled={actionLoading} style={{ width: '100%' }} onClick={() => updateStatus(detail.ticket_id, 'resolved', 'Road has been fully repaired and inspected.')}>
                  {actionLoading ? <Loader2 size={16} /> : <><CheckCircle2 size={16} /> Mark as Resolved</>}
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
