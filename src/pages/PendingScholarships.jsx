import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminNav from '../components/admin/AdminNav.jsx';
import CandidateCard from '../components/admin/CandidateCard.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import {
  getPendingScholarships,
  approveScholarship,
  rejectScholarship
} from '../services/scholarshipService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Clock, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react';

export default function PendingScholarships() {
  const { profile } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const loadPending = async () => {
    try {
      const list = await getPendingScholarships();
      setCandidates(list);
    } catch (err) {
      console.error('Failed to load pending queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleApprove = async (scholarshipId) => {
    setActionLoading(true);
    setFeedback({ type: '', message: '' });
    try {
      const reviewer = profile?.fullName || 'Administrator';
      await approveScholarship(scholarshipId, reviewer);
      setFeedback({
        type: 'success',
        message: 'Scholarship approved successfully! It is now visible to eligible students in the directory.'
      });
      await loadPending();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Approval failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (scholarshipId, reason) => {
    setActionLoading(true);
    setFeedback({ type: '', message: '' });
    try {
      const reviewer = profile?.fullName || 'Administrator';
      await rejectScholarship(scholarshipId, reason, reviewer);
      setFeedback({
        type: 'success',
        message: 'Scholarship rejected and removed from pending queue.'
      });
      await loadPending();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Rejection failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingState message="Loading pending candidate queue..." />;

  return (
    <div className="container main-content" style={{ maxWidth: '960px' }}>
      <AdminNav />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#d97706', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem' }}>
            <Clock size={18} /> PENDING CANDIDATE AUDIT QUEUE
          </div>
          <h1 style={{ fontSize: '1.85rem', color: '#0f172a' }}>Pending Scholarship Review Queue</h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
            Verify candidate scholarship details, evaluate student eligibility impact counts, and approve or reject before publication.
          </p>
        </div>

        <Link to="/admin/discovery" className="btn btn-primary btn-sm">
          <Sparkles size={14} /> AI Discovery Search
        </Link>
      </div>

      {feedback.message && (
        <div style={{
          background: feedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${feedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          color: feedback.type === 'success' ? '#166534' : '#991b1b',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          fontSize: '0.875rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : null}
          <span>{feedback.message}</span>
        </div>
      )}

      {candidates.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="Review Queue is Clear"
          description="There are currently no candidate scholarships awaiting review. Use AI Discovery or Manual Entry to discover new scholarships."
          actionLabel="Run AI Discovery Search"
          actionTo="/admin/discovery"
        />
      ) : (
        <div>
          <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#64748b' }}>
            <strong>{candidates.length}</strong> candidate record(s) awaiting verification
          </div>

          {candidates.map(scholarship => (
            <CandidateCard
              key={scholarship.id}
              scholarship={scholarship}
              onApprove={handleApprove}
              onReject={handleReject}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
}
