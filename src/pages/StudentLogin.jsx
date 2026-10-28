import React, { useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { isFirebaseConfigured } from '../services/firebase.js';
import { GraduationCap, ShieldCheck, LogIn, AlertCircle, X, UserPlus, CheckCircle2 } from 'lucide-react';

export default function StudentLogin({ defaultRole = 'student' }) {
  const { loginStudent, loginAdmin, registerAdmin, loginWithGoogle, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const urlRole = searchParams.get('role');
  const [activeTab, setActiveTab] = useState(urlRole === 'admin' || defaultRole === 'admin' ? 'admin' : 'student');
  const [adminMode, setAdminMode] = useState('login'); // 'login' | 'register'

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminKey, setAdminKey] = useState('');

  // Admin registration form state
  const [adminRegName, setAdminRegName] = useState('');
  const [adminRegEmail, setAdminRegEmail] = useState('');
  const [adminRegDept, setAdminRegDept] = useState('');
  const [adminRegPassword, setAdminRegPassword] = useState('');
  const [adminRegConfirm, setAdminRegConfirm] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Google ID Modal (for custom Google email input)
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');

  // Redirect if already authenticated
  if (isAuthenticated) {
    const target = isAdmin
      ? '/admin/all-scholarships'
      : (location.state?.from?.pathname || '/dashboard');
    return <Navigate to={target} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide your email address and password.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      if (activeTab === 'admin') {
        await loginAdmin(email, password, adminKey);
        navigate('/admin/all-scholarships', { replace: true });
      } else {
        await loginStudent(email, password);
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!adminRegName || !adminRegEmail || !adminRegPassword) {
      setError('Please fill in all required administrator fields.');
      return;
    }

    if (adminRegPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (adminRegPassword !== adminRegConfirm) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      await registerAdmin(adminRegEmail, adminRegPassword, {
        fullName: adminRegName,
        department: adminRegDept || 'Scholarship Administration'
      });
      setSuccessMsg('Admin ID registered successfully! Redirecting...');
      setTimeout(() => {
        navigate('/admin/all-scholarships', { replace: true });
      }, 500);
    } catch (err) {
      setError(err.message || 'Failed to create Administrator ID.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = async () => {
    setError('');
    if (isFirebaseConfigured) {
      setLoading(true);
      try {
        await loginWithGoogle(activeTab);
        if (activeTab === 'admin') {
          navigate('/admin/all-scholarships', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } catch (err) {
        setError(err.message || 'Google authentication failed.');
      } finally {
        setLoading(false);
      }
    } else {
      setShowGoogleModal(true);
    }
  };

  const handleCustomGoogleSubmit = async (e) => {
    e.preventDefault();
    if (!customGoogleEmail) return;

    setShowGoogleModal(false);
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle(activeTab, {
        email: customGoogleEmail.trim(),
        name: customGoogleName.trim() || customGoogleEmail.split('@')[0]
      });
      if (activeTab === 'admin') {
        navigate('/admin/all-scholarships', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Google ID sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 140px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2.5rem 1rem'
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '460px',
        padding: '2.25rem 2rem',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header Icon & Title */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            display: 'inline-flex',
            background: activeTab === 'admin' ? '#1e1b4b' : 'var(--primary-light)',
            color: activeTab === 'admin' ? '#e0e7ff' : 'var(--primary)',
            padding: '12px',
            borderRadius: '14px',
            marginBottom: '0.75rem',
            transition: 'all 0.2s ease'
          }}>
            {activeTab === 'admin' ? <ShieldCheck size={32} /> : <GraduationCap size={32} />}
          </div>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--neutral-900)', fontWeight: 800 }}>
            {activeTab === 'admin'
              ? (adminMode === 'register' ? 'Register Admin ID' : 'Administrator Login')
              : 'Student Login'}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--neutral-600)', marginTop: '4px' }}>
            {activeTab === 'admin'
              ? (adminMode === 'register'
                  ? 'Create an authorized administrator account for institutional scholarship management.'
                  : 'Access verified institutional records, approval workflows, and status tracking.')
              : 'Discover official scholarships, verify your eligibility, and register directly.'}
          </p>
        </div>

        {/* Centered Role Switcher (Student Login / Admin Login) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px',
          background: 'var(--neutral-100)',
          padding: '4px',
          borderRadius: '10px',
          marginBottom: '1.5rem'
        }}>
          <button
            type="button"
            onClick={() => { setActiveTab('student'); setError(''); setSuccessMsg(''); }}
            style={{
              padding: '0.6rem 0.5rem',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === 'student' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'student' ? '#ffffff' : 'var(--neutral-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <GraduationCap size={16} /> Student Login
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('admin'); setError(''); setSuccessMsg(''); }}
            style={{
              padding: '0.6rem 0.5rem',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === 'admin' ? '#1e1b4b' : 'transparent',
              color: activeTab === 'admin' ? '#ffffff' : 'var(--neutral-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <ShieldCheck size={16} /> Admin Portal
          </button>
        </div>

        {/* Admin Login vs Admin Register Switcher */}
        {activeTab === 'admin' && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '1.25rem',
            borderBottom: '1px solid var(--neutral-200)',
            paddingBottom: '0.5rem'
          }}>
            <button
              type="button"
              onClick={() => { setAdminMode('login'); setError(''); }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: adminMode === 'login' ? 700 : 500,
                color: adminMode === 'login' ? 'var(--primary)' : 'var(--neutral-500)',
                borderBottom: adminMode === 'login' ? '2px solid var(--primary)' : 'none',
                paddingBottom: '4px',
                fontSize: '0.875rem'
              }}
            >
              Sign In to Admin ID
            </button>
            <button
              type="button"
              onClick={() => { setAdminMode('register'); setError(''); }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: adminMode === 'register' ? 700 : 500,
                color: adminMode === 'register' ? 'var(--primary)' : 'var(--neutral-500)',
                borderBottom: adminMode === 'register' ? '2px solid var(--primary)' : 'none',
                paddingBottom: '4px',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <UserPlus size={14} /> Create Admin ID
            </button>
          </div>
        )}

        {error && (
          <div style={{
            background: 'var(--danger-light)',
            border: '1px solid var(--danger-border)',
            color: 'var(--danger)',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'var(--success-light)',
            border: '1px solid var(--success-border)',
            color: 'var(--success)',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Regular Login Form (Student OR Admin Login) */}
        {(activeTab === 'student' || adminMode === 'login') ? (
          <>
            {/* Google ID Login Button */}
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={loading}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '0.7rem 1rem',
                fontWeight: 600,
                fontSize: '0.925rem',
                background: 'var(--surface)',
                color: 'var(--neutral-800)',
                border: '1px solid var(--neutral-300)',
                borderRadius: '8px',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.08)',
                marginBottom: '1.25rem',
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
              </svg>
              <span>Continue with Google ID</span>
            </button>

            {/* Divider */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '1.25rem',
              fontSize: '0.8rem',
              color: 'var(--neutral-400)'
            }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--neutral-200)' }} />
              <span>or sign in with credentials</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--neutral-200)' }} />
            </div>

            {/* Email & Password Form */}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label form-label-required">
                  {activeTab === 'admin' ? 'Administrator Email ID' : 'Student Email Address'}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="form-input"
                  placeholder={activeTab === 'admin' ? 'admin@institution.edu' : 'student@college.edu'}
                />
              </div>

              <div className="form-group">
                <label className="form-label form-label-required">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-block btn-primary"
                style={{
                  marginTop: '0.5rem',
                  background: activeTab === 'admin' ? '#1e1b4b' : 'var(--primary)',
                  borderColor: activeTab === 'admin' ? '#1e1b4b' : 'var(--primary)'
                }}
              >
                {loading ? 'Authenticating...' : (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <LogIn size={16} /> {activeTab === 'admin' ? 'Sign In to Admin Portal' : 'Sign In as Student'}
                  </span>
                )}
              </button>
            </form>
          </>
        ) : (
          /* Create / Register Admin ID Form */
          <form onSubmit={handleAdminRegister}>
            <div className="form-group">
              <label className="form-label form-label-required">Administrator Full Name</label>
              <input
                type="text"
                required
                value={adminRegName}
                onChange={e => setAdminRegName(e.target.value)}
                className="form-input"
                placeholder="e.g. Dr. Ramesh Kumar"
              />
            </div>

            <div className="form-group">
              <label className="form-label form-label-required">Admin Email Address</label>
              <input
                type="email"
                required
                value={adminRegEmail}
                onChange={e => setAdminRegEmail(e.target.value)}
                className="form-input"
                placeholder="e.g. admin.scholarship@college.edu"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Department / Office</label>
              <input
                type="text"
                value={adminRegDept}
                onChange={e => setAdminRegDept(e.target.value)}
                className="form-input"
                placeholder="e.g. Scholarship Cell, Dean Office"
              />
            </div>

            <div className="form-group">
              <label className="form-label form-label-required">Password (min 6 characters)</label>
              <input
                type="password"
                required
                value={adminRegPassword}
                onChange={e => setAdminRegPassword(e.target.value)}
                className="form-input"
                placeholder="••••••••"
              />
            </div>

            <div className="form-group">
              <label className="form-label form-label-required">Confirm Password</label>
              <input
                type="password"
                required
                value={adminRegConfirm}
                onChange={e => setAdminRegConfirm(e.target.value)}
                className="form-input"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-block btn-primary"
              style={{
                marginTop: '0.75rem',
                background: '#1e1b4b',
                borderColor: '#1e1b4b'
              }}
            >
              {loading ? 'Creating Admin ID...' : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <UserPlus size={16} /> Create Admin ID & Sign In
                </span>
              )}
            </button>
          </form>
        )}

        {/* Bottom Navigation */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
          {activeTab === 'student' ? (
            <span>
              Don't have a student account?{' '}
              <Link to="/register" style={{ fontWeight: 600, color: 'var(--primary)' }}>
                Create Profile
              </Link>
            </span>
          ) : (
            adminMode === 'login' ? (
              <span>
                New institutional administrator?{' '}
                <button
                  type="button"
                  onClick={() => setAdminMode('register')}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  Create Admin ID
                </button>
              </span>
            ) : (
              <span>
                Already have an Admin ID?{' '}
                <button
                  type="button"
                  onClick={() => setAdminMode('login')}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  Sign In
                </button>
              </span>
            )
          )}
        </div>
      </div>

      {/* Google ID Email Input Modal (Zero Demo Accounts) */}
      {showGoogleModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '420px', width: '100%', padding: '1.75rem', borderRadius: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="20" height="20" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
                </svg>
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Sign In with Google ID</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '4px' }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--neutral-600)', marginBottom: '1.25rem' }}>
              Enter your Google Account email to authenticate as a {activeTab === 'admin' ? 'Scholarship Administrator' : 'Student'}:
            </p>

            <form onSubmit={handleCustomGoogleSubmit}>
              <div className="form-group">
                <label className="form-label form-label-required">Google Email ID</label>
                <input
                  type="email"
                  required
                  placeholder="yourname@gmail.com"
                  value={customGoogleEmail}
                  onChange={e => setCustomGoogleEmail(e.target.value)}
                  className="form-input"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  placeholder="Your Full Name"
                  value={customGoogleName}
                  onChange={e => setCustomGoogleName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!customGoogleEmail}
                  className="btn btn-primary btn-sm"
                >
                  Continue with Google ID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
