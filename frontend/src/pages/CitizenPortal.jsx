import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Camera, MapPin, UploadCloud, CheckCircle, User, Phone, Home as HomeIcon, FileText, Loader2 } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '/api';

export default function CitizenPortal() {
  const nav = useNavigate();
  const email = sessionStorage.getItem('citizen_email') || '';
  const fileRef = useRef(null);

  const [step, setStep] = useState(1); // 1=form, 2=success
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [location, setLocation] = useState(null);
  const [locLoading, setLocLoading] = useState(false);
  const [result, setResult] = useState(null);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    description: '',
  });

  useEffect(() => {
    if (!email) nav('/auth/citizen');
  }, []);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const captureLocation = () => {
    if (!navigator.geolocation) return;
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocLoading(false);
      },
      () => setLocLoading(false),
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile || !location) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('email', email);
      fd.append('phone', form.phone);
      fd.append('address', form.address);
      fd.append('description', form.description);
      fd.append('latitude', location.lat);
      fd.append('longitude', location.lng);
      fd.append('image', imageFile);

      const res = await fetch(`${API}/complaint`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Submission failed');
      setResult(data);
      setStep(2);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 2 && result) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="page-center" style={{ flexDirection: 'column' }}>
        <div className="card" style={{ textAlign: 'center', maxWidth: '520px', width: '100%' }}>
          <CheckCircle size={64} color="var(--success)" style={{ margin: '0 auto 1.5rem' }} />
          <h2 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Complaint Submitted</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Your report has been analysed by AI and routed.</p>

          <div style={{ margin: '2rem 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', textAlign: 'left' }}>
            {[
              ['Ticket ID', result.ticket_id],
              ['Zone', result.mcd_zone],
              ['Damage', result.damage_type],
              ['Severity', `${Math.round(result.severity_score * 100)}%`],
            ].map(([label, val]) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
                <p style={{ fontWeight: 600, fontSize: '1.1rem', marginTop: '0.25rem' }}>{val}</p>
              </div>
            ))}
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>A confirmation has been sent to <strong>{email}</strong></p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button className="btn btn-outline" onClick={() => { setStep(1); setImageFile(null); setImagePreview(null); setLocation(null); setForm({ name: '', phone: '', address: '', description: '' }); }}>
              Report Another
            </button>
            <button className="btn btn-primary" onClick={() => nav('/')}>
              Back to Home
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="page-wrap" style={{ maxWidth: '720px', paddingTop: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.5px' }}>File a Complaint</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.3rem' }}>Logged in as <strong style={{ color: 'var(--text-primary)' }}>{email}</strong></p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

          {/* ── Personal Details ─────────────── */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} color="var(--accent-blue)" /> Personal Details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="field-group">
                <label className="field-label">Full Name</label>
                <input className="input-field" placeholder="Rachit Sharma" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="field-group">
                <label className="field-label">Phone Number</label>
                <input className="input-field" type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="field-group" style={{ gridColumn: '1 / -1' }}>
                <label className="field-label">Address</label>
                <input className="input-field" placeholder="Sector 4, Greater Noida" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>
            </div>
          </div>

          {/* ── Divider ──────────────────────── */}
          <div style={{ height: '1px', background: 'var(--border)' }} />

          {/* ── Photo Evidence ───────────────── */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Camera size={18} color="var(--accent-blue)" /> Capture Evidence
            </h3>
            <input type="file" accept="image/*" capture="environment" ref={fileRef} onChange={handleImage} style={{ display: 'none' }} />
            {!imagePreview ? (
              <div
                onClick={() => fileRef.current.click()}
                style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: '3rem 1.5rem', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }}
                onMouseOver={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <UploadCloud size={40} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
                <p style={{ fontWeight: 500 }}>Tap to open camera or upload</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Works on mobile & laptop</p>
              </div>
            ) : (
              <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                <img src={imagePreview} alt="Evidence" style={{ width: '100%', display: 'block' }} />
                <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'rgba(0,0,0,0.65)', color: 'white', border: 'none', padding: '0.4rem 0.9rem', borderRadius: '99px', cursor: 'pointer', fontSize: '0.82rem', backdropFilter: 'blur(4px)' }}>
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* ── Location ─────────────────────── */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={18} color="var(--accent-blue)" /> Location
            </h3>
            <button type="button" className="btn btn-outline" onClick={captureLocation} disabled={locLoading} style={{ width: '100%' }}>
              {locLoading ? <Loader2 size={18} /> : <MapPin size={18} />}
              {location ? '✓ Location Captured' : 'Get My Current Location'}
            </button>
            {location && (
              <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--success)' }}>
                Latitude {location.lat.toFixed(5)}, Longitude {location.lng.toFixed(5)}
              </p>
            )}
          </div>

          {/* ── Description ──────────────────── */}
          <div className="field-group">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={18} color="var(--accent-blue)" /> Additional Info
            </h3>
            <textarea className="input-field" rows={3} placeholder="Describe the damage, landmark, size estimate..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>

          {/* ── Submit ────────────────────────── */}
          <button type="submit" className="btn btn-primary" disabled={loading || !imageFile || !location || !form.name} style={{ padding: '1rem', fontSize: '1rem' }}>
            {loading ? <Loader2 size={20} /> : <><UploadCloud size={20} /> Submit Complaint</>}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
