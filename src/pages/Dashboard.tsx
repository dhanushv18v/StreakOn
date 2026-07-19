import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiChevronLeft, FiChevronRight, FiCircle, FiLogOut, FiPieChart, FiPlus, FiTrendingUp, FiSettings, FiList, FiAward } from 'react-icons/fi';
import { addDays, format, isFuture, subDays } from 'date-fns';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';

import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import CustomNetworkBackground from '../components/CustomNetworkBackground';
import NewActivityModal from '../components/NewActivityModal';

interface Activity {
  id: string;
  name: string;
  category: string;
  currentStreak: number;
}

interface Log {
  id: string;
  activityId: string;
  date: string;
  timestamp: any;
}

const Dashboard: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!currentUser) return;
    try {
      // Fetch Activities
      const q = query(collection(db, 'activities'), where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const acts: Activity[] = [];
      querySnapshot.forEach((docSnap) => {
        acts.push({ id: docSnap.id, ...docSnap.data() } as Activity);
      });
      setActivities(acts);

      // Fetch Logs for current date
      const todayFormatted = format(currentDate, 'yyyy-MM-dd');
      const logsQuery = query(
        collection(db, 'activityLogs'),
        where('userId', '==', currentUser.uid),
        where('date', '==', todayFormatted)
      );
      
      const logsSnapshot = await getDocs(logsQuery);
      const lgs: Log[] = [];
      logsSnapshot.forEach((docSnap) => {
        lgs.push({ id: docSnap.id, ...docSnap.data() } as Log);
      });
      setLogs(lgs);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser, currentDate]);

  const toggleActivityStatus = async (activityId: string) => {
    if (!currentUser) return;
    
    const existingLog = logs.find(log => log.activityId === activityId);
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;

    const todayFormatted = format(currentDate, 'yyyy-MM-dd');

    // --- Optimistic UI Update (Instant Feedback) ---
    if (existingLog) {
      setLogs(prev => prev.filter(l => l.activityId !== activityId));
      setActivities(prev => prev.map(a => a.id === activityId ? { ...a, currentStreak: Math.max(0, a.currentStreak - 1) } : a));
    } else {
      const tempId = `temp-${Date.now()}`;
      setLogs(prev => [...prev, { id: tempId, activityId, date: todayFormatted, timestamp: new Date() }]);
      setActivities(prev => prev.map(a => a.id === activityId ? { ...a, currentStreak: a.currentStreak + 1 } : a));
    }

    // --- Background Firebase Update ---
    try {
      const activityRef = doc(db, 'activities', activityId);

      if (existingLog) {
        if (!existingLog.id.startsWith('temp-')) {
          await deleteDoc(doc(db, 'activityLogs', existingLog.id));
        }
        await updateDoc(activityRef, { currentStreak: Math.max(0, activity.currentStreak - 1) });
      } else {
        const newLogRef = await addDoc(collection(db, 'activityLogs'), {
          userId: currentUser.uid,
          activityId,
          date: todayFormatted,
          timestamp: new Date()
        });
        
        // Update the temporary ID to the real database ID silently
        setLogs(prev => prev.map(l => l.activityId === activityId && l.id.startsWith('temp-') ? { ...l, id: newLogRef.id } : l));
        await updateDoc(activityRef, { currentStreak: activity.currentStreak + 1 });
      }
    } catch (error) {
      console.error("Error toggling activity:", error);
      // Revert UI to match database if the network request fails
      fetchData();
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out");
    }
  };

  return (
    <div className="page-wrapper" style={{ position: 'relative', zIndex: 1, padding: '0 1rem' }}>
      <CustomNetworkBackground />
      
      <header className="glass-panel" style={{ margin: '1rem', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: 'var(--accent-color)' }}>StreakOn</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/analytics" className="btn btn-outline" style={{ padding: '0.5rem 1rem' }} aria-label="Analytics">
            <FiPieChart /> <span className="hide-on-mobile">Analytics</span>
          </Link>
          <Link to="/manage" className="btn btn-outline" style={{ padding: '0.5rem 1rem' }} aria-label="Manage Activities">
            <FiSettings /> <span className="hide-on-mobile">Manage</span>
          </Link>
          <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
            <FiLogOut /> <span className="hide-on-mobile">Logout</span>
          </button>
        </div>
      </header>

      <main className="container main-content">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="date-navigator-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ marginBottom: '0.5rem' }}>Welcome back! 👋</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)' }}>
                <button 
                  onClick={() => setCurrentDate(subDays(currentDate, 1))}
                  className="btn btn-outline" style={{ padding: '0.25rem 0.5rem' }}
                  title="Previous Day"
                >
                  <FiChevronLeft />
                </button>
                <span style={{ fontWeight: 600 }}>{format(currentDate, 'MMMM do, yyyy')}</span>
                <button 
                  onClick={() => setCurrentDate(addDays(currentDate, 1))}
                  disabled={isFuture(addDays(currentDate, 1))}
                  className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', opacity: isFuture(addDays(currentDate, 1)) ? 0.5 : 1 }}
                  title="Next Day"
                >
                  <FiChevronRight />
                </button>
                <button 
                  onClick={() => setCurrentDate(new Date())}
                  disabled={format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')}
                  className="btn btn-outline" 
                  style={{ 
                    padding: '0.25rem 0.75rem', 
                    fontSize: '0.875rem', 
                    marginLeft: '0.5rem',
                    opacity: 1,
                    color: format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'var(--text-primary)' : '',
                    cursor: format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'default' : 'pointer'
                  }}
                >
                  Today
                </button>
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
              <FiPlus /> New Activity
            </button>
          </div>
        </motion.div>

        {/* Overview Dashboard Box */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-panel" 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-around', 
            padding: '2rem', 
            marginBottom: '3rem', 
            textAlign: 'center', 
            flexWrap: 'wrap', 
            gap: '1rem',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            borderLeft: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '0 8px 32px 0 rgba(0,0,0,0.3)',
            borderRadius: '24px'
          }}
        >
          <motion.div 
            whileHover={{ y: -5, scale: 1.02 }}
            style={{ flex: '1 1 120px', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}
          >
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <FiList /> Total
            </p>
            <h2 style={{ margin: 0, color: 'var(--accent-color)', fontSize: '2.5rem', fontWeight: 800 }}>{activities.length}</h2>
          </motion.div>
          <motion.div 
            whileHover={{ y: -5, scale: 1.02 }}
            style={{ flex: '1 1 120px', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}
          >
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <FiCheckCircle /> Completed
            </p>
            <h2 style={{ margin: 0, color: 'var(--success)', fontSize: '2.5rem', fontWeight: 800 }}>{logs.length}</h2>
          </motion.div>
          <motion.div 
            whileHover={{ y: -5, scale: 1.02 }}
            style={{ flex: '1 1 120px', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}
          >
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <FiAward /> Streaks
            </p>
            <h2 style={{ margin: 0, color: 'var(--warning)', fontSize: '2.5rem', fontWeight: 800 }}>{activities.filter(a => a.currentStreak > 0).length}</h2>
          </motion.div>
          
          {/* Daily Progress Bar */}
          <div style={{ width: '100%', marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>Today's Progress</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent-color)' }}>
                {activities.length > 0 ? Math.round((logs.length / activities.length) * 100) : 0}%
              </span>
            </div>
            <div style={{ width: '100%', height: '12px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden' }}>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${activities.length > 0 ? (logs.length / activities.length) * 100 : 0}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{ 
                  height: '100%', 
                  backgroundColor: 'var(--accent-color)',
                  backgroundImage: 'linear-gradient(90deg, var(--accent-color) 0%, var(--success) 100%)'
                }}
              />
            </div>
          </div>
        </motion.div>

        {loading ? (
            <div className="loading-spinner"></div>
          ) : activities.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
              <h3>No activities yet</h3>
              <p>Create your first activity to start building your streak!</p>
              <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ marginTop: '1rem' }}>
                <FiPlus /> Add Activity
              </button>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gap: '0.5rem', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              alignContent: 'start' 
            }}>
              {activities.map(activity => {
                const isCompletedToday = logs.some(log => log.activityId === activity.id);
                return (
                  <motion.div 
                    key={activity.id}
                    className="glass-panel" 
                    style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>{activity.name}</h3>
                      <span style={{ 
                        display: 'inline-block', 
                        marginTop: '0.5rem', 
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '20px', 
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        backgroundColor: 'var(--bg-secondary)', 
                        color: 'var(--accent-color)' 
                      }}>
                        {activity.category}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', color: (activity.currentStreak || 0) > 0 ? 'var(--warning)' : 'var(--text-secondary)', fontWeight: 600 }}>
                        <FiTrendingUp /> {activity.currentStreak || 0} day streak
                      </div>
                    </div>
                    <button 
                      onClick={() => toggleActivityStatus(activity.id)}
                      style={{ 
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: isCompletedToday ? 'var(--success)' : 'var(--text-secondary)',
                        transition: 'color 0.2s'
                      }}
                    >
                      {isCompletedToday ? <FiCheckCircle size={32} /> : <FiCircle size={32} />}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
      </main>

      <NewActivityModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchData} 
      />
    </div>
  );
};

export default Dashboard;
