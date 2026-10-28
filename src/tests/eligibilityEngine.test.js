import { describe, it, expect } from 'vitest';
import { evaluateEligibility, normalizeText, isAny } from '../utils/eligibilityEngine.js';

describe('Centralized Eligibility Engine', () => {
  const baseScholarship = {
    id: 'sch-101',
    name: 'National Merit STEM Scholarship',
    minGpa: 3.5,
    eligibleCategory: 'General',
    eligibleCourse: 'B.Tech',
    maxFamilyIncome: 450000,
    eligibleState: 'Kerala',
    status: 'Approved'
  };

  const eligibleStudent = {
    uid: 'stud-1',
    fullName: 'Ananya Sharma',
    gpa: 3.8,
    category: 'General',
    course: 'B.Tech',
    familyIncome: 300000,
    state: 'Kerala'
  };

  // Test 1: Student meets all criteria
  it('Case 1: Student meets all criteria -> status Eligible, eligible: true', () => {
    const result = evaluateEligibility(eligibleStudent, baseScholarship);
    expect(result.status).toBe('Eligible');
    expect(result.eligible).toBe(true);
    expect(result.failedCriteria).toHaveLength(0);
    expect(result.missingFields).toHaveLength(0);
    expect(result.passedCriteria).toContain('gpa');
    expect(result.passedCriteria).toContain('category');
    expect(result.passedCriteria).toContain('course');
    expect(result.passedCriteria).toContain('familyIncome');
    expect(result.passedCriteria).toContain('state');
  });

  // Test 2: GPA is below the minimum
  it('Case 2: GPA is below the minimum -> fails with specific reason', () => {
    const student = { ...eligibleStudent, gpa: 3.2 };
    const result = evaluateEligibility(student, baseScholarship);
    expect(result.status).toBe('Not eligible');
    expect(result.eligible).toBe(false);
    expect(result.failedCriteria).toContain('gpa');
    expect(result.reasons).toContain('Your GPA is below the minimum required GPA.');
  });

  // Test 3: Category does not match
  it('Case 3: Category does not match -> fails with specific reason', () => {
    const student = { ...eligibleStudent, category: 'OBC' };
    const result = evaluateEligibility(student, baseScholarship);
    expect(result.status).toBe('Not eligible');
    expect(result.eligible).toBe(false);
    expect(result.failedCriteria).toContain('category');
    expect(result.reasons).toContain('Your category does not match this scholarship.');
  });

  // Test 4: Course does not match
  it('Case 4: Course does not match -> fails with specific reason', () => {
    const student = { ...eligibleStudent, course: 'B.Sc' };
    const result = evaluateEligibility(student, baseScholarship);
    expect(result.status).toBe('Not eligible');
    expect(result.eligible).toBe(false);
    expect(result.failedCriteria).toContain('course');
    expect(result.reasons).toContain('Your course does not match the eligible course.');
  });

  // Test 5: Family income exceeds the maximum
  it('Case 5: Family income exceeds the maximum -> fails with specific reason', () => {
    const student = { ...eligibleStudent, familyIncome: 600000 };
    const result = evaluateEligibility(student, baseScholarship);
    expect(result.status).toBe('Not eligible');
    expect(result.eligible).toBe(false);
    expect(result.failedCriteria).toContain('familyIncome');
    expect(result.reasons).toContain('Your family income exceeds the permitted limit.');
  });

  // Test 6: State does not match
  it('Case 6: State does not match -> fails with specific reason', () => {
    const student = { ...eligibleStudent, state: 'Tamil Nadu' };
    const result = evaluateEligibility(student, baseScholarship);
    expect(result.status).toBe('Not eligible');
    expect(result.eligible).toBe(false);
    expect(result.failedCriteria).toContain('state');
    expect(result.reasons).toContain("Your state does not match the scholarship's eligible state.");
  });

  // Test 7: Multiple criteria fail
  it('Case 7: Multiple criteria fail -> returns all failure reasons', () => {
    const student = {
      ...eligibleStudent,
      gpa: 2.5,
      category: 'SC',
      familyIncome: 800000
    };
    const result = evaluateEligibility(student, baseScholarship);
    expect(result.status).toBe('Not eligible');
    expect(result.eligible).toBe(false);
    expect(result.failedCriteria).toEqual(expect.arrayContaining(['gpa', 'category', 'familyIncome']));
    expect(result.reasons).toContain('Your GPA is below the minimum required GPA.');
    expect(result.reasons).toContain('Your category does not match this scholarship.');
    expect(result.reasons).toContain('Your family income exceeds the permitted limit.');
  });

  // Test 8: One or more student profile fields are missing
  it('Case 8: Missing profile fields -> Cannot determine eligibility with missing list', () => {
    const incompleteStudent = {
      uid: 'stud-2',
      fullName: 'Rahul K',
      // gpa missing
      category: 'General',
      // course missing
      familyIncome: null,
      state: ''
    };
    const result = evaluateEligibility(incompleteStudent, baseScholarship);
    expect(result.status).toBe('Cannot determine eligibility');
    expect(result.eligible).toBe(false);
    expect(result.missingFields).toEqual(expect.arrayContaining(['gpa', 'course', 'familyIncome', 'state']));
  });

  // Test 9: A criterion is set to "Any"
  it('Case 9: Criteria set to Any -> any category, course, or state passes', () => {
    const openScholarship = {
      ...baseScholarship,
      eligibleCategory: 'Any',
      eligibleCourse: 'Any',
      eligibleState: 'All'
    };
    const studentDiffCategory = {
      ...eligibleStudent,
      category: 'OBC',
      course: 'MBBS',
      state: 'Maharashtra'
    };
    const result = evaluateEligibility(studentDiffCategory, openScholarship);
    expect(result.status).toBe('Eligible');
    expect(result.eligible).toBe(true);
    expect(result.passedCriteria).toContain('category');
    expect(result.passedCriteria).toContain('course');
    expect(result.passedCriteria).toContain('state');
  });

  // Test 10: Invalid numeric values are provided
  it('Case 10: Invalid numeric values (NaN strings) -> properly flagged as missing/invalid', () => {
    const invalidNumericStudent = {
      ...eligibleStudent,
      gpa: 'not-a-number',
      familyIncome: 'five-lakhs'
    };
    const result = evaluateEligibility(invalidNumericStudent, baseScholarship);
    expect(result.status).toBe('Cannot determine eligibility');
    expect(result.eligible).toBe(false);
    expect(result.missingFields).toContain('gpa');
    expect(result.missingFields).toContain('familyIncome');
  });
});
