import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminNav from '../components/admin/AdminNav.jsx';
import StudentCountBadge from '../components/admin/StudentCountBadge.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import {
  getAllScholarshipsForAdmin,
  updateScholarship
} from '../services/scholarshipService.js';
import { formatDate } from '../utils/validators.js';
import { CheckSquare, Edit, XCircle, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';

export default function ApprovedRejectedManagement() {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const loadScholarships = async () => {
    try {
      const all = await getAllScholarshipsForAdmin();
      setScholarships(all.filter(s => s.status !== 'Pending'));
    } catch (err) {
      console.error('Error loading scholarships:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScholarships();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateScholarship(id, { status: newStatus });
      await loadScholarships();
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  if (loading) return <LoadingState message="Loading scholarship records..." />;

  const filtered = scholarships.filter(s => {
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.provider.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="container main-content">
      <AdminNav />

      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem' }}>
          <CheckSquare size={18} /> DIRECTORY ADMINISTRATION
        </div>
        <h1 style={{ fontSize: '1.85rem', color: '#0f172a' }}>Approved & Rejected Scholarships</h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
          Manage published scholarships, update criteria, or review previously rejected submissions.
        </p>
      </div>

      {/* Filter and Search */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={() => setStatusFilter('All')}
              className={`btn btn-sm ${statusFilter === 'All' ? 'btn-primary' : 'btn-secondary'}`}
            >
              All Records ({scholarships.length})
            </button>
            <button
              onClick={() => setStatusFilter('Approved')}
              className={`btn btn-sm ${statusFilter === 'Approved' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Approved ({scholarships.filter(s => s.status === 'Approved').length})
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
              placeholder="Search directory..."
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
          title="No scholarships found"
          description="There are no records matching your selected status filter and search term."
        />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Scholarship Name</th>
                <th>Provider</th>
                <th>Status</th>
                <th>Eligible Students</th>
                <th>Deadline</th>
                <th>Last Reviewed</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td>
                    <strong>{s.name}</strong>
                    {s.isSample && <span className="badge badge-sample" style={{ marginLeft: '6px' }}>Sample</span>}
                  </td>
                  <td>{s.provider}</td>
                  <td>
                    <span className={`badge ${s.status === 'Approved' ? 'badge-success' : 'badge-danger'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td>
                    <StudentCountBadge scholarship={s} />
                  </td>
                  <td>{formatDate(s.deadline)}</td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {formatDate(s.lastUpdatedTimestamp)} by {s.reviewedBy || 'Admin'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                      <Link
                        to={`/admin/review/${s.id}`}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                      >
                        <Edit size={12} /> Edit
                      </Link>

                      {s.status === 'Approved' ? (
                        <button
                          onClick={() => handleStatusChange(s.id, 'Rejected')}
                          className="btn btn-outline-danger btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                          title="Revoke approval and move to rejected"
                        >
                          Revoke
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(s.id, 'Approved')}
                          className="btn btn-success btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                          title="Restore and approve"
                        >
                          Approve
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
