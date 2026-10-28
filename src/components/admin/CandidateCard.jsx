import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building,
  Calendar,
  ExternalLink,
  CheckCircle,
  XCircle,
  Edit,
  AlertTriangle,
  FileText
} from 'lucide-react';
import StudentCountBadge from './StudentCountBadge.jsx';
import { formatCurrencyINR, formatDate, isValidHttpUrl } from '../../utils/validators.js';

export default function CandidateCard({
  scholarship,
  onApprove,
  onReject,
  actionLoading = false
}) {
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Check for missing or uncertain fields
  const uncertainFields = [];
  if (!scholarship.minGpa && scholarship.minGpa !== 0) uncertainFields.push('Minimum GPA unspecified');
  if (!scholarship.maxFamilyIncome) uncertainFields.push('Max Family Income unspecified');
  if (!scholarship.deadline) uncertainFields.push('Deadline missing');
  if (!scholarship.officialUrl || !isValidHttpUrl(scholarship.officialUrl)) uncertainFields.push('Official Application URL unverified');

  const handleConfirmReject = () => {
    onReject(scholarship.id, rejectReason);
    setRejecting(false);
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #f59e0b' }}>
      <div className="card-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
            <span className="badge badge-pending">Pending Review</span>
            {scholarship.isSample && <span className="badge badge-sample">Sample Candidate</span>}
          </div>
          <h3 className="card-title">{scholarship.name}</h3>
          <div className="card-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Building size={14} /> {scholarship.provider}
          </div>
        </div>

        <StudentCountBadge scholarship={scholarship} />
      </div>

      <div className="card-body">
        <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1rem' }}>
          {scholarship.description || 'No description provided.'}
        </p>

        {/* Criteria Matrix */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.75rem',
          background: '#f8fafc',
          padding: '1rem',
          borderRadius: '8px',
          fontSize: '0.85rem',
          marginBottom: '1rem'
        }}>
          <div><strong>Eligible Category:</strong> {scholarship.eligibleCategory || 'Any'}</div>
          <div><strong>Eligible Course:</strong> {scholarship.eligibleCourse || 'Any'}</div>
          <div><strong>Eligible State:</strong> {scholarship.eligibleState || 'Any'}</div>
          <div><strong>Min GPA:</strong> {scholarship.minGpa || 'None'}</div>
          <div><strong>Max Family Income:</strong> {scholarship.maxFamilyIncome ? formatCurrencyINR(scholarship.maxFamilyIncome) : 'No limit'}</div>
          <div><strong>Deadline:</strong> {formatDate(scholarship.deadline)}</div>
          <div><strong>Certificate Validity:</strong> {scholarship.incomeCertValidityDays || 180} days</div>
          <div>
            <strong>Required Docs:</strong>{' '}
            {Array.isArray(scholarship.requiredDocuments)
              ? scholarship.requiredDocuments.join(', ')
              : scholarship.requiredDocuments || 'Standard documents'}
          </div>
        </div>

        {/* Source and Application URLs */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem',
          fontSize: '0.8rem',
          color: '#64748b',
          marginBottom: '1rem'
        }}>
          {scholarship.sourceUrl && (
            <div>
              <strong>Original Source URL: </strong>
              <a href={scholarship.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all' }}>
                {scholarship.sourceUrl} <ExternalLink size={12} />
              </a>
            </div>
          )}
          {scholarship.officialUrl && (
            <div>
              <strong>Official Portal URL: </strong>
              <a href={scholarship.officialUrl} target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all' }}>
                {scholarship.officialUrl} <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>

        {/* Uncertain or Missing Fields Warning */}
        {uncertainFields.length > 0 && (
          <div style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '6px',
            padding: '0.65rem 0.85rem',
            marginBottom: '1rem',
            fontSize: '0.8rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#92400e', fontWeight: 600, marginBottom: '2px' }}>
              <AlertTriangle size={14} /> Attention required before approval:
            </div>
            <ul style={{ paddingLeft: '1.25rem', color: '#b45309' }}>
              {uncertainFields.map((field, idx) => (
                <li key={idx}>{field}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Inline Reject Reason Drawer */}
        {rejecting && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <h5 style={{ color: '#991b1b', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
              Provide Reason for Rejection
            </h5>
            <textarea
              className="form-textarea"
              rows={2}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Unverified private portal, fees demanded, duplicate record, or expired grant."
              style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleConfirmReject}
                disabled={actionLoading}
                className="btn btn-danger btn-sm"
              >
                Confirm Rejection
              </button>
              <button
                onClick={() => setRejecting(false)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card-footer">
        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
          Discovered: {formatDate(scholarship.discoveryTimestamp)}
        </span>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link
            to={`/admin/review/${scholarship.id}`}
            className="btn btn-secondary btn-sm"
            title="Edit scholarship criteria and verify details"
          >
            <Edit size={13} /> Edit / Review
          </Link>

          {!rejecting && (
            <button
              onClick={() => setRejecting(true)}
              disabled={actionLoading}
              className="btn btn-outline-danger btn-sm"
            >
              <XCircle size={13} /> Reject
            </button>
          )}

          <button
            onClick={() => onApprove(scholarship.id)}
            disabled={actionLoading}
            className="btn btn-success btn-sm"
            title="Approve and make visible to students"
          >
            <CheckCircle size={13} /> Approve
          </button>
        </div>
      </div>
    </div>
  );
}
