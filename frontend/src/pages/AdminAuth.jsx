import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, Loader2, X, ArrowRight } from 'lucide-react';

const API = 'http://localhost:8000/api';

export default function AdminAuth() {
  const nav = useNavigate();
  const [officerId, setOfficerId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officer_id: officerId, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'Login failed');
        setShowForgot(false);
        // Show forgot password hint after a failed attempt
        setTimeout(() => setShowForgot(true), 300);
        return;
      }
      sessionStorage.setItem('admin_name', data.name);
      nav('/admin');
    } catch (err) {
      setError('Server unreachable. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setForgotMsg('');
    setForgotLoading(true);
    try {
      const res = await fetch(`${API}/admin/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed');
      setForgotMsg('Password has been sent to your email.');
    } catch (err) {
      setForgotMsg(err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="page-center"
    >
      <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
        {/* Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '1.25rem', borderRadius: '50%', border: '1px solid var(--border)' }}>
            <Shield size={36} color="var(--text-primary)" />
          </div>
        </div>

        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, textAlign: 'center', letterSpacing: '-0.5px' }}>MCD Portal</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2rem', fontSize: '0.9rem' }}>Authorized personnel only</p>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-sm)', padding: '0.7rem 1rem', marginBottom: '1.25rem', color: 'var(--danger)', fontSize: '0.88rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="field-group">
            <label className="field-label">Officer ID</label>
            <input className="input-field" placeholder="admin" value={officerId} onChange={e => setOfficerId(e.target.value)} required />
          </div>
          <div className="field-group">
            <label className="field-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input type="password" className="input-field" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={{ paddingLeft: '2.8rem' }} required />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? <Loader2 size={18} /> : <><ArrowRight size={18} /> Sign In</>}
          </button>
        </form>

        {/* Forgot Password Link */}
        <AnimatePresence>
          {showForgot && (
            <motion.button
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              type="button"
              onClick={() => setShowForgot('modal')}
              style={{ display: 'block', width: '100%', background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', marginTop: '1rem', fontSize: '0.9rem', textAlign: 'center' }}
            >
              Forgot your password?
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Forgot Password Modal ─────────── */}
      <AnimatePresence>
        {showForgot === 'modal' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) setShowForgot(true); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card"
              style={{ maxWidth: '400px', width: '100%', position: 'relative' }}
            >
              <button onClick={() => setShowForgot(true)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>

              <h3 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '0.4rem' }}>Recover Password</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>Enter your registered admin email and we'll send your credentials.</p>

              <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="email" className="input-field" placeholder="admin@mcd.gov.in" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} style={{ paddingLeft: '2.8rem' }} required />
                </div>
                <button type="submit" className="btn btn-primary" disabled={forgotLoading} style={{ width: '100%' }}>
                  {forgotLoading ? <Loader2 size={18} /> : 'Send Password'}
                </button>
                {forgotMsg && <p style={{ fontSize: '0.88rem', color: forgotMsg.includes('sent') ? 'var(--success)' : 'var(--danger)', textAlign: 'center' }}>{forgotMsg}</p>}
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
