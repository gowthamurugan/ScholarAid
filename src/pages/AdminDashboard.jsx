import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AdminNav from '../components/admin/AdminNav.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import {
  getAllScholarshipsForAdmin,
  getPendingScholarships
} from '../services/scholarshipService.js';
import { getAllStudentsForAdmin } from '../services/profileService.js';
import { getAllApplicationsForMonitoring } from '../services/applicationService.js';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Sparkles,
  Bell,
  Activity,
  ArrowRight
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    totalStudents: 0,
    totalApps: 0
  });

  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      try {
        const [allScholarships, students, appsData] = await Promise.all([
          getAllScholarshipsForAdmin(),
          getAllStudentsForAdmin(),
          getAllApplicationsForMonitoring()
        ]);

        if (isMounted) {
          setStats({
            pending: allScholarships.filter(s => s.status === 'Pending').length,
            approved: allScholarships.filter(s => s.status === 'Approved').length,
            rejected: allScholarships.filter(s => s.status === 'Rejected').length,
            totalStudents: students.length,
            totalApps: appsData.summary.total
          });
        }
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadStats();
    return () => { isMounted = false; };
  }, []);

  if (loading) return <LoadingState message="Loading administrator metrics and queues..." />;

  return (
    <div className="container main-content">
      <AdminNav />

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', color: '#0f172a' }}>Administrator Command Dashboard</h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
          Overview of pending discovery candidates, active scholarship directory, and student metrics.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="stats-grid">
        <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="stat-value" style={{ color: '#d97706' }}>{stats.pending}</div>
          <div className="stat-label">Pending Review</div>
          <Link to="/admin/pending" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '2px', marginTop: '0.5rem', color: '#d97706' }}>
            Open Review Queue <ArrowRight size={12} />
          </Link>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #16a34a' }}>
          <div className="stat-value" style={{ color: '#16a34a' }}>{stats.approved}</div>
          <div className="stat-label">Approved Scholarships</div>
          <Link to="/admin/management" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '2px', marginTop: '0.5rem', color: '#16a34a' }}>
            Manage Directory <ArrowRight size={12} />
          </Link>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #dc2626' }}>
          <div className="stat-value" style={{ color: '#dc2626' }}>{stats.rejected}</div>
          <div className="stat-label">Rejected Candidates</div>
          <Link to="/admin/management" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '2px', marginTop: '0.5rem', color: '#dc2626' }}>
            View Rejected <ArrowRight size={12} />
          </Link>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #2563eb' }}>
          <div className="stat-value" style={{ color: '#2563eb' }}>{stats.totalStudents}</div>
          <div className="stat-label">Registered Students</div>
          <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginTop: '0.5rem' }}>
            Used for Eligibility Impact
          </span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #7c3aed' }}>
          <div className="stat-value" style={{ color: '#7c3aed' }}>{stats.totalApps}</div>
          <div className="stat-label">Tracked Applications</div>
          <Link to="/admin/monitoring" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '2px', marginTop: '0.5rem', color: '#7c3aed' }}>
            Open Monitoring <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* Workflow Quick Launch Section */}
      <div style={{ marginTop: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', color: '#1e293b', marginBottom: '1rem' }}>
          Administrative Workflows
        </h2>

        <div className="grid-cards">
          <Link to="/admin/discovery" className="card" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem' }}>
              <div style={{ background: '#f5f3ff', color: '#7c3aed', padding: '10px', borderRadius: '8px' }}>
                <Sparkles size={22} />
              </div>
              <h3 style={{ fontSize: '1.1rem', color: '#0f172a' }}>AI Scholarship Discovery</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
              Execute search queries across scholarship domains with Gemini structuring into candidate records.
            </p>
            <span style={{ fontSize: '0.85rem', color: '#7c3aed', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              Start AI Discovery <ArrowRight size={14} />
            </span>
          </Link>

          <Link to="/admin/pending" className="card" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem' }}>
              <div style={{ background: '#fffbeb', color: '#d97706', padding: '10px', borderRadius: '8px' }}>
                <Clock size={22} />
              </div>
              <h3 style={{ fontSize: '1.1rem', color: '#0f172a' }}>Pending Review Queue ({stats.pending})</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
              Review candidate records, inspect student eligibility impact counts, edit criteria, approve, or reject.
            </p>
            <span style={{ fontSize: '0.85rem', color: '#d97706', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              Review Candidates <ArrowRight size={14} />
            </span>
          </Link>

          <Link to="/admin/announcements" className="card" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem' }}>
              <div style={{ background: '#eff6ff', color: '#2563eb', padding: '10px', borderRadius: '8px' }}>
                <Bell size={22} />
              </div>
              <h3 style={{ fontSize: '1.1rem', color: '#0f172a' }}>Targeted Announcements</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
              Broadcast deadline reminders and announcements targeted strictly to students satisfying eligibility rules.
            </p>
            <span style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              Publish Announcement <ArrowRight size={14} />
            </span>
          </Link>

          <Link to="/admin/monitoring" className="card" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem' }}>
              <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '10px', borderRadius: '8px' }}>
                <Activity size={22} />
              </div>
              <h3 style={{ fontSize: '1.1rem', color: '#0f172a' }}>Application Status Monitoring</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
              Monitor self-reported student application statistics and logs in an isolated administrative view.
            </p>
            <span style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              Open Status Monitor <ArrowRight size={14} />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
