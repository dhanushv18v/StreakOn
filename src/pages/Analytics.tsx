import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPieChart, FiBarChart2, FiStar, FiTrendingUp, FiCheck } from 'react-icons/fi';
import { format, subDays } from 'date-fns';
import CustomNetworkBackground from '../components/CustomNetworkBackground';
import BottomNav from '../components/BottomNav';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Analytics: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [pieData, setPieData] = useState<any[]>([]);
  const [barData, setBarData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!currentUser) return;
      setLoading(true);
      
      try {
        // Fetch Activities
        const qActivities = query(collection(db, 'activities'), where('userId', '==', currentUser.uid));
        const activitiesSnapshot = await getDocs(qActivities);
        const activities = activitiesSnapshot.docs.map(d => d.data());

        // Calculate Category Distribution
        const categoryCount: Record<string, number> = {};
        activities.forEach(act => {
          categoryCount[act.category] = (categoryCount[act.category] || 0) + 1;
        });
        
        const pData = Object.keys(categoryCount).map(key => ({
          name: key,
          value: categoryCount[key]
        }));
        setPieData(pData);

        // Fetch Logs for Bar Chart (Last 7 Days)
        const past7Days = Array.from({length: 7}, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd')).reverse();
        
        const bDataPromises = past7Days.map(async (date) => {
          const qLogs = query(collection(db, 'activityLogs'), where('userId', '==', currentUser.uid), where('date', '==', date));
          const logsSnapshot = await getDocs(qLogs);
          const totalActivities = activities.length > 0 ? activities.length : 1;
          const percentage = Math.round((logsSnapshot.size / totalActivities) * 100);
          
          return {
            date: format(new Date(date), 'MMM dd'),
            dayName: format(new Date(date), 'EEE'),
            completed: logsSnapshot.size,
            percentage: percentage > 100 ? 100 : percentage
          };
        });
        
        const bData = await Promise.all(bDataPromises);
        setBarData(bData);

      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [currentUser]);

  return (
    <div className="page-wrapper" style={{ position: 'relative', zIndex: 1, padding: '0 1rem' }}>
      <CustomNetworkBackground />
      
      <header className="glass-panel desktop-header" style={{ margin: '1rem', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/" className="btn btn-outline" style={{ padding: '0.5rem' }}>
            <FiArrowLeft />
          </Link>
          <h2 style={{ margin: 0, color: 'var(--accent-color)' }}>Analytics</h2>
        </div>
      </header>

      <main className="container main-content" style={{ paddingBottom: '2rem' }}>
        {loading ? (
          <div className="loading-spinner"></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Consistency Tracker */}
            <motion.div className="glass-panel" style={{ padding: '1.5rem 1rem' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '1.25rem', margin: '0 0 0.5rem 0' }}>
                <FiStar color="var(--accent-color)" /> Consistency
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>Your app usage over the last 7 days</p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '180px', marginTop: '1rem', paddingBottom: '0.5rem' }}>
                {barData.map((day, idx) => {
                  return (
                    <div key={idx} style={{ 
                      width: '44px', 
                      height: '160px', 
                      backgroundColor: 'rgba(255,255,255,0.03)', 
                      borderRadius: '30px',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      border: '1px solid rgba(255,255,255,0.05)',
                      overflow: 'hidden'
                    }}>
                      
                      {/* Fill Indicator (Starts from very bottom, covers the day circle) */}
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${day.percentage}%` }}
                        transition={{ duration: 1, delay: idx * 0.1, type: 'spring', bounce: 0.2 }}
                        style={{ 
                          width: '100%', 
                          background: 'linear-gradient(to top, #a855f7, #f472b6)',
                          borderTopLeftRadius: '30px',
                          borderTopRightRadius: '30px',
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'flex-start',
                          paddingTop: '6px',
                          minHeight: day.percentage > 0 ? '55px' : '0px',
                          zIndex: 1
                        }}
                      >
                        {day.percentage > 0 && (
                          <span style={{ color: '#fff', fontWeight: 900, fontSize: '0.65rem', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                            {day.percentage}%
                          </span>
                        )}
                      </motion.div>
                      
                      {/* Always show 0% above the day circle if nothing is completed */}
                      {day.percentage === 0 && (
                        <div style={{ position: 'absolute', bottom: '45px', width: '100%', textAlign: 'center', zIndex: 1 }}>
                          <span style={{ color: 'var(--text-secondary)', fontWeight: 800, fontSize: '0.6rem' }}>0%</span>
                        </div>
                      )}

                      {/* Day Name Circle at bottom (Sits inside the pill, on top of the fill) */}
                      <div style={{
                        width: '34px',
                        height: '34px',
                        backgroundColor: 'var(--bg-primary)',
                        borderRadius: '50%',
                        position: 'absolute',
                        bottom: '5px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid rgba(168, 85, 247, 0.5)',
                        zIndex: 2,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
                      }}>
                         <span style={{ fontSize: '0.55rem', color: '#fff', fontWeight: 'bold' }}>{day.dayName}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Charts Section */}
            <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              <motion.div className="glass-panel" style={{ padding: '2rem' }} whileHover={{ y: -5 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FiPieChart color="var(--accent-color)" /> Activity Distribution</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>By Category</p>
                <div style={{ width: '100%', height: 300 }}>
                  {pieData.length > 0 ? (
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                          {pieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: 'none', borderRadius: '8px' }} />
                        <Legend 
                          content={(props) => {
                            const { payload } = props;
                            return (
                              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                                {payload?.map((entry, index) => (
                                  <div key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.75rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: entry.color, boxShadow: `0 0 8px ${entry.color}` }} />
                                    <span style={{ color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 500 }}>{entry.value}</span>
                                  </div>
                                ))}
                              </div>
                            );
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)' }}>No data available</div>
                  )}
                </div>
              </motion.div>

              <motion.div className="glass-panel" style={{ padding: '2rem' }} whileHover={{ y: -5 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FiBarChart2 color="var(--success)" /> Completion Trend</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Last 7 Days</p>
                <div style={{ width: '100%', height: 300, marginTop: '1rem' }}>
                  <ResponsiveContainer>
                    <AreaChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="date" stroke="var(--text-secondary)" axisLine={false} tickLine={false} dy={10} fontSize={12} />
                      <YAxis stroke="var(--text-secondary)" allowDecimals={false} axisLine={false} tickLine={false} fontSize={12} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                        itemStyle={{ color: 'var(--accent-color)', fontWeight: 'bold' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="completed" 
                        stroke="var(--accent-color)" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorCompleted)" 
                        activeDot={{ r: 6, fill: 'var(--accent-color)', stroke: 'var(--text-primary)', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

          </div>
        )}
      </main>
      
      <BottomNav hideAddButton />
    </div>
  );
};

export default Analytics;
