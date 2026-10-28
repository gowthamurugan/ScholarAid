import { describe, it, expect } from 'vitest';
import { calculateReadinessScore, READINESS_DISCLAIMER } from '../utils/readinessCalculator.js';

describe('Scholarship Readiness Score Calculator', () => {
  // Use a fixed reference date for tests: 2026-10-22
  const refDate = new Date('2026-10-22T10:00:00Z');

  const fullStudentProfile = {
    fullName: 'Ananya Sharma',
    email: 'ananya@example.com',
    gpa: '3.8',
    category: 'General',
    course: 'B.Tech Computer Science',
    familyIncome: '300000',
    state: 'Kerala',
    department: 'Computer Science and Engineering',
    currentYear: '3rd Year',
    incomeCertIssueDate: '2026-08-01', // ~82 days ago (< 180 days)
    bankLinkedToAadhaar: true,
    nameMatchesDocuments: true
  };

  const activeScholarship = {
    id: 'sch-101',
    name: 'National STEM Merit Fellowship',
    deadline: '2026-11-30', // in future
    incomeCertValidityDays: 180
  };

  // Test 1: All five checks pass
  it('Case 1: All five checks pass -> Ready 5/5, isReady: true', () => {
    const res = calculateReadinessScore(fullStudentProfile, activeScholarship, refDate);
    expect(res.score).toBe(5);
    expect(res.maxScore).toBe(5);
    expect(res.label).toBe('Ready 5/5');
    expect(res.isReady).toBe(true);
    expect(res.pendingActions).toHaveLength(0);
    expect(res.advisoryDisclaimer).toBe(READINESS_DISCLAIMER);
  });

  // Test 2: One check fails (e.g. Bank not linked to Aadhaar)
  it('Case 2: One check fails (bankLinkedToAadhaar false) -> Ready 4/5', () => {
    const student = { ...fullStudentProfile, bankLinkedToAadhaar: false };
    const res = calculateReadinessScore(student, activeScholarship, refDate);
    expect(res.score).toBe(4);
    expect(res.label).toBe('Ready 4/5');
    expect(res.isReady).toBe(false);
    const bankCheck = res.checks.find(c => c.id === 'bank_aadhaar_linked');
    expect(bankCheck.passed).toBe(false);
    expect(res.pendingActions.length).toBe(1);
  });

  // Test 3: Multiple checks fail
  it('Case 3: Multiple checks fail (name mismatch and bank unlinked) -> Ready 3/5', () => {
    const student = {
      ...fullStudentProfile,
      bankLinkedToAadhaar: false,
      nameMatchesDocuments: false
    };
    const res = calculateReadinessScore(student, activeScholarship, refDate);
    expect(res.score).toBe(3);
    expect(res.label).toBe('Ready 3/5');
    expect(res.isReady).toBe(false);
    expect(res.pendingActions.length).toBe(2);
  });

  // Test 4: Income certificate date is missing
  it('Case 4: Income certificate date is missing -> cert check fails, Missing Information', () => {
    const student = { ...fullStudentProfile, incomeCertIssueDate: '' };
    const res = calculateReadinessScore(student, activeScholarship, refDate);
    const certCheck = res.checks.find(c => c.id === 'income_cert_validity');
    expect(certCheck.passed).toBe(false);
    expect(certCheck.status).toBe('Missing Information');
  });

  // Test 5: Income certificate is older than allowed validity period
  it('Case 5: Income certificate is older than allowed validity limit -> fails with expiration note', () => {
    // Issued on 2025-10-01 (over 380 days before refDate 2026-10-22)
    const student = { ...fullStudentProfile, incomeCertIssueDate: '2025-10-01' };
    const res = calculateReadinessScore(student, activeScholarship, refDate);
    const certCheck = res.checks.find(c => c.id === 'income_cert_validity');
    expect(certCheck.passed).toBe(false);
    expect(certCheck.reason).toContain('exceeding the 180-day limit');
  });

  // Test 6: Scholarship deadline has passed
  it('Case 6: Scholarship deadline has passed -> deadline check fails', () => {
    const expiredScholarship = {
      ...activeScholarship,
      deadline: '2026-10-01' // in the past relative to 2026-10-22
    };
    const res = calculateReadinessScore(fullStudentProfile, expiredScholarship, refDate);
    const deadlineCheck = res.checks.find(c => c.id === 'deadline_active');
    expect(deadlineCheck.passed).toBe(false);
    expect(deadlineCheck.reason).toContain('Scholarship deadline passed on 2026-10-01');
  });

  // Test 7: Required profile information is missing
  it('Case 7: Required profile info is missing (e.g. course and department missing) -> profile check fails', () => {
    const incompleteStudent = {
      ...fullStudentProfile,
      course: '',
      department: null
    };
    const res = calculateReadinessScore(incompleteStudent, activeScholarship, refDate);
    const profileCheck = res.checks.find(c => c.id === 'profile_complete');
    expect(profileCheck.passed).toBe(false);
    expect(profileCheck.reason).toContain('Missing fields');
  });

  // Test 8: Dates at validity boundaries are handled consistently
  it('Case 8: Exact validity boundary check -> 180 days is valid, 181 days is expired', () => {
    // 180 days before 2026-10-22 is 2026-04-25
    const exact180Student = { ...fullStudentProfile, incomeCertIssueDate: '2026-04-25' };
    const res180 = calculateReadinessScore(exact180Student, activeScholarship, refDate);
    const certCheck180 = res180.checks.find(c => c.id === 'income_cert_validity');
    expect(certCheck180.passed).toBe(true);

    // 182 days before
    const expired182Student = { ...fullStudentProfile, incomeCertIssueDate: '2026-04-22' };
    const res182 = calculateReadinessScore(expired182Student, activeScholarship, refDate);
    const certCheck182 = res182.checks.find(c => c.id === 'income_cert_validity');
    expect(certCheck182.passed).toBe(false);
  });
});
