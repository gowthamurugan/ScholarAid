import React, { useState } from 'react';
import { X, ExternalLink, ShieldAlert, CheckCircle } from 'lucide-react';
import { updateApplicationStatus, APPLICATION_STATUS_DISCLAIMER } from '../../services/applicationService.js';
import { safelyOpenExternalUrl } from '../../utils/validators.js';

export default function StatusTrackerModal({
  isOpen,
  onClose,
  scholarship,
  studentUid,
  currentStatus = 'Eligible',
  onSuccess = null
}) {
  const [status, setStatus] = useState(currentStatus || 'Eligible');
  const [applicationNumber, setApplicationNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen || !scholarship) return null;

  const handleLaunchOfficialPortal = () => {
    if (!scholarship.officialUrl) {
      setError('Official URL is not configured for this scholarship.');
      return;
    }

    const opened = safelyOpenExternalUrl(scholarship.officialUrl);
    if (opened) {
      // Auto-set status to 'Opened link'
      setStatus('Opened link');
    } else {
      setError('Could not open external URL. Please verify popup blocker settings.');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!studentUid) {
      setError('Student authentication session missing.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await updateApplicationStatus(studentUid, scholarship.id, {
        scholarshipName: scholarship.name,
        provider: scholarship.provider,
        status,
        applicationNumber,
        notes
      });
      setSavedSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to update application status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#0f172a' }}>Application Status Tracker</h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1rem' }}>
          Scholarship: <strong>{scholarship.name}</strong> ({scholarship.provider})
        </p>

        {/* Portal Launcher Action */}
        {scholarship.officialUrl && (
          <div style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.25rem'
          }}>
            <h4 style={{ fontSize: '0.9rem', color: '#1e40af', marginBottom: '4px' }}>
              Official Application Portal
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#3b82f6', marginBottom: '8px' }}>
              Opens external provider website safely in a new tab.
            </p>
            <button
              type="button"
              onClick={handleLaunchOfficialPortal}
              className="btn btn-primary btn-sm"
            >
              <ExternalLink size={14} /> Open Official Website
            </button>
          </div>
        )}

        {/* Mandatory Status Disclaimer */}
        <div className="disclaimer-alert" style={{ margin: '0 0 1.25rem 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
            <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              <strong>Notice:</strong> {APPLICATION_STATUS_DISCLAIMER} Opening an external portal does not constitute application submission.
            </span>
          </div>
        </div>

        {error && (
          <div style={{ color: '#dc2626', background: '#fef2f2', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {savedSuccess && (
          <div style={{ color: '#16a34a', background: '#f0fdf4', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle size={16} /> Application status updated successfully!
          </div>
        )}

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label form-label-required">Application Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="form-select"
            >
              <option value="Eligible">Eligible (Identified & planned)</option>
              <option value="Opened link">Opened link (Visited official portal)</option>
              <option value="Submitted">Submitted (Form completed on official portal)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Official Application / Reference Number (Optional)
            </label>
            <input
              type="text"
              value={applicationNumber}
              onChange={e => setApplicationNumber(e.target.value)}
              className="form-input"
              placeholder="e.g. NSP-2026-ENG-49120"
            />
            <div className="form-hint">
              Keep track of your acknowledgment or tracking number for personal reference.
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Personal Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="form-textarea"
              rows={2}
              placeholder="e.g., Uploaded caste certificate; awaiting HOD endorsement."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary btn-sm">
              {loading ? 'Saving...' : 'Save Status Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
