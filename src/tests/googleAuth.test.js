import { describe, it, expect, beforeEach } from 'vitest';
import { loginWithGoogle, getUserProfile } from '../services/authService.js';
import { initializeMockStorage } from '../services/mockStorage.js';

describe('Google ID Authentication', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    initializeMockStorage();
  });

  it('signs in a student using Google ID credentials and creates their student profile', async () => {
    const googleAccount = {
      email: 'aisha.student@gmail.com',
      name: 'Aisha Khan',
      gender: 'Female',
      category: 'OBC'
    };

    const result = await loginWithGoogle('student', googleAccount);

    expect(result.user).toBeDefined();
    expect(result.user.email).toBe('aisha.student@gmail.com');
    expect(result.profile.role).toBe('student');
    expect(result.profile.fullName).toBe('Aisha Khan');
    expect(result.profile.authProvider).toBe('google');
    expect(result.profile.state).toBe('Kerala');

    // Verify stored in mock database
    const stored = await getUserProfile(result.user.uid);
    expect(stored).toBeDefined();
    expect(stored.email).toBe('aisha.student@gmail.com');
  });

  it('signs in an administrator using Google ID and grants admin privileges', async () => {
    const adminAccount = {
      email: 'admin.officer@scholaraid.edu',
      name: 'Dr. Ramesh Nair'
    };

    const result = await loginWithGoogle('admin', adminAccount);

    expect(result.user).toBeDefined();
    expect(result.user.email).toBe('admin.officer@scholaraid.edu');
    expect(result.profile.role).toBe('admin');
    expect(result.profile.fullName).toBe('Dr. Ramesh Nair');
    expect(result.profile.authProvider).toBe('google');
  });
});
