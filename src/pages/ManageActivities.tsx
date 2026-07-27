import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiTrash2, FiEdit2, FiCheck, FiX, FiLogOut } from 'react-icons/fi';
import { motion } from 'framer-motion';
import CustomNetworkBackground from '../components/CustomNetworkBackground';
import BottomNav from '../components/BottomNav';

interface Activity {
  id: string;
  name: string;
  category: string;
}

const ManageActivities: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [displayNameInput, setDisplayNameInput] = useState(currentUser?.displayName || currentUser?.email?.split('@')[0] || "");
  const [isSavingName, setIsSavingName] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleSaveName = async () => {
    if (!currentUser) return;
    setIsSavingName(true);
    try {
      await updateProfile(currentUser, { displayName: displayNameInput });
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingName(false);
    }
  };
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editTargetDays, setEditTargetDays] = useState<number | null>(null);

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

  const handleDelete = async (activityId: string) => {
    if (!window.confirm("Are you sure you want to delete this activity and all its history?")) return;
    
    try {
      await deleteDoc(doc(db, 'activities', activityId));
      
      const logsQuery = query(collection(db, 'activityLogs'), where('activityId', '==', activityId));
      const logsSnapshot = await getDocs(logsQuery);
      const deletePromises = logsSnapshot.docs.map(logDoc => deleteDoc(doc(db, 'activityLogs', logDoc.id)));
      await Promise.all(deletePromises);
      
      setActivities(prev => prev.filter(a => a.id !== activityId));
    } catch (error) {
      console.error("Error deleting activity:", error);
      alert("Failed to delete activity.");
    }
  };

  const startEditing = (activity: Activity) => {
    setEditingId(activity.id);
    setEditName(activity.name);
    setEditTargetDays(typeof activity.targetDays === 'number' ? activity.targetDays : null);
  };

  const saveEdit = async (activityId: string) => {
    if (!editName.trim()) return;
    try {
      const updateData: any = { name: editName.trim() };
      if (editTargetDays !== null) {
        updateData.targetDays = Number(editTargetDays);
      }
      
      await updateDoc(doc(db, 'activities', activityId), updateData);
      setActivities(prev => prev.map(a => a.id === activityId ? { ...a, ...updateData } : a));
      setEditingId(null);
    } catch (error) {
      console.error("Error updating activity:", error);
      alert("Failed to update activity.");
    }
  };

  const handleLogout = async () => {
    if (!window.confirm("Are you sure you want to log out?")) return;
    try {
      await logout();
      navigate('/login');
    } catch {
      alert("Failed to log out");
    }
  };

  return (
    <div className="page-wrapper" style={{ position: 'relative', zIndex: 1, padding: '0 1rem' }}>
      <CustomNetworkBackground />
      
      <header className="glass-panel desktop-header" style={{ margin: '1rem', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/" className="btn btn-outline" style={{ padding: '0.5rem' }}>
            <FiArrowLeft />
          </Link>
          <h2 style={{ margin: 0, color: 'var(--accent-color)', fontSize: '1.5rem' }}>Manage Activities</h2>
        </div>
      </header>

      <main className="container main-content" style={{ paddingBottom: '2rem' }}>
        <div style={{ marginBottom: '2rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.75rem', color: 'var(--text-primary)' }}>Manage Habits</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Edit or delete your tracking activities.</p>
        </div>

        {loading ? (
          <div className="loading-spinner"></div>
        ) : activities.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
            <h3>No activities found</h3>
            <p>You haven't created any activities yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}>
            
            {/* Daily Habits Section */}
            {activities.filter(a => a.targetDays === 'infinite' || !a.targetDays).length > 0 && (
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: 'var(--text-primary)', opacity: 0.8 }}>Daily Habits</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                  {activities.filter(a => a.targetDays === 'infinite' || !a.targetDays).map((activity, index) => (
                    <motion.div 
                      key={activity.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="glass-panel"
                      style={{ 
                        padding: '1rem', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'space-between',
                        borderRadius: '20px',
                        minHeight: '110px'
                      }}
                    >
                      <div>
                        {editingId === activity.id ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <input 
                              type="text" 
                              value={editName} 
                              onChange={(e) => setEditName(e.target.value)} 
                              style={{ 
                                padding: '0.5rem', 
                                borderRadius: '8px', 
                                border: '1px solid var(--accent-color)', 
                                background: 'rgba(0,0,0,0.5)', 
                                color: 'white',
                                outline: 'none',
                                width: '100%',
                                fontSize: '0.9rem'
                              }} 
                              autoFocus
                            />
                          </div>
                        ) : (
                          <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>{activity.name}</h3>
                        )}
                        {!editingId || editingId !== activity.id ? (
                          <span style={{ display: 'inline-block', margin: '0.25rem 0', padding: '0.15rem 0.4rem', fontSize: '0.65rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: 'var(--accent-color)', fontWeight: 600 }}>
                            {activity.category}
                          </span>
                        ) : null}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        {editingId === activity.id ? (
                          <>
                            <button onClick={() => saveEdit(activity.id)} className="btn btn-primary" style={{ padding: '0.5rem', flex: 1 }}>
                              <FiCheck /> Save
                            </button>
                            <button onClick={() => setEditingId(null)} className="btn btn-outline" style={{ padding: '0.5rem', border: 'none' }}>
                              <FiX />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEditing(activity)} className="btn btn-outline" style={{ padding: '0.5rem', color: 'var(--text-primary)', border: 'none', background: 'rgba(255,255,255,0.05)' }}>
                              <FiEdit2 />
                            </button>
                            <button 
                              onClick={() => handleDelete(activity.id)}
                              className="btn btn-outline"
                              style={{ padding: '0.5rem', color: 'var(--danger)', border: 'none', background: 'rgba(239, 68, 68, 0.1)' }}
                            >
                              <FiTrash2 />
                            </button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Target Challenges Section */}
            {activities.filter(a => typeof a.targetDays === 'number' && (a.currentStreak || 0) < a.targetDays).length > 0 && (
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: 'var(--text-primary)', opacity: 0.8 }}>Active Target Challenges</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                  {activities.filter(a => typeof a.targetDays === 'number' && (a.currentStreak || 0) < a.targetDays).map((activity, index) => (
                    <motion.div 
                      key={activity.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="glass-panel"
                      style={{ 
                        padding: '1rem', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'space-between',
                        borderRadius: '20px',
                        minHeight: '110px',
                        border: '1px solid rgba(251, 191, 36, 0.2)'
                      }}
                    >
                      <div>
                        {editingId === activity.id ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <input 
                              type="text" 
                              value={editName} 
                              onChange={(e) => setEditName(e.target.value)} 
                              style={{ 
                                padding: '0.5rem', 
                                borderRadius: '8px', 
                                border: '1px solid #fbbf24', 
                                background: 'rgba(0,0,0,0.5)', 
                                color: 'white',
                                outline: 'none',
                                width: '100%',
                                fontSize: '0.9rem'
                              }} 
                              autoFocus
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <input 
                                type="number" 
                                value={editTargetDays || 0} 
                                onChange={(e) => setEditTargetDays(Number(e.target.value))} 
                                style={{ 
                                  padding: '0.5rem', 
                                  borderRadius: '8px', 
                                  border: '1px solid #fbbf24', 
                                  background: 'rgba(0,0,0,0.5)', 
                                  color: 'white',
                                  outline: 'none',
                                  width: '60px',
                                  fontSize: '0.9rem'
                                }} 
                              />
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Days</span>
                            </div>
                          </div>
                        ) : (
                          <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>{activity.name}</h3>
                        )}
                        {!editingId || editingId !== activity.id ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', margin: '0.25rem 0' }}>
                            <span style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: 'var(--accent-color)', fontWeight: 600 }}>
                              {activity.category}
                            </span>
                            <span style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem', backgroundColor: 'rgba(251, 191, 36, 0.1)', borderRadius: '8px', color: '#fbbf24', fontWeight: 600 }}>
                              ⭐ {activity.targetDays} Day Goal
                            </span>
                          </div>
                        ) : null}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        {editingId === activity.id ? (
                          <>
                            <button onClick={() => saveEdit(activity.id)} className="btn btn-primary" style={{ padding: '0.5rem', flex: 1, backgroundColor: '#fbbf24', color: '#000' }}>
                              <FiCheck /> Save
                            </button>
                            <button onClick={() => setEditingId(null)} className="btn btn-outline" style={{ padding: '0.5rem', border: 'none' }}>
                              <FiX />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEditing(activity)} className="btn btn-outline" style={{ padding: '0.5rem', color: 'var(--text-primary)', border: 'none', background: 'rgba(255,255,255,0.05)' }}>
                              <FiEdit2 />
                            </button>
                            <button 
                              onClick={() => handleDelete(activity.id)}
                              className="btn btn-outline"
                              style={{ padding: '0.5rem', color: 'var(--danger)', border: 'none', background: 'rgba(239, 68, 68, 0.1)' }}
                            >
                              <FiTrash2 />
                            </button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Target Challenges History Section */}
            {activities.filter(a => typeof a.targetDays === 'number' && (a.currentStreak || 0) >= a.targetDays).length > 0 && (
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiCheck /> Completed Goals
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                  {activities.filter(a => typeof a.targetDays === 'number' && (a.currentStreak || 0) >= a.targetDays).map((activity, index) => (
                    <motion.div 
                      key={activity.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="glass-panel"
                      style={{ 
                        padding: '1rem', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'space-between',
                        borderRadius: '20px',
                        minHeight: '110px',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        background: 'rgba(16, 185, 129, 0.05)'
                      }}
                    >
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.2, opacity: 0.9 }}>{activity.name}</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', margin: '0.25rem 0' }}>
                          <span style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', color: '#10b981', fontWeight: 600 }}>
                            🏆 {activity.targetDays} Days Achieved!
                          </span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <button 
                          onClick={() => handleDelete(activity.id)}
                          className="btn btn-outline"
                          style={{ padding: '0.5rem', color: 'var(--danger)', border: 'none', background: 'rgba(239, 68, 68, 0.1)' }}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: '3rem', marginBottom: '2rem' }}>
           <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Account Settings</h3>
           <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                   <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 'bold', color: 'white', boxShadow: '0 4px 10px rgba(168, 85, 247, 0.4)' }}>
                     {currentUser?.displayName?.[0]?.toUpperCase() || currentUser?.email?.[0]?.toUpperCase() || 'U'}
                   </div>
                   <div style={{ display: 'flex', flexDirection: 'column' }}>
                     <span style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600 }}>{currentUser?.displayName || 'Set Display Name'}</span>
                     <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{currentUser?.email}</span>
                   </div>
                </div>
                <button 
                  onClick={handleLogout} 
                  className="btn btn-outline" 
                  style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: 'var(--danger)', padding: '0.5rem 1rem', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.05)' }}
                >
                  <FiLogOut /> Logout
                </button>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input 
                  type="text"
                  placeholder="Enter your name"
                  value={displayNameInput}
                  onChange={(e) => setDisplayNameInput(e.target.value)}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }}
                />
                <button 
                  onClick={handleSaveName}
                  disabled={isSavingName || !displayNameInput.trim()}
                  className="btn btn-primary"
                  style={{ borderRadius: '12px', padding: '0 1rem' }}
                >
                  {isSavingName ? 'Saving...' : 'Save Name'}
                </button>
              </div>
           </div>
        </div>

        {!loading && activities.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '2rem', opacity: 0.6, paddingBottom: '3rem' }}>
            <p style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>✨</p>
            <p style={{ fontSize: '0.875rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>You are in control of your journey.</p>
          </div>
        )}
      </main>

      <BottomNav hideAddButton />
    </div>
  );
};

export default ManageActivities;
