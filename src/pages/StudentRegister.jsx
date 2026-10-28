import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { GraduationCap, UserPlus, AlertCircle, Info } from 'lucide-react';
import { PROFILE_DISCLAIMER } from '../services/profileService.js';

export default function StudentRegister() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
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
  const [error, setError] = useState('');

  if (isAuthenticated) {
    navigate('/dashboard', { replace: true });
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    if (!formData.fullName.trim()) {
      setError('Full Name is required.');
      return;
    }

    if (formData.gpa && (isNaN(Number(formData.gpa)) || Number(formData.gpa) < 0 || Number(formData.gpa) > 10)) {
      setError('Please provide a valid GPA or academic score (e.g. 3.5 or 8.5).');
      return;
    }

    if (formData.familyIncome && isNaN(Number(formData.familyIncome))) {
      setError('Family Annual Income must be a valid number in INR.');
      return;
    }

    setLoading(true);
    try {
      await register(formData.email, formData.password, {
        fullName: formData.fullName,
        gender: formData.gender,
        gpa: formData.gpa,
        category: formData.category,
        course: formData.course,
        familyIncome: formData.familyIncome,
        state: formData.state,
        department: formData.department,
        currentYear: formData.currentYear,
        incomeCertIssueDate: formData.incomeCertIssueDate,
        bankLinkedToAadhaar: formData.bankLinkedToAadhaar === 'Yes',
        nameMatchesDocuments: formData.nameMatchesDocuments === 'Yes'
      });

      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '780px', padding: '3rem 1rem' }}>
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            display: 'inline-flex',
            background: '#eff6ff',
            color: '#2563eb',
            padding: '12px',
            borderRadius: '12px',
            marginBottom: '0.75rem'
          }}>
            <GraduationCap size={32} />
          </div>
          <h2 style={{ fontSize: '1.6rem', color: '#0f172a' }}>Student Registration & Eligibility Profile</h2>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '4px' }}>
            Register your secure account and initialize your academic eligibility profile.
          </p>
        </div>

        {/* Advisory Profile Notice */}
        <div className="disclaimer-banner">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <Info size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#2563eb' }} />
            <span>{PROFILE_DISCLAIMER}</span>
          </div>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Section A: Authentication Credentials */}
          <h3 style={{ fontSize: '1.05rem', color: '#1e293b', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
            Account Credentials
          </h3>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label form-label-required">Student Email Address</label>
              <input
                type="email"
                required
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                placeholder="student@college.ac.in"
              />
            </div>

            <div className="form-group">
              <label className="form-label form-label-required">Full Legal Name</label>
              <input
                type="text"
                required
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="form-input"
                placeholder="As per academic records & Aadhaar"
              />
            </div>

            <div className="form-group">
              <label className="form-label form-label-required">Password</label>
              <input
                type="password"
                required
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                placeholder="Minimum 6 characters"
              />
            </div>

            <div className="form-group">
              <label className="form-label form-label-required">Confirm Password</label>
              <input
                type="password"
                required
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="form-input"
                placeholder="Re-enter password"
              />
            </div>
          </div>

          {/* Section B: Academic & Eligibility Profile */}
          <h3 style={{ fontSize: '1.05rem', color: '#1e293b', margin: '1.5rem 0 1rem 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
            Eligibility Profile Fields
          </h3>

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
                placeholder="e.g. 3.80 or 8.5"
              />
              <div className="form-hint">Used for GPA criteria check.</div>
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
                placeholder="e.g. 350000"
              />
              <div className="form-hint">Gross total family income per year.</div>
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
              <label className="form-label">College Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. Computer Science and Engineering"
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

          {/* Section C: Readiness Checks */}
          <h3 style={{ fontSize: '1.05rem', color: '#1e293b', margin: '1.5rem 0 1rem 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
            Banking & Document Consistency Checks (Readiness Score)
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
                <option value="No">No / Not Yet Confirmed</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label form-label-required">Does Student Name Match Exactly Across Documents?</label>
              <select
                name="nameMatchesDocuments"
                value={formData.nameMatchesDocuments}
                onChange={handleChange}
                className="form-select"
              >
                <option value="Yes">Yes — Exact match on Marksheets, Aadhaar & Passbook</option>
                <option value="No">No / Minor Discrepancy Present</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-block btn-lg"
            style={{ marginTop: '1.5rem' }}
          >
            {loading ? 'Creating Account & Profile...' : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={18} /> Register Student Account
              </span>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#64748b' }}>
          Already registered? <Link to="/login" style={{ fontWeight: 600 }}>Sign in here</Link>
        </div>
      </div>
    </div>
  );
}
