import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FcGoogle } from 'react-icons/fc';
import { motion } from 'framer-motion';
import CustomNetworkBackground from '../components/CustomNetworkBackground';

const Login: React.FC = () => {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      setError('Failed to log in with Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', zIndex: 1 }}>
      <CustomNetworkBackground />
      <motion.div 
        className="glass-panel"
        style={{ padding: '3rem 2rem', width: '90%', maxWidth: '400px', textAlign: 'center', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(168, 85, 247, 0.25)', background: 'rgba(24, 24, 27, 0.6)', backdropFilter: 'blur(20px)' }}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, type: 'spring', bounce: 0.5 }}
      >
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7, #ec4899)', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(168, 85, 247, 0.4)' }}>
            <span style={{ fontSize: '2.5rem' }}>✨</span>
          </div>
          <h1 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '2.25rem', letterSpacing: '-1px', fontWeight: 800 }}>Streak<span style={{ color: 'var(--accent-color)' }}>On</span></h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>Build better habits, one day at a time.</p>
        </div>
        
        {error && <div style={{ color: '#fff', backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.5)', padding: '0.75rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>{error}</div>}

        <button 
          onClick={handleGoogleLogin} 
          disabled={loading}
          className="btn"
          style={{ width: '100%', padding: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', fontWeight: 600, transition: 'all 0.3s ease', cursor: 'pointer' }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)')}
        >
          <FcGoogle size={24} />
          {loading ? 'Logging in...' : 'Continue with Google'}
        </button>
      </motion.div>
    </div>
  );
};

export default Login;
