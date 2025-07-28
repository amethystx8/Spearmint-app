import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/kanban', icon: '📋', label: 'Kanban' },
    { path: '/pomodoro', icon: '🍅', label: 'Pomodoro' },
    { path: '/settings', icon: '⚙️', label: 'Settings' }
  ];

  const handleLogout = () => {
    localStorage.removeItem('username');
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>🌿 Spearmint</h2>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            {item.icon} {item.label}
          </Link>
        ))}
        <button 
          onClick={handleLogout}
          className="nav-item logout-btn"
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'inherit', 
            cursor: 'pointer',
            width: '100%',
            textAlign: 'left',
            padding: '10px 15px',
            marginTop: '20px',
            borderTop: '1px solid #ddd'
          }}
        >
          🚪 Logout
        </button>
      </nav>
    </div>
  );
}
