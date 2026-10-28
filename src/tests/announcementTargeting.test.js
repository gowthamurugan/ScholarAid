import { describe, it, expect, beforeEach } from 'vitest';
import { matchesTargetType } from '../services/announcementService.js';
import { getApprovedScholarships, approveScholarship } from '../services/scholarshipService.js';
import { initializeMockStorage, getMockItem, setMockItem, SCHOLARSHIPS_KEY } from '../services/mockStorage.js';

describe('matchesTargetType', () => {
  const femaleObcStudent = {
    fullName: 'Ananya Sharma',
    gender: 'Female',
    category: 'OBC'
  };

  const maleScStudent = {
    fullName: 'Karthik S',
    gender: 'Male',
    category: 'SC'
  };

  const femaleBcStudent = {
    fullName: 'Priya Nair',
    gender: 'Female',
    category: 'BC'
  };

  const femaleMbcStudent = {
    fullName: 'Meera Rajan',
    gender: 'Female',
    category: 'MBC'
  };

  const maleStStudent = {
    fullName: 'Suresh Kumar',
    gender: 'Male',
    category: 'ST'
  };

  it('matches all when target is empty or All or All Students', () => {
    expect(matchesTargetType(femaleObcStudent, [])).toBe(true);
    expect(matchesTargetType(femaleObcStudent, ['All'])).toBe(true);
    expect(matchesTargetType(femaleObcStudent, ['All Students'])).toBe(true);
    expect(matchesTargetType(maleScStudent, ['All Eligible'])).toBe(true);
  });

  it('matches Women target correctly', () => {
    expect(matchesTargetType(femaleObcStudent, ['Women'])).toBe(true);
    expect(matchesTargetType(femaleBcStudent, ['Women'])).toBe(true);
    expect(matchesTargetType(femaleMbcStudent, ['Women'])).toBe(true);
    expect(matchesTargetType(maleScStudent, ['Women'])).toBe(false);
    expect(matchesTargetType(maleStStudent, ['Women'])).toBe(false);
  });

  it('matches Men target correctly', () => {
    expect(matchesTargetType(maleScStudent, ['Men'])).toBe(true);
    expect(matchesTargetType(maleStStudent, ['Men'])).toBe(true);
    expect(matchesTargetType(femaleObcStudent, ['Men'])).toBe(false);
  });

  it('matches OBC target correctly', () => {
    expect(matchesTargetType(femaleObcStudent, ['OBC'])).toBe(true);
    expect(matchesTargetType(maleScStudent, ['OBC'])).toBe(false);
  });

  it('matches BC and MBC targets correctly', () => {
    expect(matchesTargetType(femaleBcStudent, ['BC'])).toBe(true);
    expect(matchesTargetType(femaleMbcStudent, ['MBC'])).toBe(true);
    expect(matchesTargetType(maleStStudent, ['BC'])).toBe(false);
  });

  it('matches SC and ST targets correctly', () => {
    expect(matchesTargetType(maleScStudent, ['SC'])).toBe(true);
    expect(matchesTargetType(maleStStudent, ['ST'])).toBe(true);
    expect(matchesTargetType(femaleObcStudent, ['SC'])).toBe(false);
  });

  it('matches multiple targets (OR condition across selected criteria)', () => {
    expect(matchesTargetType(maleScStudent, ['SC', 'ST'])).toBe(true);
    expect(matchesTargetType(maleStStudent, ['SC', 'ST'])).toBe(true);
    expect(matchesTargetType(femaleObcStudent, ['SC', 'ST'])).toBe(false);
    expect(matchesTargetType(femaleObcStudent, ['Women', 'SC'])).toBe(true);
  });
});

describe('Targeted Approved Scholarships Visibility', () => {
  beforeEach(() => {
    initializeMockStorage();
  });

  it('initially has 0 approved scholarships before admin review', async () => {
    const initialApproved = await getApprovedScholarships();
    expect(initialApproved.length).toBe(0);
  });

  it('makes approved scholarship visible only to targeted student types', async () => {
    const studentBC = {
      uid: 'student-bc-1',
      role: 'student',
      fullName: 'Suresh BC',
      category: 'BC',
      gender: 'Male'
    };

    const studentGeneral = {
      uid: 'student-gen-1',
      role: 'student',
      fullName: 'Rahul General',
      category: 'General',
      gender: 'Male'
    };

    // Approve scholarship targeting BC and MBC
    await approveScholarship('nsp-sc-03', 'Administrator', ['BC', 'MBC']);

    // Admin sees it (no studentProfile passed)
    const adminApproved = await getApprovedScholarships();
    expect(adminApproved.some(s => s.id === 'nsp-sc-03')).toBe(true);

    // BC student sees it
    const bcApproved = await getApprovedScholarships(studentBC);
    expect(bcApproved.some(s => s.id === 'nsp-sc-03')).toBe(true);

    // General student does NOT see it
    const genApproved = await getApprovedScholarships(studentGeneral);
    expect(genApproved.some(s => s.id === 'nsp-sc-03')).toBe(false);
  });

  it('makes scholarship visible to all students when targeted to All Students', async () => {
    const studentGeneral = {
      uid: 'student-gen-2',
      role: 'student',
      fullName: 'Aman General',
      category: 'General',
      gender: 'Male'
    };

    await approveScholarship('nsp-csss-01', 'Administrator', ['All Students']);

    const genApproved = await getApprovedScholarships(studentGeneral);
    expect(genApproved.some(s => s.id === 'nsp-csss-01')).toBe(true);
  });
});
