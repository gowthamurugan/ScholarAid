import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  GraduationCap,
  Award,
  CheckCircle2,
  FileCheck2,
  Clock,
  Bell,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { getApprovedScholarships } from '../services/scholarshipService.js';
import { getStudentApplications } from '../services/applicationService.js';
import { getAnnouncements } from '../services/announcementService.js';
import { evaluateEligibility, matchesTargetType } from '../utils/eligibilityEngine.js';
import LoadingState from '../components/common/LoadingState.jsx';
import ScholarshipCard from '../components/student/ScholarshipCard.jsx';
import StatusTrackerModal from '../components/student/StatusTrackerModal.jsx';
import { formatDate } from '../utils/validators.js';

export default function StudentDashboard() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [scholarships, setScholarships] = useState([]);
  const [applications, setApplications] = useState({});
  const [announcements, setAnnouncements] = useState([]);
  const [selectedScholarshipForModal, setSelectedScholarshipForModal] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadDashboard() {
      try {
        const [approved, apps, anns] = await Promise.all([
          getApprovedScholarships(profile),
          getStudentApplications(user?.uid),
          getAnnouncements()
        ]);

        if (isMounted) {
          setScholarships(approved);
          setApplications(apps);
          setAnnouncements(anns);
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboard();
    return () => { isMounted = false; };
  }, [user?.uid, profile]);

  if (loading) {
    return <LoadingState message="Loading your student scholarship dashboard..." />;
  }

  // Filter approved scholarships visible to this student based on admin targeting
  const visibleScholarships = scholarships.filter(s => {
    if (profile && profile.role === 'student') {
      const targets = s.targetedStudentTypes;
      if (targets && targets.length > 0 && !targets.includes('All') && !targets.includes('All Students')) {
        return matchesTargetType(profile, targets);
      }
    }
    return true;
  });

  // Calculate student eligibility using Centralized Eligibility Engine
  const evaluatedScholarships = visibleScholarships.map(s => ({
    scholarship: s,
    eligibility: evaluateEligibility(profile, s)
  }));

  const eligibleList = evaluatedScholarships.filter(item => item.eligibility.eligible);
  const pendingAppsCount = Object.keys(applications).length;

  return (
    <div className="container main-content">
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
        color: '#ffffff',
        borderRadius: '12px',
        padding: '2rem',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              <GraduationCap size={14} /> Student Portal Active
            </div>
            <h1 style={{ color: '#ffffff', fontSize: '1.75rem', marginBottom: '0.25rem' }}>
              Welcome back, {profile?.fullName || user?.email?.split('@')[0]}
            </h1>
            <p style={{ color: '#bfdbfe', fontSize: '0.9rem' }}>
              Course: <strong>{profile?.course || 'Not set'}</strong> • Category: <strong>{profile?.category || 'General'}</strong> • GPA: <strong>{profile?.gpa || 'Not set'}</strong>
            </p>
          </div>

          <Link to="/profile" className="btn btn-secondary btn-sm" style={{ background: 'var(--surface)', color: 'var(--primary)', fontWeight: 700 }}>
            Update Profile
          </Link>
        </div>
      </div>

      {/* Profile Incomplete Banner if missing fields */}
      {(!profile?.gpa || !profile?.familyIncome || !profile?.course) && (
        <div className="disclaimer-alert" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={20} />
            <span>
              <strong>Profile Incomplete:</strong> Add your GPA, family income, and certificate details to unlock automatic eligibility calculation across all scholarships.
            </span>
          </div>
          <Link to="/profile" className="btn btn-primary btn-sm">Complete Profile</Link>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#2563eb' }}>{scholarships.length}</div>
          <div className="stat-label">Available Scholarships</div>
          <Link to="/eligible" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '2px', marginTop: '0.5rem' }}>
            Check qualifications <ChevronRight size={12} />
          </Link>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: '#16a34a' }}>{eligibleList.length}</div>
          <div className="stat-label">You Qualify For</div>
          <Link to="/eligible" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '2px', marginTop: '0.5rem', color: '#16a34a' }}>
            View eligible only <ChevronRight size={12} />
          </Link>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: '#d97706' }}>{pendingAppsCount}</div>
          <div className="stat-label">Tracked Applications</div>
          <Link to="/applications" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '2px', marginTop: '0.5rem', color: '#d97706' }}>
            Check status <ChevronRight size={12} />
          </Link>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: '#7c3aed' }}>{announcements.length}</div>
          <div className="stat-label">Announcements</div>
          <Link to="/notifications" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '2px', marginTop: '0.5rem', color: '#7c3aed' }}>
            View notifications <ChevronRight size={12} />
          </Link>
        </div>
      </div>

      {/* Section: Scholarships You Qualify For */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', color: '#0f172a' }}>Scholarships You Qualify For</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Determined by our Centralized Eligibility Engine using your saved profile.
            </p>
          </div>
          <Link to="/eligible" className="btn btn-secondary btn-sm">
            View All ({eligibleList.length}) <ArrowRight size={14} />
          </Link>
        </div>

        {eligibleList.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ color: '#64748b', marginBottom: '1rem' }}>
              You do not currently meet the eligibility rules for any approved scholarships, or your profile is missing key criteria.
            </p>
            <Link to="/profile" className="btn btn-primary btn-sm">Check & Update Profile</Link>
          </div>
        ) : (
          <div className="grid-cards">
            {eligibleList.slice(0, 3).map(item => (
              <ScholarshipCard
                key={item.scholarship.id}
                scholarship={item.scholarship}
                studentProfile={profile}
                onOpenApply={(s) => setSelectedScholarshipForModal(s)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Section: Recent Administrative Announcements */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#0f172a' }}>Latest Deadlines & Announcements</h2>
          <Link to="/notifications" className="btn btn-secondary btn-sm">
            View All
          </Link>
        </div>

        {announcements.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No announcements published yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {announcements.slice(0, 3).map(ann => (
              <div key={ann.id} className="card" style={{ padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', color: '#1e293b', marginBottom: '4px' }}>
                      {ann.title}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '6px' }}>
                      {ann.message}
                    </p>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Related to: <strong>{ann.scholarshipName}</strong> • {formatDate(ann.createdAt)}
                    </span>
                  </div>
                  <Link to="/notifications" className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>
                    Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Application Status Tracker Modal */}
      {selectedScholarshipForModal && (
        <StatusTrackerModal
          isOpen={Boolean(selectedScholarshipForModal)}
          onClose={() => setSelectedScholarshipForModal(null)}
          scholarship={selectedScholarshipForModal}
          studentUid={user?.uid}
          onSuccess={async () => {
            const apps = await getStudentApplications(user?.uid);
            setApplications(apps);
          }}
        />
      )}
    </div>
  );
}
