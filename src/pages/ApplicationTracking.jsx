import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getStudentApplications, APPLICATION_STATUS_DISCLAIMER } from '../services/applicationService.js';
import { getApprovedScholarships } from '../services/scholarshipService.js';
import StatusTrackerModal from '../components/student/StatusTrackerModal.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { formatDate } from '../utils/validators.js';
import {
  FileText,
  Clock,
  ExternalLink,
  ShieldAlert,
  Edit,
  PlusCircle,
  Building
} from 'lucide-react';

export default function ApplicationTracking() {
  const { user } = useAuth();
  const [applications, setApplications] = useState({});
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedForModal, setSelectedForModal] = useState(null);

  const loadData = async () => {
    try {
      const [apps, approved] = await Promise.all([
        getStudentApplications(user?.uid),
        getApprovedScholarships()
      ]);
      setApplications(apps);
      setScholarships(approved);
    } catch (err) {
      console.error('Error loading applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.uid]);

  if (loading) return <LoadingState message="Loading your tracked applications..." />;

  const appList = Object.values(applications);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Submitted':
        return <span className="badge badge-success">Submitted (Self-Reported)</span>;
      case 'Opened link':
        return <span className="badge badge-pending">Opened Portal Link</span>;
      default:
        return <span className="badge badge-neutral">Eligible / Identified</span>;
    }
  };

  return (
    <div className="container main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#2563eb', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem' }}>
            <FileText size={18} /> STUDENT SELF-MAINTAINED LOG
          </div>
          <h1 style={{ fontSize: '1.85rem', color: '#0f172a' }}>Application Status Tracking</h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
            Record and monitor your personal scholarship application progress, portal visits, and submission references.
          </p>
        </div>

        <Link to="/scholarships" className="btn btn-primary btn-sm">
          <PlusCircle size={15} /> Track Another Scholarship
        </Link>
      </div>

      {/* Mandatory Status Disclaimer from Section 15 */}
      <div className="disclaimer-alert">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Important Transparency Notice:</strong> {APPLICATION_STATUS_DISCLAIMER} ScholarAid provides this tracking page solely for student convenience. ScholarAid cannot and does not verify whether an external scholarship provider received, approved, or processed your submission.
          </div>
        </div>
      </div>

      {appList.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Tracked Applications Yet"
          description="You have not recorded any scholarship applications yet. Browse approved scholarships and click 'Apply' or 'Update My Status' to start tracking."
          actionLabel="Browse Approved Scholarships"
          actionTo="/scholarships"
        />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Scholarship Name</th>
                <th>Provider Organization</th>
                <th>Reported Status</th>
                <th>App / Reference No.</th>
                <th>Last Updated</th>
                <th>Notes</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appList.map(app => {
                const fullSch = scholarships.find(s => s.id === app.scholarshipId) || {
                  id: app.scholarshipId,
                  name: app.scholarshipName,
                  provider: app.provider
                };

                return (
                  <tr key={app.scholarshipId}>
                    <td>
                      <strong>{app.scholarshipName}</strong>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#64748b' }}>
                        <Building size={12} /> {app.provider || 'Sponsoring Body'}
                      </span>
                    </td>
                    <td>{getStatusBadge(app.status)}</td>
                    <td>
                      <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>
                        {app.applicationNumber || 'None recorded'}
                      </code>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {formatDate(app.updatedAt)}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', maxWidth: '180px', display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {app.notes || '—'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedForModal(fullSch)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                      >
                        <Edit size={12} /> Update
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedForModal && (
        <StatusTrackerModal
          isOpen={Boolean(selectedForModal)}
          onClose={() => setSelectedForModal(null)}
          scholarship={selectedForModal}
          studentUid={user?.uid}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
