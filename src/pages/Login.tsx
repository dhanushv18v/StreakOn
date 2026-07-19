import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FcGoogle } from 'react-icons/fc';
import { motion } from 'framer-motion';

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
    <div className="page-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="gradient-bg"></div>
      <motion.div 
        className="glass-panel"
        style={{ padding: '3rem', width: '100%', maxWidth: '400px', textAlign: 'center' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 style={{ marginBottom: '0.5rem', color: 'var(--accent-color)' }}>StreakOn</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Build better habits, one day at a time.</p>
        
        {error && <div style={{ color: 'white', backgroundColor: 'var(--danger)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem' }}>{error}</div>}

        <button 
          onClick={handleGoogleLogin} 
          disabled={loading}
          className="btn btn-google"
          style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
        >
          <FcGoogle size={24} />
          {loading ? 'Logging in...' : 'Continue with Google'}
        </button>
      </motion.div>
    </div>
  );
};

export default Login;
