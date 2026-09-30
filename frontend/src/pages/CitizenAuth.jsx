import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Mail, Loader2 } from 'lucide-react';

const API = 'http://localhost:8000/api';

export default function CitizenAuth() {
  const [step, setStep] = useState(1); // 1 = email, 2 = otp
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const nav = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to send OTP');
      // Show the OTP in an alert so you can log in without a real email server
      alert(`[Project Demo] Your OTP is: ${data.otp_debug}`);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Verification failed');
      // Save email in sessionStorage for the portal page
      sessionStorage.setItem('citizen_email', email);
      nav('/portal');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.4 }}
      className="page-center"
    >
      <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 700, letterSpacing: '-0.5px', marginBottom: '0.4rem' }}>Citizen Login</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.92rem' }}>We'll send a one-time code to verify your email.</p>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-sm)', padding: '0.7rem 1rem', marginBottom: '1.5rem', color: 'var(--danger)', fontSize: '0.88rem' }}>
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="field-group">
              <label className="field-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  className="input-field"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '2.8rem' }}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
              {loading ? <Loader2 size={18} className="spin" /> : <><ArrowRight size={18} /> Send OTP</>}
            </button>
          </form>
        ) : (
          <motion.form initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Code sent to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
            </p>
            <div className="field-group">
              <label className="field-label">4-Digit Code</label>
              <input
                type="text"
                className="input-field"
                placeholder="• • • •"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={4}
                style={{ textAlign: 'center', letterSpacing: '0.8rem', fontSize: '1.4rem', fontWeight: 600 }}
                required
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
              {loading ? <Loader2 size={18} /> : 'Verify & Continue'}
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
              <button type="button" onClick={() => { setStep(1); setOtp(''); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.88rem' }}>
                ← Change email
              </button>
              <button type="button" onClick={handleSendOtp} disabled={loading} style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', fontSize: '0.88rem' }}>
                {loading ? 'Resending...' : 'Resend OTP'}
              </button>
            </div>
          </motion.form>
        )}
      </div>
    </motion.div>
  );
}
