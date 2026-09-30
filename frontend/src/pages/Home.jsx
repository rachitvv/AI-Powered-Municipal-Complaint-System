import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield } from 'lucide-react';

export default function Home() {
  const nav = useNavigate();

  return (
    <div className="page-center" style={{ flexDirection: 'column', textAlign: 'center' }}>
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        style={{ maxWidth: '860px' }}
      >
        {/* Top tag */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '99px', padding: '0.4rem 1rem', marginBottom: '2.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}
        >
          <Shield size={14} color="var(--accent-blue)" />
          AI-Powered Municipal Complaint System
        </motion.div>

        <h1 style={{ fontSize: 'clamp(2.8rem, 7vw, 5rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.05 }}>
          Smarter Roads,<br />
          <span style={{ color: 'var(--text-muted)' }}>Safer Cities.</span>
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{ marginTop: '1.5rem', fontSize: '1.15rem', color: 'var(--text-secondary)', maxWidth: '560px', margin: '1.5rem auto 0' }}
        >
          Capture road damage, get instant AI analysis, and let authorities act — all from one platform.
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}
        >
          Choose your role to continue
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2.5rem', flexWrap: 'wrap' }}
        >
          <button className="btn btn-primary" onClick={() => nav('/auth/citizen')} style={{ padding: '0.9rem 2rem', fontSize: '1rem' }}>
            I'm a Citizen <ArrowRight size={18} />
          </button>
          <button className="btn btn-outline" onClick={() => nav('/auth/admin')} style={{ padding: '0.9rem 2rem', fontSize: '1rem' }}>
            <Shield size={18} /> MCD Official
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
