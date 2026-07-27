import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiPieChart, FiSettings, FiPlus } from 'react-icons/fi';
import { motion } from 'framer-motion';

interface BottomNavProps {
  onAddClick?: () => void;
  hideAddButton?: boolean;
}

const BottomNav: React.FC<BottomNavProps> = ({ onAddClick, hideAddButton }) => {
  const location = useLocation();

  const navItems = [
    { icon: <FiHome size={24} />, path: '/', label: 'Home' },
    { icon: <FiPieChart size={24} />, path: '/analytics', label: 'Stats' },
    { icon: <FiSettings size={24} />, path: '/manage', label: 'Manage' },
  ];

  return (
    <div className="mobile-bottom-nav">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link 
            key={item.path}
            to={item.path} 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)',
              textDecoration: 'none',
              flex: 1
            }}
          >
            <motion.div whileTap={{ scale: 0.9 }}>
              {item.icon}
            </motion.div>
            <span style={{ fontSize: '0.7rem', marginTop: '4px', fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
          </Link>
        );
      })}

      {!hideAddButton && onAddClick && (
        <motion.button 
          className="fab-button"
          whileTap={{ scale: 0.9 }}
          onClick={onAddClick}
        >
          <FiPlus size={32} />
        </motion.button>
      )}
    </div>
  );
};

export default BottomNav;
