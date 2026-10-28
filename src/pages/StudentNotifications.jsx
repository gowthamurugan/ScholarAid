import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import { getAnnouncements } from '../services/announcementService.js';
import LoadingState from '../components/common/LoadingState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { formatDate } from '../utils/validators.js';
import {
  Bell,
  CheckCircle2,
  Calendar,
  ExternalLink,
  Info,
  Clock,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export default function StudentNotifications() {
  const { user } = useAuth();
  const { notifications, markAsRead, refreshNotifications } = useNotifications();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const anns = await getAnnouncements();
        if (isMounted) setAnnouncements(anns);
      } catch (err) {
        console.error('Failed to load announcements:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, []);

  if (loading) return <LoadingState message="Loading announcements and notifications..." />;

  return (
    <div className="container main-content" style={{ maxWidth: '860px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#2563eb', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem' }}>
          <Bell size={18} /> TARGETED COMMUNICATIONS
        </div>
        <h1 style={{ fontSize: '1.85rem', color: '#0f172a' }}>Announcements & Deadline Alerts</h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
          Official updates and deadline alerts distributed by administrators for scholarships matching your academic eligibility.
        </p>
      </div>

      {/* Personal Notifications Stream */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', color: '#1e293b', marginBottom: '1rem' }}>
          Your Direct Scholarship Notifications
        </h2>

        {notifications.length === 0 ? (
          <div className="card" style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>
            <p>You have no direct scholarship notifications at this time.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {notifications.map(notif => (
              <div
                key={notif.id}
                className="card"
                style={{
                  padding: '1.25rem',
                  borderLeft: notif.read ? '1px solid var(--neutral-200)' : '4px solid var(--primary)',
                  background: notif.read ? 'var(--surface)' : 'var(--neutral-100)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                        {notif.scholarshipName || 'Scholarship Alert'}
                      </span>
                      {!notif.read && (
                        <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                          Unread
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '1rem', color: '#0f172a', marginBottom: '4px' }}>
                      {notif.title}
                    </h3>

                    <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '8px' }}>
                      {notif.message}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                      <span><Clock size={12} /> {formatDate(notif.createdAt)}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                    {!notif.read && (
                      <button
                        onClick={() => markAsRead(notif.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem' }}
                      >
                        <CheckCircle2 size={13} /> Mark Read
                      </button>
                    )}

                    {notif.scholarshipId && (
                      <Link
                        to={`/scholarships/${notif.scholarshipId}`}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.75rem' }}
                      >
                        View Scholarship <ArrowRight size={12} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Public Institution Announcements */}
      <div>
        <h2 style={{ fontSize: '1.25rem', color: '#1e293b', marginBottom: '1rem' }}>
          All Published Announcements
        </h2>

        {announcements.length === 0 ? (
          <EmptyState
            title="No Published Announcements"
            description="The administrative team has not issued any public scholarship announcements."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {announcements.map(ann => (
              <div key={ann.id} className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <h3 style={{ fontSize: '1.05rem', color: '#0f172a' }}>{ann.title}</h3>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{formatDate(ann.createdAt)}</span>
                </div>

                <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1rem' }}>
                  {ann.message}
                </p>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8rem',
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: '0.75rem',
                  color: '#64748b'
                }}>
                  <span>Issued by: <strong>{ann.createdBy || 'Administrator'}</strong></span>
                  <Link to={`/scholarships/${ann.scholarshipId}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    {ann.scholarshipName} <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
