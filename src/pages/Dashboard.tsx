import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiCircle, FiLogOut, FiPieChart, FiSettings, FiTrendingUp, FiPlus } from 'react-icons/fi';
import { format, isFuture, eachDayOfInterval, isSameDay, subDays, addDays } from 'date-fns';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';

import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import CustomNetworkBackground from '../components/CustomNetworkBackground';
import NewActivityModal from '../components/NewActivityModal';
import BottomNav from '../components/BottomNav';

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

// Circular Progress Component
const CircularProgress = ({ percentage, theme = 'daily', label = 'Done', showFire = true }: { percentage: number, theme?: 'daily' | 'target', label?: string, showFire?: boolean }) => {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const fireScale = 0.5 + (percentage / 100) * 0.8;
  const fireOpacity = 0.3 + (percentage / 100) * 0.7;

  const isTarget = theme === 'target';
  const gradientId = isTarget ? "goldGradient" : "cuteGradient";
  const startColor = isTarget ? "#fde047" : "#a855f7"; // Lighter yellow
  const endColor = isTarget ? "#fbbf24" : "#f472b6";   // Standard gold
  const shadowColor = isTarget ? "rgba(251, 191, 36, 0.4)" : "rgba(244, 114, 182, 0.4)";
  const textColor = isTarget ? "#fde047" : "#f472b6";

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0.5rem 0' }}>
      <div style={{ position: 'relative', width: '160px', height: '160px' }}>
        <svg style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.3))' }}>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={startColor} />
              <stop offset="100%" stopColor={endColor} />
            </linearGradient>
          </defs>
          <circle 
            cx="80" cy="80" r={radius} 
            stroke="rgba(255,255,255,0.03)" 
            strokeWidth="18" fill="transparent" 
            style={{ strokeLinecap: 'round' }}
          />
          <motion.circle 
            cx="80" cy="80" r={radius} 
            stroke={`url(#${gradientId})`} 
            strokeWidth="18" fill="transparent" 
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ type: 'spring', bounce: 0.4, duration: 1.5 }}
            style={{ strokeLinecap: 'round', filter: `drop-shadow(0 4px 8px ${shadowColor})` }}
          />
        </svg>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {showFire && (
            <motion.div
              style={{ fontSize: '1.25rem', marginBottom: '-0.25rem', filter: `drop-shadow(0 0 10px rgba(255, 100, 0, ${fireOpacity}))` }}
              animate={{ scale: fireScale, opacity: fireOpacity }}
              transition={{ type: 'spring', bounce: 0.5 }}
            >
              🔥
            </motion.div>
          )}
          <span style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-1px', lineHeight: 1.1 }}>
            {percentage}<span style={{fontSize:'1rem', color: 'var(--text-secondary)'}}>%</span>
          </span>
          <span style={{ fontSize: '0.65rem', color: textColor, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
            {percentage === 100 ? 'YAY! 🎉' : label}
          </span>
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Horizontal Calendar Logic: Past 14 days and Next 7 days
  const weekDays = eachDayOfInterval({ 
    start: subDays(new Date(), 14), 
    end: addDays(new Date(), 7) 
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to today
  useEffect(() => {
    if (scrollRef.current) {
      const todayElement = scrollRef.current.querySelector('[data-istoday="true"]');
      if (todayElement) {
        todayElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, []);

  const fetchData = async () => {
    if (!currentUser) return;
    try {
      const q = query(collection(db, 'activities'), where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const acts: Activity[] = [];
      querySnapshot.forEach((docSnap) => {
        acts.push({ id: docSnap.id, ...docSnap.data() } as Activity);
      });
      setActivities(acts);

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

    if (existingLog) {
      setLogs(prev => prev.filter(l => l.activityId !== activityId));
      setActivities(prev => prev.map(a => a.id === activityId ? { ...a, currentStreak: Math.max(0, a.currentStreak - 1) } : a));
    } else {
      const tempId = `temp-${Date.now()}`;
      setLogs(prev => [...prev, { id: tempId, activityId, date: todayFormatted, timestamp: new Date() }]);
      setActivities(prev => prev.map(a => a.id === activityId ? { ...a, currentStreak: a.currentStreak + 1 } : a));
    }

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
        setLogs(prev => prev.map(l => l.activityId === activityId && l.id.startsWith('temp-') ? { ...l, id: newLogRef.id } : l));
        await updateDoc(activityRef, { currentStreak: activity.currentStreak + 1 });
      }
    } catch (error) {
      console.error("Error toggling activity:", error);
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

  // Calculate separate completion percentages
  const dailyActivities = activities.filter(a => a.targetDays === 'infinite' || !a.targetDays);
  const dailyLogs = logs.filter(log => dailyActivities.some(a => a.id === log.activityId));
  const dailyPercentage = dailyActivities.length > 0 ? Math.round((dailyLogs.length / dailyActivities.length) * 100) : 0;

  const challengeActivities = activities.filter(a => typeof a.targetDays === 'number' && (a.currentStreak || 0) < a.targetDays);
  const challengeLogs = logs.filter(log => challengeActivities.some(a => a.id === log.activityId));
  const challengePercentage = challengeActivities.length > 0 ? Math.round((challengeLogs.length / challengeActivities.length) * 100) : 0;

  return (
    <div className="page-wrapper" style={{ position: 'relative', zIndex: 1, padding: '0 1rem' }}>
      <CustomNetworkBackground />
      
      {/* Desktop Header */}
      <header className="glass-panel desktop-header" style={{ margin: '1rem', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>
            Hello, {currentUser?.displayName || currentUser?.email?.split('@')[0]}! 👋
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/analytics" className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
            <FiPieChart /> Analytics
          </Link>
          <Link to="/manage" className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
            <FiSettings /> Manage
          </Link>
          <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>
            <FiLogOut /> Logout
          </button>
        </div>
      </header>

      <main className="container main-content" style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '1rem' }}>
        
        {/* Mobile Header elements (Week Navigator) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', margin: 0 }}>
                Hello, {currentUser?.displayName || currentUser?.email?.split('@')[0]}! 👋
              </h1>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{format(currentDate, 'MMMM yyyy')}</p>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="btn btn-primary"
                style={{ width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', boxShadow: '0 4px 10px rgba(168, 85, 247, 0.4)' }}
              >
                <FiPlus size={22} />
              </button>
              {!isSameDay(currentDate, new Date()) && (
                <button 
                  onClick={() => {
                    setCurrentDate(new Date());
                    if (scrollRef.current) {
                      const todayElement = scrollRef.current.querySelector('[data-istoday="true"]');
                      if (todayElement) todayElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                    }
                  }} 
                  className="btn btn-outline"
                  style={{ borderRadius: '20px', padding: '0.5rem 1rem', fontSize: '0.8rem', borderColor: 'var(--accent-color)', color: 'var(--accent-color)' }}
                >
                  Today
                </button>
              )}
              {/* Desktop Add Button */}
              <button className="btn btn-primary desktop-header" onClick={() => setIsModalOpen(true)}>
                + Add Habit
              </button>
            </div>
          </div>

          {/* Horizontal Week Slider */}
          <div 
            ref={scrollRef}
            className="hide-scrollbar"
            style={{ 
              display: 'flex', 
              gap: '0.75rem', 
              overflowX: 'auto', 
              paddingBottom: '1rem', 
              scrollSnapType: 'x mandatory' 
            }}
          >
            {weekDays.map(day => {
              const isSelected = isSameDay(day, currentDate);
              const isToday = isSameDay(day, new Date());
              return (
                <button
                  key={day.toString()}
                  data-istoday={isToday}
                  onClick={() => setCurrentDate(day)}
                  style={{
                    flex: '0 0 auto',
                    scrollSnapAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '60px',
                    height: '80px',
                    borderRadius: '20px',
                    border: 'none',
                    background: isSelected ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)',
                    color: isSelected ? '#000' : 'var(--text-primary)',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 4px 12px rgba(217, 249, 95, 0.4)' : 'none',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px', opacity: isSelected ? 1 : 0.6 }}>
                    {format(day, 'EEE')}
                  </span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                    {format(day, 'dd')}
                  </span>
                  {isToday && <div style={{ position: 'absolute', bottom: '6px', width: 6, height: 6, borderRadius: '50%', backgroundColor: isSelected ? '#000' : 'var(--accent-color)' }} />}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Habits List */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Daily Habits
            </h3>
          </div>
          
          {loading ? (
            <div className="loading-spinner"></div>
          ) : activities.length === 0 ? (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p>Create your first habit to start building your streak!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Daily Habits List */}
              {activities.filter(a => a.targetDays === 'infinite' || !a.targetDays).length > 0 && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                    {activities.filter(a => a.targetDays === 'infinite' || !a.targetDays).map(activity => {
                      const isCompletedToday = logs.some(log => log.activityId === activity.id);
                      return (
                        <motion.div 
                          key={activity.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          style={{ 
                            padding: '1rem', 
                            display: 'flex', 
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            background: isCompletedToday ? 'rgba(168, 85, 247, 0.1)' : 'rgba(255,255,255,0.03)',
                            borderRadius: '20px',
                            border: isCompletedToday ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                            boxShadow: isCompletedToday ? '0 4px 15px rgba(168, 85, 247, 0.1)' : 'none',
                            transition: 'all 0.3s ease',
                            minHeight: '120px',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                        >
                          <div>
                            <h3 style={{ margin: 0, fontSize: '1rem', color: isCompletedToday ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: '1.2' }}>
                              {activity.name}
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                                <FiTrendingUp /> {activity.currentStreak || 0}
                              </span>
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                            <button 
                              onClick={() => toggleActivityStatus(activity.id)}
                              style={{ 
                                background: isCompletedToday ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)', 
                                border: 'none', 
                                cursor: 'pointer',
                                color: isCompletedToday ? '#fff' : 'var(--text-secondary)',
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.3s ease',
                                boxShadow: isCompletedToday ? '0 2px 12px rgba(168, 85, 247, 0.5)' : 'none'
                              }}
                            >
                              {isCompletedToday ? <FiCheckCircle size={24} /> : <FiCircle size={24} />}
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Active Target Challenges List */}
              {activities.filter(a => typeof a.targetDays === 'number' && (a.currentStreak || 0) < a.targetDays).length > 0 && (
                <div>
                  <h3 style={{ fontSize: '1.25rem', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Active Challenges
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                    {activities.filter(a => typeof a.targetDays === 'number' && (a.currentStreak || 0) < a.targetDays).map(activity => {
                      const isCompletedToday = logs.some(log => log.activityId === activity.id);
                      const accentColor = '#fcd34d'; // lighter gold
                      const accentRgba = '252, 211, 77';

                      return (
                        <motion.div 
                          key={activity.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          style={{ 
                            padding: '1rem', 
                            display: 'flex', 
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            background: isCompletedToday ? `rgba(${accentRgba}, 0.1)` : 'rgba(255,255,255,0.03)',
                            borderRadius: '20px',
                            border: isCompletedToday ? `1px solid rgba(${accentRgba}, 0.3)` : `1px solid rgba(${accentRgba}, 0.2)`,
                            boxShadow: isCompletedToday ? `0 4px 15px rgba(${accentRgba}, 0.1)` : `0 0 15px rgba(${accentRgba}, 0.05)`,
                            transition: 'all 0.3s ease',
                            minHeight: '120px',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                        >
                          <div style={{ position: 'absolute', top: 0, right: 0, background: `linear-gradient(135deg, rgba(${accentRgba}, 0.1), rgba(${accentRgba}, 0.3))`, color: accentColor, fontSize: '0.65rem', padding: '0.3rem 0.75rem', borderBottomLeftRadius: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            ⭐ {activity.targetDays} Day
                          </div>
                          
                          <div>
                            <h3 style={{ margin: 0, fontSize: '1rem', color: isCompletedToday ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: '1.2', paddingRight: '3rem' }}>
                              {activity.name}
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                                <FiTrendingUp /> {activity.currentStreak || 0}
                              </span>
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                            <button 
                              onClick={() => toggleActivityStatus(activity.id)}
                              style={{ 
                                background: isCompletedToday ? accentColor : 'rgba(255,255,255,0.1)', 
                                border: 'none', 
                                cursor: 'pointer',
                                color: isCompletedToday ? '#000' : 'var(--text-secondary)',
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.3s ease',
                                boxShadow: isCompletedToday ? `0 2px 12px rgba(${accentRgba}, 0.5)` : 'none'
                              }}
                            >
                              {isCompletedToday ? <FiCheckCircle size={24} /> : <FiCircle size={24} />}
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Circular Progress moved to bottom */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.3 }} style={{ marginTop: '3rem', marginBottom: '4rem' }}>
          <h3 style={{ textAlign: 'center', color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.25rem' }}>Today's Goal</h3>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {logs.length} out of {activities.filter(a => (a.targetDays === 'infinite' || !a.targetDays) || ((a.currentStreak || 0) < a.targetDays!)).length} activities completed
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem' }}>
            <CircularProgress percentage={dailyPercentage} theme="daily" label="Daily Goals" />
            <CircularProgress percentage={challengePercentage} theme="target" label="Challenges" showFire={false} />
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '1rem', padding: '0 2rem' }}>
            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.9rem', lineHeight: '1.5' }}>
              "Small daily improvements are the key to staggering long-term results."
            </p>
          </div>
        </motion.div>

      </main>

      <NewActivityModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchData} />
      <BottomNav hideAddButton />
    </div>
  );
};

export default Dashboard;
