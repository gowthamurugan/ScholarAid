import React, { useState, useEffect } from 'react';
import AdminNav from '../components/admin/AdminNav.jsx';
import { getApprovedScholarships, calculateStudentEligibilityImpact } from '../services/scholarshipService.js';
import { createTargetedAnnouncement, getAnnouncements } from '../services/announcementService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDate } from '../utils/validators.js';
import LoadingState from '../components/common/LoadingState.jsx';
import {
  BellPlus,
  Send,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  History
} from 'lucide-react';

export default function AnnouncementCreation() {
  const { profile } = useAuth();
  const [scholarships, setScholarships] = useState([]);
  const [pastAnnouncements, setPastAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchId, setSelectedSchId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [recipientPreview, setRecipientPreview] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const loadData = async () => {
    try {
      const [approved, anns] = await Promise.all([
        getApprovedScholarships(),
        getAnnouncements()
      ]);
      setScholarships(approved);
      setPastAnnouncements(anns);
      if (approved.length > 0 && !selectedSchId) {
        setSelectedSchId(approved[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update recipient preview whenever selected scholarship changes
  useEffect(() => {
    if (!selectedSchId) return;
    const sch = scholarships.find(s => s.id === selectedSchId);
    if (!sch) return;

    let isMounted = true;
    async function updatePreview() {
      try {
        const impact = await calculateStudentEligibilityImpact(sch);
        if (isMounted) setRecipientPreview(impact);
      } catch (err) {
        console.error('Failed to preview recipients:', err);
      }
    }
    updatePreview();
    return () => { isMounted = false; };
  }, [selectedSchId, scholarships]);

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim() || !selectedSchId) {
      setFeedback({ type: 'error', message: 'Title, message, and scholarship selection are required.' });
      return;
    }

    setPublishing(true);
    setFeedback({ type: '', message: '' });
    try {
      const adminName = profile?.fullName || 'ScholarAid Administrative Office';
      const result = await createTargetedAnnouncement({
        title: title.trim(),
        message: message.trim(),
        scholarshipId: selectedSchId
      }, adminName);

      setFeedback({
        type: 'success',
        message: `Announcement successfully published and dispatched to ${result.recipientCount} eligible student notifications!`
      });

      setTitle('');
      setMessage('');
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to dispatch announcement.' });
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <LoadingState message="Loading announcement workspace..." />;

  const selectedSch = scholarships.find(s => s.id === selectedSchId);

  return (
    <div className="container main-content" style={{ maxWidth: '900px' }}>
      <AdminNav />

      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#2563eb', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem' }}>
          <BellPlus size={18} /> TARGETED RECIPIENT BROADCAST
        </div>
        <h1 style={{ fontSize: '1.85rem', color: '#0f172a' }}>Issue Targeted Announcements</h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
          Create scholarship-specific announcements. The Centralized Eligibility Engine automatically targets
          only students who currently satisfy the selected scholarship rules.
        </p>
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

      {/* Announcement Form Card */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <form onSubmit={handlePublish}>
          <div className="form-group">
            <label className="form-label form-label-required">Select Associated Approved Scholarship</label>
            <select
              value={selectedSchId}
              onChange={e => setSelectedSchId(e.target.value)}
              className="form-select"
            >
              {scholarships.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.provider})
                </option>
              ))}
            </select>
          </div>

          {/* Real-time Recipient Preview Card */}
          {recipientPreview && (
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '0.85rem 1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#334155' }}>
                <Users size={16} style={{ color: '#2563eb' }} />
                <span>
                  Targeting: <strong>{recipientPreview.count}</strong> eligible student(s) of {recipientPreview.totalStudents} total registered student(s)
                </span>
              </div>
              <span className="badge badge-eligible">Centralized Engine Verified</span>
            </div>
          )}

          <div className="form-group">
            <label className="form-label form-label-required">Announcement Title / Subject</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="form-input"
              placeholder="e.g. Critical Document Submission Deadline: 15 Nov"
            />
          </div>

          <div className="form-group">
            <label className="form-label form-label-required">Announcement Message</label>
            <textarea
              rows={4}
              required
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="form-textarea"
              placeholder="Provide exact instructions, required documents, portal hints, or validity reminders..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button
              type="submit"
              disabled={publishing || scholarships.length === 0}
              className="btn btn-primary"
            >
              {publishing ? 'Evaluating & Dispatching...' : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Send size={15} /> Publish & Dispatch to Eligible Students
                </span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Past Announcements History */}
      <div>
        <h2 style={{ fontSize: '1.25rem', color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <History size={18} /> Previously Published Announcements ({pastAnnouncements.length})
        </h2>

        {pastAnnouncements.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No past announcements published.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pastAnnouncements.map(ann => (
              <div key={ann.id} className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <h4 style={{ fontSize: '1rem', color: '#0f172a' }}>{ann.title}</h4>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{formatDate(ann.createdAt)}</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '8px' }}>{ann.message}</p>
                <div style={{ fontSize: '0.8rem', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
                  Target: <strong>{ann.scholarshipName}</strong> ({ann.eligibleRecipientCount !== undefined ? `${ann.eligibleRecipientCount} recipients` : 'Targeted'})
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
