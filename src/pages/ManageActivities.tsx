import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiTrash2 } from 'react-icons/fi';
import { motion } from 'framer-motion';
import CustomNetworkBackground from '../components/CustomNetworkBackground';

interface Activity {
  id: string;
  name: string;
  category: string;
}

const ManageActivities: React.FC = () => {
  const { currentUser } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    if (!currentUser) return;
    try {
      const q = query(collection(db, 'activities'), where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const acts: Activity[] = [];
      querySnapshot.forEach((docSnap) => {
        acts.push({ id: docSnap.id, ...docSnap.data() } as Activity);
      });
      setActivities(acts);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [currentUser]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this activity? This cannot be undone.")) return;
    
    try {
      await deleteDoc(doc(db, 'activities', id));
      // Remove from local state immediately for snappy UI
      setActivities(prev => prev.filter(a => a.id !== id));
      
      // Note: We could also delete orphaned logs here, but for simplicity
      // and speed, Firebase handles orphaned documents fine.
    } catch (error) {
      console.error("Error deleting activity:", error);
      alert("Failed to delete activity.");
    }
  };

  return (
    <div className="page-wrapper" style={{ position: 'relative', zIndex: 1, padding: '0 1rem' }}>
      <CustomNetworkBackground />
      
      <header className="glass-panel" style={{ margin: '1rem', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/" className="btn btn-outline" style={{ padding: '0.5rem' }}>
            <FiArrowLeft />
          </Link>
          <h2 style={{ margin: 0, color: 'var(--accent-color)', fontSize: '1.5rem' }}>Manage Activities</h2>
        </div>
      </header>

      <main className="container main-content">
        {loading ? (
          <div className="loading-spinner"></div>
        ) : activities.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
            <h3>No activities found</h3>
            <p>You haven't created any activities yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activities.map((activity, index) => (
              <motion.div 
                key={activity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="glass-panel"
                style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{activity.name}</h3>
                  <span style={{ 
                    display: 'inline-block', 
                    marginTop: '0.25rem', 
                    fontSize: '0.875rem', 
                    color: 'var(--text-secondary)' 
                  }}>
                    {activity.category}
                  </span>
                </div>
                <button 
                  onClick={() => handleDelete(activity.id)}
                  className="btn"
                  style={{ 
                    backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                    color: 'var(--danger)', 
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    padding: '0.5rem 1rem'
                  }}
                >
                  <FiTrash2 /> Delete
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ManageActivities;
