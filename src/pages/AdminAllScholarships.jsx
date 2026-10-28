import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StudentCountBadge from '../components/admin/StudentCountBadge.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import {
  getAllScholarshipsForAdmin,
  approveScholarship,
  rejectScholarship,
  updateScholarship
} from '../services/scholarshipService.js';
import {
  createTargetedAnnouncement,
  getMatchingAnnouncementRecipients
} from '../services/announcementService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrencyINR, formatDate, isValidHttpUrl } from '../utils/validators.js';
import {
  Layers,
  Edit,
  CheckCircle,
  XCircle,
  Bell,
  Send,
  Users,
  Building,
  Calendar,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  X,
  Save,
  AlertTriangle
} from 'lucide-react';

const TARGET_TYPE_OPTIONS = [
  { id: 'All', label: 'All Students' },
  { id: 'Women', label: 'Women' },
  { id: 'Men', label: 'Men' },
  { id: 'OBC', label: 'OBC' },
  { id: 'BC', label: 'BC' },
  { id: 'MBC', label: 'MBC' },
  { id: 'SC', label: 'SC' },
  { id: 'ST', label: 'ST' },
  { id: 'General', label: 'General' },
  { id: 'EWS', label: 'EWS' }
];

export default function AdminAllScholarships() {
  const { profile } = useAuth();
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Approve Target Selection Modal
  const [approveModalSch, setApproveModalSch] = useState(null);
  const [approveTargets, setApproveTargets] = useState(['All']);

  // Modal States
  const [announceModalSch, setAnnounceModalSch] = useState(null);
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [selectedTargets, setSelectedTargets] = useState(['All']);
  const [matchingPreviewCount, setMatchingPreviewCount] = useState(null);
  const [sendingAnnounce, setSendingAnnounce] = useState(false);

  // Edit Modal State
  const [editModalSch, setEditModalSch] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Reject Reason Modal State
  const [rejectingSchId, setRejectingSchId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadScholarships = async () => {
    try {
      const all = await getAllScholarshipsForAdmin();
      setScholarships(all);
    } catch (err) {
      console.error('Failed to load scholarships:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScholarships();
  }, []);

  // Update matching recipient preview in Announce modal
  useEffect(() => {
    if (!announceModalSch) return;
    let isMounted = true;
    async function updatePreview() {
      try {
        const matches = await getMatchingAnnouncementRecipients(announceModalSch, selectedTargets);
        if (isMounted) setMatchingPreviewCount(matches.length);
      } catch (err) {
        console.error('Error previewing recipients:', err);
      }
    }
    updatePreview();
    return () => { isMounted = false; };
  }, [announceModalSch, selectedTargets]);

  const handleOpenApproveModal = (scholarship) => {
    setApproveModalSch(scholarship);
    setApproveTargets(['All']);
  };

  const handleConfirmApprove = async () => {
    if (!approveModalSch) return;
    try {
      const reviewer = profile?.fullName || 'Administrator';
      await approveScholarship(approveModalSch.id, reviewer, approveTargets);
      setFeedback({
        type: 'success',
        message: `Scholarship approved successfully! It is now active in Approved Scholarships.`
      });
      setApproveModalSch(null);
      await loadScholarships();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Approval failed.' });
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingSchId) return;
    try {
      const reviewer = profile?.fullName || 'Administrator';
      await rejectScholarship(rejectingSchId, rejectReason, reviewer);
      setFeedback({ type: 'success', message: 'Scholarship rejected.' });
      setRejectingSchId(null);
      setRejectReason('');
      await loadScholarships();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Rejection failed.' });
    }
  };

  const handleOpenAnnounce = (scholarship) => {
    setAnnounceModalSch(scholarship);
    setAnnTitle(`Announcement: Applications open for ${scholarship.name}`);
    setAnnMessage('');
    setSelectedTargets(['All']);
  };

  const toggleTarget = (targetId) => {
    if (targetId === 'All') {
      setSelectedTargets(['All']);
      return;
    }
    let updated = selectedTargets.filter(t => t !== 'All');
    if (updated.includes(targetId)) {
      updated = updated.filter(t => t !== targetId);
    } else {
      updated.push(targetId);
    }
    if (updated.length === 0) {
      updated = ['All'];
    }
    setSelectedTargets(updated);
  };

  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    if (!annTitle.trim() || !annMessage.trim() || !announceModalSch) {
      alert('Please provide announcement title and message.');
      return;
    }

    setSendingAnnounce(true);
    try {
      const adminName = profile?.fullName || 'ScholarAid Administrative Office';
      const result = await createTargetedAnnouncement({
        scholarshipId: announceModalSch.id,
        title: annTitle.trim(),
        message: annMessage.trim(),
        targetTypes: selectedTargets
      }, adminName);

      setFeedback({
        type: 'success',
        message: `Announcement dispatched to ${result.recipientCount} student(s) and scholarship approved! It is now active in Approved Scholarships.`
      });
      setAnnounceModalSch(null);
      await loadScholarships();
    } catch (err) {
      alert('Failed to dispatch announcement: ' + err.message);
    } finally {
      setSendingAnnounce(false);
    }
  };

  const handleOpenEdit = (scholarship) => {
    setEditModalSch(scholarship);
    setEditForm({
      name: scholarship.name || '',
      provider: scholarship.provider || '',
      description: scholarship.description || '',
      minGpa: scholarship.minGpa !== undefined && scholarship.minGpa !== null ? String(scholarship.minGpa) : '',
      eligibleCategory: scholarship.eligibleCategory || 'Any',
      eligibleCourse: scholarship.eligibleCourse || 'Any',
      maxFamilyIncome: scholarship.maxFamilyIncome !== undefined && scholarship.maxFamilyIncome !== null ? String(scholarship.maxFamilyIncome) : '',
      eligibleState: scholarship.eligibleState || 'Any',
      deadline: scholarship.deadline || '',
      officialUrl: scholarship.officialUrl || '',
      status: scholarship.status || 'Pending'
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editModalSch || !editForm) return;

    setSavingEdit(true);
    try {
      const reviewer = profile?.fullName || 'Administrator';
      await updateScholarship(editModalSch.id, {
        ...editForm,
        minGpa: editForm.minGpa ? Number(editForm.minGpa) : null,
        maxFamilyIncome: editForm.maxFamilyIncome ? Number(editForm.maxFamilyIncome) : null
      }, reviewer);

      setFeedback({ type: 'success', message: 'Scholarship updated successfully!' });
      setEditModalSch(null);
      await loadScholarships();
    } catch (err) {
      alert('Failed to update scholarship: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) return <LoadingState message="Loading scholarships directory..." />;

  const filtered = scholarships.filter(s => {
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.provider.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="container main-content">
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.85rem', color: 'var(--neutral-900)' }}>All Scholarships Directory</h1>
        <p style={{ color: 'var(--neutral-600)', fontSize: '0.95rem' }}>
          Comprehensive view of all scholarships (Pending, Approved, Rejected). Manage approvals, edits, rejections, and issue targeted announcements.
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

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setStatusFilter('All')}
              className={`btn btn-sm ${statusFilter === 'All' ? 'btn-primary' : 'btn-secondary'}`}
            >
              All ({scholarships.length})
            </button>
            <button
              onClick={() => setStatusFilter('Approved')}
              className={`btn btn-sm ${statusFilter === 'Approved' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Approved ({scholarships.filter(s => s.status === 'Approved').length})
            </button>
            <button
              onClick={() => setStatusFilter('Pending')}
              className={`btn btn-sm ${statusFilter === 'Pending' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Pending ({scholarships.filter(s => s.status === 'Pending').length})
            </button>
            <button
              onClick={() => setStatusFilter('Rejected')}
              className={`btn btn-sm ${statusFilter === 'Rejected' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Rejected ({scholarships.filter(s => s.status === 'Rejected').length})
            </button>
          </div>

          <div style={{ minWidth: '240px' }}>
            <input
              type="text"
              placeholder="Search all scholarships..."
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
          title="No Scholarships Found"
          description="There are no scholarships matching your selected status filter and search term."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filtered.map(s => {
            const isApproved = s.status === 'Approved';
            const isRejected = s.status === 'Rejected';
            const isPending = s.status === 'Pending';

            return (
              <div
                key={s.id}
                className="card"
                style={{
                  borderLeft: isApproved ? '4px solid var(--success)' : isRejected ? '4px solid var(--danger)' : '4px solid var(--warning)'
                }}
              >
                {/* Header with Prominent Top-Right Eligible Student Count */}
                <div className="card-header" style={{ marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                      <span className={`badge ${isApproved ? 'badge-success' : isRejected ? 'badge-danger' : 'badge-warning'}`}>
                        {s.status}
                      </span>
                    </div>
                    <h3 className="card-title" style={{ fontSize: '1.25rem' }}>{s.name}</h3>
                    <div className="card-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Building size={14} /> {s.provider}
                    </div>
                  </div>

                  {/* Top Right Corner: How many students are eligible out of total registered */}
                  <div style={{ textAlign: 'right' }}>
                    <StudentCountBadge scholarship={s} />
                  </div>
                </div>

                <div className="card-body">
                  <p style={{ fontSize: '0.875rem', color: 'var(--neutral-600)', marginBottom: '0.85rem' }}>
                    {s.description || 'No description provided.'}
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

                  {isRejected && s.rejectionReason && (
                    <div style={{ background: 'var(--danger-light)', border: '1px solid var(--danger-border)', color: 'var(--danger)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                      <strong>Rejection Reason:</strong> {s.rejectionReason}
                    </div>
                  )}
                </div>

                {/* Action Buttons: Edit, Reject, Approve, Add Announce */}
                <div className="card-footer" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>
                    ID: {s.id}
                  </span>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {/* Edit Option */}
                    <button
                      onClick={() => handleOpenEdit(s)}
                      className="btn btn-secondary btn-sm"
                      title="Edit scholarship details"
                    >
                      <Edit size={13} /> Edit
                    </button>

                    {/* Reject Option */}
                    {!isRejected && (
                      <button
                        onClick={() => {
                          setRejectingSchId(s.id);
                          setRejectReason('');
                        }}
                        className="btn btn-outline-danger btn-sm"
                        title="Reject candidate or revoke approval"
                      >
                        <XCircle size={13} /> Reject
                      </button>
                    )}

                    {/* Approve Option */}
                    {!isApproved && (
                      <button
                        onClick={() => handleOpenApproveModal(s)}
                        className="btn btn-success btn-sm"
                        title="Approve scholarship"
                      >
                        <CheckCircle size={13} /> Approve
                      </button>
                    )}

                    {/* Add Announce Option */}
                    <button
                      onClick={() => handleOpenAnnounce(s)}
                      className="btn btn-primary btn-sm"
                      title="Create announcement targeted by student type"
                    >
                      <Bell size={13} /> Add Announce
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Target Announce Modal */}
      {announceModalSch && (
        <div className="modal-overlay" onClick={() => setAnnounceModalSch(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '6px', borderRadius: '6px' }}>
                  <Bell size={18} />
                </div>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--neutral-900)' }}>
                  Add Targeted Announcement
                </h3>
              </div>
              <button
                onClick={() => setAnnounceModalSch(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neutral-500)' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--neutral-600)', marginBottom: '1.25rem' }}>
              For Scholarship: <strong>{announceModalSch.name}</strong>
            </p>

            <form onSubmit={handleSendAnnouncement}>
              {/* Target Types Selection: OBC, BC, MBC, SC, ST, women, men, etc. */}
              <div className="form-group">
                <label className="form-label form-label-required" style={{ fontWeight: 700 }}>
                  Select Target Student Group(s)
                </label>
                <p style={{ fontSize: '0.785rem', color: 'var(--neutral-500)', marginBottom: '0.5rem' }}>
                  Select which specific groups receive this announcement. Only eligible students of the chosen group will be notified.
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {TARGET_TYPE_OPTIONS.map(opt => {
                    const isSelected = selectedTargets.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleTarget(opt.id)}
                        className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                        style={{
                          borderRadius: '9999px',
                          fontSize: '0.8rem',
                          padding: '0.25rem 0.75rem'
                        }}
                      >
                        {opt.label} {isSelected && '✓'}
                      </button>
                    );
                  })}
                </div>

                {/* Dynamic Preview Counter */}
                <div style={{
                  background: 'var(--neutral-50)',
                  border: '1px solid var(--neutral-200)',
                  borderRadius: '8px',
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.825rem',
                  color: 'var(--neutral-700)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Users size={16} style={{ color: 'var(--primary)' }} />
                  <span>
                    Will be sent to: <strong>{matchingPreviewCount !== null ? matchingPreviewCount : '...'} student(s)</strong> matching [<strong>{selectedTargets.join(', ')}</strong>]
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label form-label-required">Announcement Title</label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={e => setAnnTitle(e.target.value)}
                  className="form-input"
                  placeholder="e.g. Special Verification Notice for Women Applicants"
                />
              </div>

              <div className="form-group">
                <label className="form-label form-label-required">Announcement Message</label>
                <textarea
                  rows={4}
                  required
                  value={annMessage}
                  onChange={e => setAnnMessage(e.target.value)}
                  className="form-textarea"
                  placeholder="Enter notification details, deadlines, document instructions..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setAnnounceModalSch(null)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingAnnounce}
                  className="btn btn-primary btn-sm"
                >
                  <Send size={14} /> {sendingAnnounce ? 'Sending...' : 'Dispatch Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Scholarship Modal */}
      {editModalSch && editForm && (
        <div className="modal-overlay" onClick={() => setEditModalSch(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--neutral-900)' }}>Edit Scholarship Details</h3>
              <button
                onClick={() => setEditModalSch(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neutral-500)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label form-label-required">Scholarship Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label form-label-required">Provider Organization</label>
                  <input
                    type="text"
                    required
                    value={editForm.provider}
                    onChange={e => setEditForm({ ...editForm, provider: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  rows={2}
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  className="form-textarea"
                />
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Min GPA</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.minGpa}
                    onChange={e => setEditForm({ ...editForm, minGpa: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input
                    type="text"
                    value={editForm.eligibleCategory}
                    onChange={e => setEditForm({ ...editForm, eligibleCategory: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Course</label>
                  <input
                    type="text"
                    value={editForm.eligibleCourse}
                    onChange={e => setEditForm({ ...editForm, eligibleCourse: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Max Income (₹)</label>
                  <input
                    type="number"
                    value={editForm.maxFamilyIncome}
                    onChange={e => setEditForm({ ...editForm, maxFamilyIncome: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">State Name</label>
                  <input
                    type="text"
                    value={editForm.eligibleState}
                    onChange={e => setEditForm({ ...editForm, eligibleState: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Deadline</label>
                  <input
                    type="date"
                    value={editForm.deadline}
                    onChange={e => setEditForm({ ...editForm, deadline: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Official Application URL</label>
                <input
                  type="url"
                  value={editForm.officialUrl}
                  onChange={e => setEditForm({ ...editForm, officialUrl: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setEditModalSch(null)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="btn btn-primary btn-sm"
                >
                  <Save size={14} /> {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {rejectingSchId && (
        <div className="modal-overlay" onClick={() => setRejectingSchId(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--danger)', marginBottom: '0.75rem' }}>
              Confirm Scholarship Rejection
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--neutral-600)', marginBottom: '1rem' }}>
              Are you sure you want to reject this scholarship? It will be marked as Rejected and removed from the active student catalog.
            </p>

            <div className="form-group">
              <label className="form-label">Rejection Reason (Optional)</label>
              <textarea
                rows={2}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="form-textarea"
                placeholder="e.g. Unverified sponsor, portal closed, or institutional guidelines not met"
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

      {/* Approve Modal with Target Audience Selection */}
      {approveModalSch && (
        <div className="modal-overlay" onClick={() => setApproveModalSch(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={20} style={{ color: 'var(--success)' }} />
                <h3 style={{ fontSize: '1.2rem', color: 'var(--neutral-900)', margin: 0 }}>Approve Scholarship</h3>
              </div>
              <button
                onClick={() => setApproveModalSch(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neutral-500)' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--neutral-700)', marginBottom: '0.75rem' }}>
              Approve <strong>{approveModalSch.name}</strong> to make it active. Specify which student group should see this approved scholarship:
            </p>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--neutral-700)', display: 'block', marginBottom: '0.5rem' }}>
                Target Student Audience:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {TARGET_TYPE_OPTIONS.map(opt => {
                  const isSelected = approveTargets.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        if (opt.id === 'All') {
                          setApproveTargets(['All']);
                        } else {
                          let next = approveTargets.filter(t => t !== 'All');
                          if (next.includes(opt.id)) {
                            next = next.filter(t => t !== opt.id);
                          } else {
                            next.push(opt.id);
                          }
                          if (next.length === 0) next = ['All'];
                          setApproveTargets(next);
                        }
                      }}
                      className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.8rem', padding: '0.25rem 0.65rem', borderRadius: '9999px' }}
                    >
                      {opt.label} {isSelected && '✓'}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setApproveModalSch(null)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                className="btn btn-primary btn-sm"
                style={{ background: 'var(--success)', borderColor: 'var(--success)' }}
              >
                <CheckCircle size={14} /> Confirm & Publish Approval
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
