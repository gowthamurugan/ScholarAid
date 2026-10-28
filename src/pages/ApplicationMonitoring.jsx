import React, { useState, useEffect } from 'react';
import {
  getAllApplicationsForMonitoring,
  APPLICATION_STATUS_DISCLAIMER
} from '../services/applicationService.js';
import LoadingState from '../components/common/LoadingState.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import { formatDate } from '../utils/validators.js';
import {
  ShieldAlert,
  Search,
  Filter,
  ArrowUpDown
} from 'lucide-react';

export default function ApplicationMonitoring() {
  const [data, setData] = useState({ records: [], summary: { total: 0, eligibleCount: 0, openedLinkCount: 0, submittedCount: 0 } });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [scholarshipFilter, setScholarshipFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('submitted_sch_desc'); // Default: Submitted based on scholarships

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const res = await getAllApplicationsForMonitoring();
        if (isMounted) setData(res);
      } catch (err) {
        console.error('Failed to load application monitoring data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, []);

  if (loading) return <LoadingState message="Loading student application monitoring metrics..." />;

  const { records, summary } = data;

  // Calculate total submitted counts per scholarship for scholarship-level submission sorting
  const scholarshipSubmissionCounts = {};
  const scholarshipNamesSet = new Set();
  records.forEach(r => {
    const key = r.scholarshipName || 'Unspecified Scholarship';
    scholarshipNamesSet.add(key);
    if (!scholarshipSubmissionCounts[key]) {
      scholarshipSubmissionCounts[key] = 0;
    }
    if (r.status === 'Submitted') {
      scholarshipSubmissionCounts[key] += 1;
    }
  });

  const uniqueScholarshipNames = Array.from(scholarshipNamesSet).sort();

  // Filter individual student records
  const filteredRecords = records.filter(r => {
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    const matchesScholarship = scholarshipFilter === 'All' || r.scholarshipName === scholarshipFilter;
    const matchesSearch =
      (r.scholarshipName && r.scholarshipName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.provider && r.provider.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.applicationNumber && r.applicationNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesScholarship && matchesSearch;
  });

  // Sort individual records
  filteredRecords.sort((a, b) => {
    // 1. Submitted based on scholarships (scholarships with most submissions first, then submitted status first)
    if (sortBy === 'submitted_sch_desc') {
      const schA = a.scholarshipName || '';
      const schB = b.scholarshipName || '';
      const countA = scholarshipSubmissionCounts[schA] || 0;
      const countB = scholarshipSubmissionCounts[schB] || 0;
      if (countB !== countA) return countB - countA;
      if (a.status === 'Submitted' && b.status !== 'Submitted') return -1;
      if (b.status === 'Submitted' && a.status !== 'Submitted') return 1;
      return (a.scholarshipName || '').localeCompare(b.scholarshipName || '');
    }

    // 2. Put 'Submitted' records strictly on top
    if (sortBy === 'submitted_desc') {
      if (a.status === 'Submitted' && b.status !== 'Submitted') return -1;
      if (b.status === 'Submitted' && a.status !== 'Submitted') return 1;
      return (a.scholarshipName || '').localeCompare(b.scholarshipName || '');
    }

    // 3. Put 'Submitted' records at bottom
    if (sortBy === 'submitted_asc') {
      if (a.status === 'Submitted' && b.status !== 'Submitted') return 1;
      if (b.status === 'Submitted' && a.status !== 'Submitted') return -1;
      return (a.scholarshipName || '').localeCompare(b.scholarshipName || '');
    }

    // 4. Alphabetical by scholarship name
    if (sortBy === 'name_asc') {
      return (a.scholarshipName || '').localeCompare(b.scholarshipName || '');
    }

    // 5. Oldest first
    if (sortBy === 'date_asc') {
      return new Date(a.updatedAt) - new Date(b.updatedAt);
    }

    // 6. Default: latest updated
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  return (
    <div className="container main-content">
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.85rem', color: 'var(--neutral-900)' }}>Student Application Status Monitoring</h1>
        <p style={{ color: 'var(--neutral-600)', fontSize: '0.95rem' }}>
          Real-time tracking of self-reported student application submissions with sorting by scholarship and submission status.
        </p>
      </div>

      {/* Mandatory Status Disclaimer */}
      <div className="disclaimer-alert" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Monitoring Notice:</strong> {APPLICATION_STATUS_DISCLAIMER} These logs represent self-reported actions recorded by students. They are not verified against external scholarship portals.
          </div>
        </div>
      </div>

      {/* Filter, Sort, and Search Bar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Status Filter Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setStatusFilter('All')}
              className={`btn btn-sm ${statusFilter === 'All' ? 'btn-primary' : 'btn-secondary'}`}
            >
              All Statuses ({records.length})
            </button>
            <button
              onClick={() => setStatusFilter('Submitted')}
              className={`btn btn-sm ${statusFilter === 'Submitted' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Submitted ({summary.submittedCount})
            </button>
            <button
              onClick={() => setStatusFilter('Opened link')}
              className={`btn btn-sm ${statusFilter === 'Opened link' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Opened link ({summary.openedLinkCount})
            </button>
            <button
              onClick={() => setStatusFilter('Eligible')}
              className={`btn btn-sm ${statusFilter === 'Eligible' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Eligible ({summary.eligibleCount})
            </button>
          </div>

          {/* Controls: Scholarship Filter, Sort by, and Search */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Scholarship Filter Dropdown */}
            <select
              value={scholarshipFilter}
              onChange={e => setScholarshipFilter(e.target.value)}
              className="form-select"
              style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.85rem' }}
              title="Filter by scholarship"
            >
              <option value="All">All Scholarships</option>
              {uniqueScholarshipNames.map((name, i) => (
                <option key={i} value={name}>{name}</option>
              ))}
            </select>

            {/* Sorting System Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ArrowUpDown size={15} style={{ color: 'var(--neutral-500)' }} />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="form-select"
                style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.85rem', fontWeight: 500 }}
                title="Sort applications"
              >
                <option value="submitted_sch_desc">Submitted Based (by Scholarship)</option>
                <option value="submitted_desc">Submitted Status First</option>
                <option value="submitted_asc">Submitted Status Last</option>
                <option value="name_asc">Scholarship Name (A-Z)</option>
                <option value="date_desc">Latest Activity First</option>
                <option value="date_asc">Oldest Activity First</option>
              </select>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search student or app no..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="form-input"
                style={{ width: '200px', padding: '0.35rem 0.65rem', paddingLeft: '1.75rem', fontSize: '0.85rem' }}
              />
              <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Application Records Table */}
      {filteredRecords.length === 0 ? (
        <EmptyState
          title="No Application Records Found"
          description="No student-reported application logs match your selected filter, sort, and search criteria."
          actionLabel="Reset Filters"
          onAction={() => {
            setStatusFilter('All');
            setScholarshipFilter('All');
            setSearchTerm('');
            setSortBy('submitted_sch_desc');
          }}
        />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Scholarship Name</th>
                <th>Provider Organization</th>
                <th>Self-Reported Status</th>
                <th>App / Reference No.</th>
                <th>Logged Timestamp</th>
                <th>Student ID (Masked)</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((r, i) => (
                <tr key={i}>
                  <td>
                    <strong>{r.scholarshipName || 'Scholarship'}</strong>
                  </td>
                  <td>{r.provider || 'Provider'}</td>
                  <td>
                    <span className={`badge ${r.status === 'Submitted' ? 'badge-success' : r.status === 'Opened link' ? 'badge-warning' : 'badge-neutral'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    <code style={{ background: 'var(--neutral-100)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>
                      {r.applicationNumber || 'None provided'}
                    </code>
                  </td>
                  <td>{formatDate(r.updatedAt)}</td>
                  <td>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--neutral-500)' }}>
                      {r.studentUid ? r.studentUid.substring(0, 8) + '...' : 'Student'}
                    </span>
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
