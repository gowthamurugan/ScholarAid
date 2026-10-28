import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AdminNav from '../components/admin/AdminNav.jsx';
import { createScholarship } from '../services/scholarshipService.js';
import { isValidHttpUrl } from '../utils/validators.js';
import {
  Sparkles,
  Search,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Loader2,
  FileText
} from 'lucide-react';

export default function ScholarshipDiscovery() {
  const navigate = useNavigate();

  const [searchTopic, setSearchTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Manual Entry Form State
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualForm, setManualForm] = useState({
    name: '',
    provider: '',
    description: '',
    officialUrl: '',
    sourceUrl: '',
    minGpa: '',
    eligibleCategory: 'Any',
    eligibleCourse: 'B.Tech',
    maxFamilyIncome: '',
    eligibleState: 'Kerala',
    requiredDocuments: 'Marksheet, Income Certificate, Aadhaar Card, Bank Passbook',
    deadline: '',
    incomeCertValidityDays: '180'
  });
  const [manualLoading, setManualLoading] = useState(false);
  const [manualSuccess, setManualSuccess] = useState('');

  const handleAiSearch = async (e) => {
    e.preventDefault();
    if (!searchTopic.trim()) {
      setErrorMessage('Please provide a search topic or criteria.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setStatusMessage('Querying protected server-side search and Gemini structuring function...');
    setCandidates([]);

    try {
      const response = await fetch('/api/discovery/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: searchTopic.trim() })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Server returned error status ${response.status}`);
      }

      const data = await response.json();
      if (!data.candidates || data.candidates.length === 0) {
        setStatusMessage(data.message || 'No candidate scholarships found for this query.');
      } else {
        setCandidates(data.candidates);
        setStatusMessage(
          `Extracted ${data.candidates.length} candidate scholarship(s). Records are saved as 'Pending' in your Review Queue.`
        );
      }
    } catch (err) {
      setErrorMessage(
        err.message.includes('Failed to fetch')
          ? 'Could not connect to the backend discovery service at /api/discovery/search. Ensure the Node server is running on port 5000, or use the manual entry fallback below.'
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setManualSuccess('');

    if (!manualForm.name.trim() || !manualForm.provider.trim()) {
      setErrorMessage('Scholarship name and provider are required.');
      return;
    }

    if (manualForm.officialUrl && !isValidHttpUrl(manualForm.officialUrl)) {
      setErrorMessage('Official application URL must start with http:// or https://');
      return;
    }

    setManualLoading(true);
    try {
      const record = await createScholarship({
        ...manualForm,
        status: 'Pending', // Enforce Pending status for administrative review
        discoveryTimestamp: new Date().toISOString()
      });

      setManualSuccess(`Candidate '${record.name}' added to Pending Review Queue.`);
      setManualForm({
        name: '',
        provider: '',
        description: '',
        officialUrl: '',
        sourceUrl: '',
        minGpa: '',
        eligibleCategory: 'Any',
        eligibleCourse: 'B.Tech',
        maxFamilyIncome: '',
        eligibleState: 'Kerala',
        requiredDocuments: 'Marksheet, Income Certificate, Aadhaar Card, Bank Passbook',
        deadline: '',
        incomeCertValidityDays: '180'
      });
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save manual candidate.');
    } finally {
      setManualLoading(false);
    }
  };

  return (
    <div className="container main-content" style={{ maxWidth: '960px' }}>
      <AdminNav />

      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#7c3aed', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem' }}>
          <Sparkles size={18} /> AUTOMATED CANDIDATE GATHERING
        </div>
        <h1 style={{ fontSize: '1.85rem', color: '#0f172a' }}>AI-Assisted Scholarship Discovery</h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
          Search for candidate scholarships using our protected backend search and Gemini structuring pipeline.
          All gathered candidates are held in the <strong>Pending Review Queue</strong> and require administrator verification before student publication.
        </p>
      </div>

      {/* Mandatory Reliability Notice from Section 9 */}
      <div className="disclaimer-alert">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            <strong>Critical Reliability Mandate:</strong> AI-discovered records are never automatically published to students. Extracted data must be verified against original sources by an administrator before approval. Fabricated URLs or unknown criteria are strictly flagged for review.
          </span>
        </div>
      </div>

      {/* Search Input Card */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleAiSearch}>
          <div className="form-group">
            <label className="form-label form-label-required" style={{ fontWeight: 700 }}>
              Scholarship Discovery Search Topic
            </label>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                required
                value={searchTopic}
                onChange={e => setSearchTopic(e.target.value)}
                placeholder="e.g. Merit-cum-means scholarships for B.Tech students in Kerala, post-matric engineering grants..."
                className="form-input"
                style={{ flex: 1, minWidth: '280px' }}
              />
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ minWidth: '160px' }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Loader2 size={16} className="animate-spin" /> Searching...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={16} /> Execute AI Discovery
                  </span>
                )}
              </button>
            </div>
            <div className="form-hint">
              Query will invoke the protected server function (`/api/discovery/search`) with web search and Gemini extraction.
            </div>
          </div>
        </form>

        {/* Status / Feedback message */}
        {statusMessage && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} /> {statusMessage}
          </div>
        )}

        {errorMessage && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', marginTop: '1rem' }}>
            {errorMessage}
          </div>
        )}
      </div>

      {/* Discovered Candidates Result Preview */}
      {candidates.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#0f172a' }}>
              Newly Discovered Candidates ({candidates.length})
            </h2>
            <Link to="/admin/pending" className="btn btn-secondary btn-sm">
              Go to Pending Review Queue
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {candidates.map((c, i) => (
              <div key={i} className="card" style={{ borderLeft: '4px solid #7c3aed' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className="badge badge-pending">Pending Review</span>
                    <h3 style={{ fontSize: '1.15rem', color: '#0f172a', margin: '4px 0' }}>{c.name}</h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Provider: {c.provider}</p>
                  </div>
                  <Link to="/admin/pending" className="btn btn-primary btn-sm">
                    Review in Queue
                  </Link>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.5rem' }}>{c.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Entry Fallback Option */}
      <div className="card" style={{ borderTop: '4px solid #0f172a' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', color: '#0f172a' }}>Manual Scholarship Entry Fallback</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Add a candidate scholarship manually if AI search is unavailable or an official gazette notification was received offline.
            </p>
          </div>
          <button
            onClick={() => setShowManualForm(!showManualForm)}
            className="btn btn-secondary btn-sm"
          >
            {showManualForm ? 'Hide Form' : 'Open Entry Form'}
          </button>
        </div>

        {manualSuccess && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} /> {manualSuccess}
          </div>
        )}

        {showManualForm && (
          <form onSubmit={handleManualSubmit} style={{ marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label form-label-required">Scholarship Title</label>
                <input
                  type="text"
                  required
                  value={manualForm.name}
                  onChange={e => setManualForm({ ...manualForm, name: e.target.value })}
                  className="form-input"
                  placeholder="e.g. Higher Education Directorate Special Grant"
                />
              </div>

              <div className="form-group">
                <label className="form-label form-label-required">Provider / Sponsoring Body</label>
                <input
                  type="text"
                  required
                  value={manualForm.provider}
                  onChange={e => setManualForm({ ...manualForm, provider: e.target.value })}
                  className="form-input"
                  placeholder="e.g. Directorate of Collegiate Education"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description & Objective</label>
              <textarea
                rows={2}
                value={manualForm.description}
                onChange={e => setManualForm({ ...manualForm, description: e.target.value })}
                className="form-textarea"
                placeholder="Eligibility summary and scholarship grant details"
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label form-label-required">Official Application URL</label>
                <input
                  type="url"
                  required
                  value={manualForm.officialUrl}
                  onChange={e => setManualForm({ ...manualForm, officialUrl: e.target.value })}
                  className="form-input"
                  placeholder="https://scholarships.gov.in"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Source Gazette / Reference URL</label>
                <input
                  type="url"
                  value={manualForm.sourceUrl}
                  onChange={e => setManualForm({ ...manualForm, sourceUrl: e.target.value })}
                  className="form-input"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label">Minimum GPA</label>
                <input
                  type="number"
                  step="0.1"
                  value={manualForm.minGpa}
                  onChange={e => setManualForm({ ...manualForm, minGpa: e.target.value })}
                  className="form-input"
                  placeholder="e.g. 3.2"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Eligible Category</label>
                <select
                  value={manualForm.eligibleCategory}
                  onChange={e => setManualForm({ ...manualForm, eligibleCategory: e.target.value })}
                  className="form-select"
                >
                  <option value="Any">Any / Open to All</option>
                  <option value="General">General</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="EWS">EWS</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Eligible Course</label>
                <select
                  value={manualForm.eligibleCourse}
                  onChange={e => setManualForm({ ...manualForm, eligibleCourse: e.target.value })}
                  className="form-select"
                >
                  <option value="Any">Any / All Degrees</option>
                  <option value="B.Tech">B.Tech</option>
                  <option value="B.Sc">B.Sc</option>
                  <option value="MBBS">MBBS</option>
                  <option value="BCA">BCA</option>
                  <option value="M.Tech">M.Tech</option>
                  <option value="MCA">MCA</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Max Family Income (₹)</label>
                <input
                  type="number"
                  value={manualForm.maxFamilyIncome}
                  onChange={e => setManualForm({ ...manualForm, maxFamilyIncome: e.target.value })}
                  className="form-input"
                  placeholder="e.g. 450000"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Eligible State</label>
                <select
                  value={manualForm.eligibleState}
                  onChange={e => setManualForm({ ...manualForm, eligibleState: e.target.value })}
                  className="form-select"
                >
                  <option value="Any">Any State</option>
                  <option value="Kerala">Kerala</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Delhi">Delhi</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Application Deadline</label>
                <input
                  type="date"
                  value={manualForm.deadline}
                  onChange={e => setManualForm({ ...manualForm, deadline: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                type="submit"
                disabled={manualLoading}
                className="btn btn-primary"
              >
                {manualLoading ? 'Saving...' : 'Add to Pending Queue for Review'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
