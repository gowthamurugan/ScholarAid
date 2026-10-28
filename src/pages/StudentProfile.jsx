import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { updateStudentProfile, PROFILE_DISCLAIMER } from '../services/profileService.js';
import { Save, AlertCircle, CheckCircle, Info, ShieldCheck, User } from 'lucide-react';
import LoadingState from '../components/common/LoadingState.jsx';

export default function StudentProfile() {
  const { user, profile, refreshProfile } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    gender: 'Female',
    gpa: '',
    category: 'General',
    course: 'B.Tech',
    familyIncome: '',
    state: 'Kerala',
    department: '',
    currentYear: '1st Year',
    incomeCertIssueDate: '',
    bankLinkedToAadhaar: 'Yes',
    nameMatchesDocuments: 'Yes'
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Pre-fill existing saved profile values
  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        email: profile.email || user?.email || '',
        gender: profile.gender || 'Female',
        gpa: profile.gpa || '',
        category: profile.category || 'General',
        course: profile.course || 'B.Tech',
        familyIncome: profile.familyIncome || '',
        state: profile.state || 'Kerala',
        department: profile.department || '',
        currentYear: profile.currentYear || '1st Year',
        incomeCertIssueDate: profile.incomeCertIssueDate || '',
        bankLinkedToAadhaar: profile.bankLinkedToAadhaar ? 'Yes' : 'No',
        nameMatchesDocuments: profile.nameMatchesDocuments ? 'Yes' : 'No'
      });
    }
  }, [profile, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.fullName.trim()) {
      setErrorMsg('Full Name is required.');
      return;
    }

    if (formData.gpa && (isNaN(Number(formData.gpa)) || Number(formData.gpa) < 0 || Number(formData.gpa) > 10)) {
      setErrorMsg('Please enter a valid numeric GPA between 0.0 and 10.0.');
      return;
    }

    if (formData.familyIncome && isNaN(Number(formData.familyIncome))) {
      setErrorMsg('Family Annual Income must be a valid number.');
      return;
    }

    setLoading(true);
    try {
      await updateStudentProfile(user.uid, {
        fullName: formData.fullName.trim(),
        gender: formData.gender,
        gpa: formData.gpa ? String(formData.gpa).trim() : '',
        category: formData.category,
        course: formData.course,
        familyIncome: formData.familyIncome ? String(formData.familyIncome).trim() : '',
        state: formData.state,
        department: formData.department.trim(),
        currentYear: formData.currentYear,
        incomeCertIssueDate: formData.incomeCertIssueDate,
        bankLinkedToAadhaar: formData.bankLinkedToAadhaar === 'Yes',
        nameMatchesDocuments: formData.nameMatchesDocuments === 'Yes'
      });

      await refreshProfile();
      setSuccessMsg('Your student profile details have been saved successfully.');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container main-content" style={{ maxWidth: '840px' }}>
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Student Academic & Eligibility Profile</h2>
            <p className="card-subtitle">
              Maintain your self-reported profile details used for deterministic eligibility and readiness calculations.
            </p>
          </div>
          <div style={{ background: '#f1f5f9', padding: '8px', borderRadius: '50%' }}>
            <User size={24} style={{ color: '#475569' }} />
          </div>
        </div>

        {/* Mandatory Profile Disclaimer */}
        <div className="disclaimer-banner">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <Info size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#2563eb' }} />
            <span>{PROFILE_DISCLAIMER}</span>
          </div>
        </div>

        {successMsg && (
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#16a34a',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            fontSize: '0.875rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            fontSize: '0.875rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Section: Academic Details */}
          <h3 style={{ fontSize: '1.05rem', color: '#1e293b', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
            Personal & Academic Information
          </h3>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label form-label-required">Full Legal Name</label>
              <input
                type="text"
                required
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="form-input"
                placeholder="Student Name as on official certificates"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address (Registered)</label>
              <input
                type="email"
                disabled
                value={formData.email}
                className="form-input"
                style={{ background: '#f8fafc', color: '#64748b' }}
              />
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label form-label-required">Academic GPA / Score</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                required
                name="gpa"
                value={formData.gpa}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. 3.85"
              />
            </div>

            <div className="form-group">
              <label className="form-label form-label-required">Social Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="form-select"
              >
                <option value="General">General</option>
                <option value="OBC">OBC</option>
                <option value="BC">BC</option>
                <option value="MBC">MBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
                <option value="EWS">EWS</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label form-label-required">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="form-select"
              >
                <option value="Female">Female (Women)</option>
                <option value="Male">Male (Men)</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label form-label-required">Course / Degree</label>
              <select
                name="course"
                value={formData.course}
                onChange={handleChange}
                className="form-select"
              >
                <option value="B.Tech">B.Tech / B.E.</option>
                <option value="B.Sc">B.Sc</option>
                <option value="MBBS">MBBS / Healthcare</option>
                <option value="BCA">BCA / IT</option>
                <option value="M.Tech">M.Tech / Post-grad</option>
                <option value="MCA">MCA</option>
                <option value="Other">Other Degree</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label form-label-required">Family Annual Income (₹)</label>
              <input
                type="number"
                min="0"
                required
                name="familyIncome"
                value={formData.familyIncome}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. 320000"
              />
            </div>

            <div className="form-group">
              <label className="form-label form-label-required">State Name</label>
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="form-select"
              >
                <option value="Kerala">Kerala</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Delhi">Delhi</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
                <option value="Other">Other State</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label form-label-required">Current Academic Year</label>
              <select
                name="currentYear"
                value={formData.currentYear}
                onChange={handleChange}
                className="form-select"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. Mechanical Engineering"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Income Certificate Issue Date</label>
              <input
                type="date"
                name="incomeCertIssueDate"
                value={formData.incomeCertIssueDate}
                onChange={handleChange}
                className="form-input"
              />
              <div className="form-hint">Evaluated against the scholarship's validity period.</div>
            </div>
          </div>

          {/* Section: Readiness Checks */}
          <h3 style={{ fontSize: '1.05rem', color: '#1e293b', margin: '1.5rem 0 1rem 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
            Banking & Document Readiness Declarations
          </h3>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label form-label-required">Is Bank Account Linked to Aadhaar (DBT)?</label>
              <select
                name="bankLinkedToAadhaar"
                value={formData.bankLinkedToAadhaar}
                onChange={handleChange}
                className="form-select"
              >
                <option value="Yes">Yes — Aadhaar Seeded with NPCI</option>
                <option value="No">No / Unconfirmed</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label form-label-required">Does Name Match Across Academic & Identity Documents?</label>
              <select
                name="nameMatchesDocuments"
                value={formData.nameMatchesDocuments}
                onChange={handleChange}
                className="form-select"
              >
                <option value="Yes">Yes — Character-by-character consistency</option>
                <option value="No">No / Discrepancy Flagged</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
            >
              {loading ? 'Saving Profile...' : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Save size={18} /> Save Profile Changes
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
