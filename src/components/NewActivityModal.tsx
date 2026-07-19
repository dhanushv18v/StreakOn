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
              <select value={category} onChange={e => setCategory(e.target.value)}>
                <option value="Health">Health</option>
                <option value="Learning">Learning</option>
                <option value="Work">Work</option>
                <option value="Personal">Personal</option>
              </select>
            </div>
            
            <div className="input-group">
              <label>Duration</label>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="radio" name="duration" value="infinite" checked={duration === 'infinite'} onChange={() => setDuration('infinite')} />
                  Infinite
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="radio" name="duration" value="custom" checked={duration === 'custom'} onChange={() => setDuration('custom')} />
                  Target Days
                </label>
              </div>
            </div>

            {duration === 'custom' && (
              <div className="input-group">
                <label>Target Days</label>
                <input type="number" min="1" max="365" value={customDays} onChange={e => setCustomDays(e.target.value)} />
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
              {loading ? 'Adding...' : 'Add Activity'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default NewActivityModal;
