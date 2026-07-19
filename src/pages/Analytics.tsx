import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiPieChart, FiBarChart2, FiStar, FiTrendingUp } from 'react-icons/fi';
import { format, subDays } from 'date-fns';
import CustomNetworkBackground from '../components/CustomNetworkBackground';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Analytics: React.FC = () => {
  const { currentUser } = useAuth();
  const [pieData, setPieData] = useState<any[]>([]);
  const [barData, setBarData] = useState<any[]>([]);
  const [topHabits, setTopHabits] = useState<any[]>([]);
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
        
        // Calculate Top Habits by Streak
        const sortedHabits = [...activities].sort((a: any, b: any) => (b.currentStreak || 0) - (a.currentStreak || 0)).slice(0, 3);
        setTopHabits(sortedHabits);

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
          return {
            date: format(new Date(date), 'MMM dd'),
            completed: logsSnapshot.size
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
      
      <header className="glass-panel" style={{ margin: '1rem', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/" className="btn btn-outline" style={{ padding: '0.5rem' }}>
            <FiArrowLeft />
          </Link>
          <h2 style={{ margin: 0, color: 'var(--accent-color)' }}>Analytics</h2>
        </div>
      </header>

      <main className="container main-content">
        {loading ? (
          <div className="loading-spinner"></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Top Habits Section */}
            {topHabits.length > 0 && (
              <motion.div className="glass-panel" style={{ padding: '2rem' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}><FiStar color="var(--warning)" /> Top Habits</h3>
                <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                  {topHabits.map((habit, index) => (
                    <motion.div 
                      key={index} 
                      whileHover={{ y: -5, scale: 1.02 }}
                      style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{habit.name}</h4>
                      <p style={{ margin: '0.5rem 0 0 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)', fontWeight: 'bold' }}>
                        <FiTrendingUp /> {habit.currentStreak || 0} day streak
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

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
                          <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0}/>
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
    </div>
  );
};

export default Analytics;
