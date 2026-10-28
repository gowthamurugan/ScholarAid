import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotifications } from '../../context/NotificationContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import {
  GraduationCap,
  Bell,
  User,
  LogOut,
  ShieldCheck,
  Sun,
  Moon,
  Menu,
  X
} from 'lucide-react';

export default function Navbar() {
  const { user, profile, isAdmin, isAuthenticated, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const closeMenu = () => setMobileMenuOpen(false);

  // Logo target depends on session
  const brandTarget = isAuthenticated
    ? isAdmin
      ? '/admin/all-scholarships'
      : '/dashboard'
    : '/login';

  return (
    <>
      {isAdmin && (
        <div className="admin-nav-banner">
          <div className="container">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} /> <strong>ADMINISTRATOR PORTAL</strong> — Verified Administrative Session
            </span>
            <span style={{ opacity: 0.85, fontSize: '0.8rem' }}>
              {profile?.email || user?.email}
            </span>
          </div>
        </div>
      )}

      <header className="navbar">
        <div className="container navbar-inner">
          <Link to={brandTarget} className="brand-link" onClick={closeMenu}>
            <div style={{ background: '#2563eb', color: '#fff', padding: '6px', borderRadius: '8px', display: 'flex' }}>
              <GraduationCap size={24} />
            </div>
            <span>Scholar<span style={{ color: '#2563eb' }}>Aid</span></span>
          </Link>

          {/* Nav Links (Home, Approved, Readiness, Profile removed per user specifications) */}
          <nav>
            <ul className="nav-links">
              {isAuthenticated && !isAdmin && (
                <>
                  <li>
                    <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                      Dashboard
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/eligible" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                      Eligible Scholarships
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/applications" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                      My Applications
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/notifications" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ position: 'relative' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Bell size={16} />
                        Announcements
                      </span>
                      {unreadCount > 0 && (
                        <span style={{
                          position: 'absolute',
                          top: '-4px',
                          right: '-6px',
                          background: '#ef4444',
                          color: '#fff',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          borderRadius: '9999px',
                          padding: '0 5px',
                          lineHeight: '16px'
                        }}>
                          {unreadCount}
                        </span>
                      )}
                    </NavLink>
                  </li>
                </>
              )}

              {isAdmin && (
                <>
                  <li><NavLink to="/admin/all-scholarships" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>All Scholarships</NavLink></li>
                  <li><NavLink to="/admin/approved" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Approved Scholarships</NavLink></li>
                  <li><NavLink to="/admin/monitoring" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Status Monitoring</NavLink></li>
                </>
              )}
            </ul>
          </nav>

          {/* Unified User Action / Signout Bar & Theme Switch */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {isAuthenticated ? (
              <div className="user-action-bar">
                {/* Username Pill */}
                <div className="user-bar-profile" title={profile?.email || user?.email}>
                  <div className="user-bar-avatar">
                    <User size={14} />
                  </div>
                  <span className="user-bar-name">
                    {profile?.fullName || user?.email?.split('@')[0]}
                  </span>
                </div>

                <div className="bar-separator" />

                {/* Day / Dark Mode Toggle Switch */}
                <div
                  className={`theme-toggle-switch ${isDark ? 'is-dark' : 'is-light'}`}
                  onClick={toggleTheme}
                  role="button"
                  tabIndex={0}
                  title={isDark ? "Switch to Day Mode (Turn Off)" : "Switch to Dark Mode (Turn On)"}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleTheme(); }}
                >
                  <div className="theme-toggle-track">
                    <div className="theme-toggle-thumb">
                      {isDark ? <Moon size={12} /> : <Sun size={12} />}
                    </div>
                  </div>
                  <span className="theme-toggle-label">
                    {isDark ? 'Dark (On)' : 'Day (Off)'}
                  </span>
                </div>

                <div className="bar-separator" />

                {/* Sign Out Button in the same bar */}
                <button
                  onClick={handleLogout}
                  className="signout-bar-btn"
                  title="Sign out of ScholarAid"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {/* Theme toggle switch remains in top corner */}
                <div
                  className={`theme-toggle-switch ${isDark ? 'is-dark' : 'is-light'}`}
                  onClick={toggleTheme}
                  role="button"
                  tabIndex={0}
                  title={isDark ? "Switch to Day Mode (Turn Off)" : "Switch to Dark Mode (Turn On)"}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleTheme(); }}
                >
                  <div className="theme-toggle-track">
                    <div className="theme-toggle-thumb">
                      {isDark ? <Moon size={12} /> : <Sun size={12} />}
                    </div>
                  </div>
                  <span className="theme-toggle-label">
                    {isDark ? 'Dark (On)' : 'Day (Off)'}
                  </span>
                </div>
              </div>
            )}

            {/* Mobile Hamburger toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'none' }}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
