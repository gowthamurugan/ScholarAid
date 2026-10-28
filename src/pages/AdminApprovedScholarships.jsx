import React, { useState, useEffect } from 'react';
import StudentCountBadge from '../components/admin/StudentCountBadge.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import {
  getAllScholarshipsForAdmin,
  approveScholarship,
  rejectScholarship
} from '../services/scholarshipService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrencyINR, formatDate } from '../utils/validators.js';
import {
  CheckSquare,
  CheckCircle,
  XCircle,
  Building,
  Calendar,
  Search,
  AlertTriangle,
  CheckCircle2,
  X
} from 'lucide-react';

export default function AdminApprovedScholarships() {
  const { profile } = useAuth();
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectingSchId, setRejectingSchId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const loadData = async () => {
    try {
      const all = await getAllScholarshipsForAdmin();
      // Filter to Approved scholarships
      setScholarships(all.filter(s => s.status === 'Approved'));
    } catch (err) {
      console.error('Error loading approved scholarships:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConfirmReject = async () => {
    if (!rejectingSchId) return;
    try {
      const reviewer = profile?.fullName || 'Administrator';
      await rejectScholarship(rejectingSchId, rejectReason, reviewer);
      setFeedback({
        type: 'success',
        message: 'Scholarship has been revoked from Approved status and moved to Rejected.'
      });
      setRejectingSchId(null);
      setRejectReason('');
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Rejection failed.' });
    }
  };

  const handleReApprove = async (scholarshipId) => {
    try {
      const reviewer = profile?.fullName || 'Administrator';
      await approveScholarship(scholarshipId, reviewer);
      setFeedback({ type: 'success', message: 'Scholarship verified and approved.' });
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Approval failed.' });
    }
  };

  if (loading) return <LoadingState message="Loading approved scholarships..." />;

  const filtered = scholarships.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.provider.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container main-content">
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.85rem', color: 'var(--neutral-900)' }}>Approved Scholarships</h1>
        <p style={{ color: 'var(--neutral-600)', fontSize: '0.95rem' }}>
          Currently active and approved scholarships visible to eligible students. Administrators can review verification states or reject approved scholarships.
        </p>
      </div>

      {feedback.message && (
        <div style={{
          background: feedback.type === 'success' ? 'var(--success-light)' : 'var(--danger-light)',
          border: `1px solid ${feedback.type === 'success' ? 'var(--success-border)' : 'var(--danger-border)'}`,
          color: feedback.type === 'success' ? 'var(--success)' : 'var(--danger)',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          fontSize: '0.875rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {feedback.type === 'success' && <CheckCircle2 size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Search and Count Bar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--neutral-700)', fontWeight: 600 }}>
            {filtered.length} Approved Scholarship(s) Active
          </span>

          <div style={{ minWidth: '260px' }}>
            <input
              type="text"
              placeholder="Search approved scholarships..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ padding: '0.4rem 0.75rem' }}
            />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Zero Approved Scholarships"
          description="There are initially zero approved scholarships. To activate scholarships, go to 'All Scholarships' and click Approve or Add Announce on any official scholarship."
          actionLabel="Go to All Scholarships"
          onAction={() => window.location.href = '/admin/all-scholarships'}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filtered.map(s => (
            <div key={s.id} className="card" style={{ borderLeft: '4px solid var(--success)' }}>
              <div className="card-header" style={{ marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                    <span className="badge badge-success">Approved</span>
                    {s.targetedStudentTypes && s.targetedStudentTypes.length > 0 && (
                      <span className="badge" style={{ background: '#e0e7ff', color: '#3730a3', fontSize: '0.75rem' }}>
                        Target: {s.targetedStudentTypes.includes('All') || s.targetedStudentTypes.includes('All Students') ? 'All Students' : s.targetedStudentTypes.join(', ')}
                      </span>
                    )}
                  </div>
                  <h3 className="card-title" style={{ fontSize: '1.25rem' }}>{s.name}</h3>
                  <div className="card-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Building size={14} /> {s.provider}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <StudentCountBadge scholarship={s} />
                </div>
              </div>

              <div className="card-body">
                <p style={{ fontSize: '0.875rem', color: 'var(--neutral-600)', marginBottom: '0.85rem' }}>
                  {s.description}
                </p>

                {/* Criteria Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.5rem',
                  background: 'var(--neutral-50)',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  marginBottom: '0.85rem'
                }}>
                  <div><strong>Category:</strong> {s.eligibleCategory || 'Any'}</div>
                  <div><strong>Course:</strong> {s.eligibleCourse || 'Any'}</div>
                  <div><strong>Min GPA:</strong> {s.minGpa || 'None'}</div>
                  <div><strong>Max Income:</strong> {s.maxFamilyIncome ? formatCurrencyINR(s.maxFamilyIncome) : 'No limit'}</div>
                  <div><strong>State Name:</strong> {s.eligibleState || 'Any'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} style={{ color: 'var(--primary)' }} />
                    <strong>Deadline:</strong> {formatDate(s.deadline)}
                  </div>
                </div>
              </div>

              {/* Actions: Approve / Verified details or Reject Approved Scholarship */}
              <div className="card-footer" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>
                  Verified by: <strong>{s.reviewedBy || 'Admin'}</strong> • Last updated: {formatDate(s.lastUpdatedTimestamp)}
                </span>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleReApprove(s.id)}
                    className="btn btn-secondary btn-sm"
                    title="Verify / Re-confirm Approval"
                  >
                    <CheckCircle size={13} /> Re-Verify
                  </button>

                  <button
                    onClick={() => {
                      setRejectingSchId(s.id);
                      setRejectReason('');
                    }}
                    className="btn btn-danger btn-sm"
                    title="Reject this approved scholarship"
                  >
                    <XCircle size={13} /> Reject Approved Scholarship
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {rejectingSchId && (
        <div className="modal-overlay" onClick={() => setRejectingSchId(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--danger)' }}>
                Reject Approved Scholarship
              </h3>
              <button
                onClick={() => setRejectingSchId(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neutral-500)' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--neutral-600)', marginBottom: '1rem' }}>
              Are you sure you want to reject this scholarship? It will be immediately un-approved and hidden from the student catalog.
            </p>

            <div className="form-group">
              <label className="form-label">Reason for Revoking / Rejection</label>
              <textarea
                rows={2}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="form-textarea"
                placeholder="e.g. Application deadline closed early, quota filled, or grant revoked by provider."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setRejectingSchId(null)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="btn btn-danger btn-sm"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
