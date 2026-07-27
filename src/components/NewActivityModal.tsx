import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PRELOADED_ACTIVITIES = [
  { name: 'Wake up at 6 AM', category: 'Health' },
  { name: 'Drink 2L Water', category: 'Health' },
  { name: 'Read 10 pages', category: 'Learning' },
  { name: 'Workout for 30m', category: 'Health' },
  { name: 'Code for 1 hour', category: 'Work' },
];

const NewActivityModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Health');
  const [duration, setDuration] = useState<string>('infinite');
  const [customDays, setCustomDays] = useState('30');
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handlePreloadedSelect = (act: typeof PRELOADED_ACTIVITIES[0]) => {
    setName(act.name);
    setCategory(act.category);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'activities'), {
        userId: currentUser?.uid,
        name,
        category,
        targetDays: duration === 'infinite' ? 'infinite' : parseInt(customDays),
        currentStreak: 0,
        createdAt: new Date()
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding activity: ', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="glass-panel"
          style={{ position: 'relative', width: '90%', maxWidth: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-secondary)' }}
        >
          <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <FiX size={24} />
          </button>
          
          <h2 style={{ marginBottom: '1.5rem' }}>New Activity</h2>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Quick add preloaded:</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {PRELOADED_ACTIVITIES.map(act => (
                <button 
                  key={act.name} 
                  type="button"
                  className="btn btn-outline" 
                  style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                  onClick={() => handlePreloadedSelect(act)}
                >
                  {act.name}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Activity Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Meditate for 10m" />
            </div>
            
            <div className="input-group">
              <label>Category</label>
              <div style={{ position: 'relative' }}>
                <div 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem 1rem', 
                    background: 'rgba(0,0,0,0.5)', 
                    border: isDropdownOpen ? '1px solid var(--accent-color)' : '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '12px',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {category}
                  <span style={{ fontSize: '0.8rem', transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: '0.3s' }}>▼</span>
                </div>
                
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      style={{ 
                        position: 'absolute', 
                        top: '100%', left: 0, right: 0, 
                        marginTop: '0.5rem', 
                        background: '#18181b', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        borderRadius: '12px', 
                        overflow: 'hidden',
                        zIndex: 10,
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                      }}
                    >
                      {['Health', 'Learning', 'Work', 'Personal'].map((cat, idx, arr) => (
                        <div 
                          key={cat}
                          onClick={() => { setCategory(cat); setIsDropdownOpen(false); }}
                          style={{ 
                            padding: '0.75rem 1rem', 
                            cursor: 'pointer', 
                            background: category === cat ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                            color: category === cat ? 'var(--accent-color)' : 'var(--text-primary)',
                            borderBottom: idx === arr.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                            transition: 'background 0.2s'
                          }}
                          onMouseOver={(e) => { if(category !== cat) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                          onMouseOut={(e) => { if(category !== cat) e.currentTarget.style.background = 'transparent' }}
                        >
                          {cat}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            <div className="input-group">
              <label>Goal Type</label>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <div 
                  onClick={() => setDuration('infinite')}
                  style={{ 
                    flex: 1, 
                    padding: '1rem 0.5rem', 
                    textAlign: 'center', 
                    borderRadius: '16px', 
                    cursor: 'pointer',
                    background: duration === 'infinite' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(0,0,0,0.4)',
                    border: duration === 'infinite' ? '1px solid var(--accent-color)' : '1px solid rgba(255,255,255,0.05)',
                    color: duration === 'infinite' ? 'var(--accent-color)' : 'var(--text-secondary)',
                    transition: 'all 0.3s ease',
                    boxShadow: duration === 'infinite' ? '0 4px 15px rgba(168, 85, 247, 0.15)' : 'none'
                  }}
                >
                  <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.25rem' }}>♾️</span>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Daily Habit</span>
                </div>
                <div 
                  onClick={() => setDuration('custom')}
                  style={{ 
                    flex: 1, 
                    padding: '1rem 0.5rem', 
                    textAlign: 'center', 
                    borderRadius: '16px', 
                    cursor: 'pointer',
                    background: duration === 'custom' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(0,0,0,0.4)',
                    border: duration === 'custom' ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.05)',
                    color: duration === 'custom' ? '#fbbf24' : 'var(--text-secondary)',
                    transition: 'all 0.3s ease',
                    boxShadow: duration === 'custom' ? '0 4px 15px rgba(251, 191, 36, 0.15)' : 'none'
                  }}
                >
                  <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.25rem' }}>⭐</span>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Challenge</span>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {duration === 'custom' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: '1rem' }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="input-group"
                  style={{ overflow: 'hidden' }}
                >
                  <label style={{ color: '#fbbf24' }}>Target Days</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="365" 
                    value={customDays} 
                    onChange={e => setCustomDays(e.target.value)} 
                    style={{ 
                      border: '1px solid #fbbf24', 
                      background: 'rgba(251, 191, 36, 0.05)',
                      color: '#fff',
                      boxShadow: '0 0 10px rgba(251, 191, 36, 0.1) inset'
                    }} 
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', padding: '1rem', fontSize: '1.1rem', borderRadius: '16px' }} disabled={loading}>
              {loading ? 'Adding...' : 'Create Goal'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default NewActivityModal;
