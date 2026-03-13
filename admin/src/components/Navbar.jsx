import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ setIsSignedIn }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    setIsSignedIn(false);
    navigate('/signin');
  };

  return (
    <nav className="admin-navbar">
      <div className="admin-navbar-content">
        <div className="admin-navbar-brand">
          <div className="admin-navbar-logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 12 15 16 10"/></svg>
          </div>
          <span className="admin-navbar-title">Lok Samadhan</span>
          <span className="admin-navbar-badge">Admin</span>
        </div>
        <div className="admin-navbar-actions">
          <button onClick={handleLogout} className="admin-logout-button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;