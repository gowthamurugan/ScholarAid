import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import StudentCountBadge from '../components/admin/StudentCountBadge.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import ErrorMessage from '../components/common/ErrorMessage.jsx';
import {
  getScholarshipById,
  updateScholarship,
  approveScholarship
} from '../services/scholarshipService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { isValidHttpUrl } from '../utils/validators.js';
import {
  ArrowLeft,
  Save,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

export default function ScholarshipReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [scholarship, setScholarship] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    description: '',
    officialUrl: '',
    sourceUrl: '',
    minGpa: '',
    eligibleCategory: 'Any',
    eligibleCourse: 'Any',
    maxFamilyIncome: '',
    eligibleState: 'Any',
    requiredDocuments: '',
    deadline: '',
    incomeCertValidityDays: 180,
    status: 'Pending'
  });

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const item = await getScholarshipById(id);
        if (!item) {
          setError('Scholarship record not found.');
        } else {
          setScholarship(item);
          setFormData({
            name: item.name || '',
            provider: item.provider || '',
            description: item.description || '',
            officialUrl: item.officialUrl || '',
            sourceUrl: item.sourceUrl || '',
            minGpa: item.minGpa !== undefined && item.minGpa !== null ? String(item.minGpa) : '',
            eligibleCategory: item.eligibleCategory || 'Any',
            eligibleCourse: item.eligibleCourse || 'Any',
            maxFamilyIncome: item.maxFamilyIncome !== undefined && item.maxFamilyIncome !== null ? String(item.maxFamilyIncome) : '',
            eligibleState: item.eligibleState || 'Any',
            requiredDocuments: Array.isArray(item.requiredDocuments)
              ? item.requiredDocuments.join(', ')
              : item.requiredDocuments || '',
            deadline: item.deadline || '',
            incomeCertValidityDays: item.incomeCertValidityDays || 180,
            status: item.status || 'Pending'
          });
        }
      } catch (err) {
        setError(err.message || 'Error loading candidate.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [id]);

  if (loading) return <LoadingState message="Loading candidate record for review..." />;
  if (error || !scholarship) return <div className="container main-content"><ErrorMessage message={error || 'Record not found'} /></div>;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveOnly = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');

    if (formData.officialUrl && !isValidHttpUrl(formData.officialUrl)) {
      setError('Official application URL must start with http:// or https://');
      setSaving(false);
      return;
    }

    try {
      const reviewer = profile?.fullName || 'Administrator';
      await updateScholarship(id, {
        ...formData,
        minGpa: formData.minGpa ? Number(formData.minGpa) : null,
        maxFamilyIncome: formData.maxFamilyIncome ? Number(formData.maxFamilyIncome) : null,
        incomeCertValidityDays: Number(formData.incomeCertValidityDays || 180),
        requiredDocuments: formData.requiredDocuments
          .split(',')
          .map(d => d.trim())
          .filter(Boolean)
      }, reviewer);

      setSuccessMsg('Scholarship record updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update record.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndApprove = async () => {
    setSaving(true);
    setError('');
    try {
      const reviewer = profile?.fullName || 'Administrator';
      await updateScholarship(id, {
        ...formData,
        minGpa: formData.minGpa ? Number(formData.minGpa) : null,
        maxFamilyIncome: formData.maxFamilyIncome ? Number(formData.maxFamilyIncome) : null,
        incomeCertValidityDays: Number(formData.incomeCertValidityDays || 180),
        requiredDocuments: formData.requiredDocuments
          .split(',')
          .map(d => d.trim())
          .filter(Boolean)
      }, reviewer);

      await approveScholarship(id, reviewer);
      navigate('/admin/pending');
    } catch (err) {
      setError(err.message || 'Approval failed.');
      setSaving(false);
    }
  };

  return (
    <div className="container main-content" style={{ maxWidth: '900px' }}>
      <Link to="/admin/all-scholarships" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
        <ArrowLeft size={16} /> Back to All Scholarships
      </Link>

      <div className="card">
        <div className="card-header" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className={`badge ${scholarship.status === 'Approved' ? 'badge-success' : scholarship.status === 'Rejected' ? 'badge-danger' : 'badge-pending'}`}>
                Status: {scholarship.status}
              </span>
              {scholarship.isSample && <span className="badge badge-sample">Sample Candidate</span>}
            </div>
            <h1 style={{ fontSize: '1.6rem', color: '#0f172a' }}>Review & Edit Candidate Scholarship</h1>
          </div>

          <StudentCountBadge scholarship={scholarship} />
        </div>

        {successMsg && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', margin: '1rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={16} /> {successMsg}
          </div>
        )}

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', margin: '1rem 0' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSaveOnly} style={{ marginTop: '1.25rem' }}>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label form-label-required">Scholarship Name</label>
              <input
                type="text"
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label form-label-required">Provider / Sponsoring Agency</label>
              <input
                type="text"
                required
                name="provider"
                value={formData.provider}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Full Description</label>
            <textarea
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-textarea"
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label form-label-required">Official Application URL</label>
              <input
                type="url"
                required
                name="officialUrl"
                value={formData.officialUrl}
                onChange={handleChange}
                className="form-input"
              />
              <div className="form-hint">Must be verified safe HTTPS/HTTP URL.</div>
            </div>

            <div className="form-group">
              <label className="form-label">Source / Discovery URL</label>
              <input
                type="url"
                name="sourceUrl"
                value={formData.sourceUrl}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Minimum GPA</label>
              <input
                type="number"
                step="0.01"
                name="minGpa"
                value={formData.minGpa}
                onChange={handleChange}
                className="form-input"
                placeholder="Leave blank for any"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Eligible Category</label>
              <input
                type="text"
                name="eligibleCategory"
                value={formData.eligibleCategory}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. Any, General, OBC, SC, ST"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Eligible Course</label>
              <input
                type="text"
                name="eligibleCourse"
                value={formData.eligibleCourse}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. Any, B.Tech, MBBS"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Max Family Annual Income (₹)</label>
              <input
                type="number"
                name="maxFamilyIncome"
                value={formData.maxFamilyIncome}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. 500000"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Eligible State Name</label>
              <input
                type="text"
                name="eligibleState"
                value={formData.eligibleState}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. Any, Kerala"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Application Deadline</label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Income Certificate Validity Limit (Days)</label>
              <input
                type="number"
                name="incomeCertValidityDays"
                value={formData.incomeCertValidityDays}
                onChange={handleChange}
                className="form-input"
              />
              <div className="form-hint">Used in readiness check 2 (standard: 180 or 365 days).</div>
            </div>

            <div className="form-group">
              <label className="form-label">Review Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-select"
              >
                <option value="Pending">Pending Review</option>
                <option value="Approved">Approved (Public to Students)</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Required Supporting Documents (Comma-Separated)</label>
            <input
              type="text"
              name="requiredDocuments"
              value={formData.requiredDocuments}
              onChange={handleChange}
              className="form-input"
              placeholder="Marksheet, Income Certificate, Aadhaar Card, Passbook"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-secondary"
            >
              <Save size={16} /> Save Changes Only
            </button>

            {formData.status !== 'Approved' && (
              <button
                type="button"
                onClick={handleSaveAndApprove}
                disabled={saving}
                className="btn btn-success"
              >
                <CheckCircle size={16} /> Save & Approve for Students
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
