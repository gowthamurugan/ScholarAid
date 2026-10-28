/**
 * Scholarship Readiness Score Calculator for ScholarAid
 *
 * Evaluates 5 core readiness checks:
 * 1. Profile completeness
 * 2. Income certificate validity against scholarship validity window
 * 3. Bank account linked to Aadhaar
 * 4. Name match across required documents
 * 5. Scholarship deadline has not passed
 *
 * Returns structured advisory readiness score, check states, and pending actions.
 */

export const READINESS_DISCLAIMER =
  'The readiness score is advisory. It is not an eligibility guarantee, document verification, application submission confirmation, or assurance of scholarship approval. Document verification is conducted solely by the respective scholarship granting authority.';

export const APPLICATION_STATUS_DISCLAIMER =
  'Student-reported only. Not verified against portal records.';

/**
 * Checks if a date string is valid and returns a Date object, or null.
 * @param {string|Date} dateStr
 * @returns {Date|null}
 */
export function parseDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Calculates days difference between two dates.
 * @param {Date} dateEarlier
 * @param {Date} dateLater
 * @returns {number}
 */
export function getDaysDifference(dateEarlier, dateLater) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((dateLater.getTime() - dateEarlier.getTime()) / msPerDay);
}

/**
 * Evaluates readiness score for a student and scholarship.
 *
 * @param {Object} student - Student profile
 * @param {Object} scholarship - Scholarship record
 * @param {Date} [referenceDate=new Date()] - Date to evaluate against (defaults to now)
 * @returns {{
 *   score: number,
 *   maxScore: number,
 *   label: string,
 *   isReady: boolean,
 *   checks: Array<{
 *     id: string,
 *     title: string,
 *     passed: boolean,
 *     status: 'Passed' | 'Failed' | 'Missing Information',
 *     reason: string,
 *     action: string
 *   }>,
 *   pendingActions: string[],
 *   advisoryDisclaimer: string
 * }}
 */
export function calculateReadinessScore(student, scholarship, referenceDate = new Date()) {
  const now = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);

  const checks = [];

  // ---------------------------------------------------------
  // Check 1: Student Profile Completeness
  // ---------------------------------------------------------
  const requiredProfileFields = [
    { key: 'fullName', label: 'Full Name' },
    { key: 'email', label: 'Email' },
    { key: 'gpa', label: 'Academic GPA' },
    { key: 'category', label: 'Category' },
    { key: 'course', label: 'Course' },
    { key: 'familyIncome', label: 'Family Annual Income' },
    { key: 'state', label: 'State' },
    { key: 'department', label: 'Department' },
    { key: 'currentYear', label: 'Current Academic Year' },
    { key: 'incomeCertIssueDate', label: 'Income Certificate Issue Date' },
    { key: 'bankLinkedToAadhaar', label: 'Bank Linked to Aadhaar' },
    { key: 'nameMatchesDocuments', label: 'Name Matches Across Documents' }
  ];

  const missingProfileFields = [];
  if (!student) {
    missingProfileFields.push('Profile not created');
  } else {
    for (const field of requiredProfileFields) {
      const val = student[field.key];
      if (val === undefined || val === null || String(val).trim() === '') {
        missingProfileFields.push(field.label);
      }
    }
  }

  const profileComplete = student && missingProfileFields.length === 0;
  checks.push({
    id: 'profile_complete',
    title: 'Student Profile Completeness',
    passed: Boolean(profileComplete),
    status: profileComplete ? 'Passed' : 'Failed',
    reason: profileComplete
      ? 'All required academic and personal profile details are filled.'
      : `Missing fields: ${missingProfileFields.join(', ')}.`,
    action: profileComplete
      ? 'Profile is up to date.'
      : 'Complete all missing fields in your Student Profile page.'
  });

  // ---------------------------------------------------------
  // Check 2: Income Certificate Validity
  // ---------------------------------------------------------
  const validityDays = Number(scholarship?.incomeCertValidityDays || 180);
  const issueDateStr = student?.incomeCertIssueDate;
  const issueDate = parseDate(issueDateStr);

  let certPassed = false;
  let certStatus = 'Failed';
  let certReason = '';
  let certAction = '';

  if (!issueDateStr || !issueDate) {
    certPassed = false;
    certStatus = 'Missing Information';
    certReason = 'Income certificate issue date is not provided in your profile.';
    certAction = 'Enter your certificate issue date in your Student Profile.';
  } else {
    const certAgeInDays = getDaysDifference(issueDate, now);
    if (certAgeInDays < 0) {
      certPassed = false;
      certStatus = 'Failed';
      certReason = 'Income certificate issue date cannot be in the future.';
      certAction = 'Update your certificate issue date with the correct past date.';
    } else if (certAgeInDays <= validityDays) {
      certPassed = true;
      certStatus = 'Passed';
      certReason = `Certificate is ${certAgeInDays} days old (validity limit is ${validityDays} days).`;
      certAction = 'Certificate is currently valid.';
    } else {
      certPassed = false;
      certStatus = 'Failed';
      certReason = `Certificate is ${certAgeInDays} days old, exceeding the ${validityDays}-day limit.`;
      certAction = 'Renew your income certificate with your local revenue authority.';
    }
  }

  checks.push({
    id: 'income_cert_validity',
    title: `Income Certificate Validity (${validityDays} days max)`,
    passed: certPassed,
    status: certStatus,
    reason: certReason,
    action: certAction
  });

  // ---------------------------------------------------------
  // Check 3: Bank Account Linked to Aadhaar
  // ---------------------------------------------------------
  const bankVal = student?.bankLinkedToAadhaar;
  const bankLinked = bankVal === true || String(bankVal).toLowerCase() === 'yes';

  checks.push({
    id: 'bank_aadhaar_linked',
    title: 'Bank Account Linked to Aadhaar (DBT Enabled)',
    passed: Boolean(bankLinked),
    status: bankLinked ? 'Passed' : 'Failed',
    reason: bankLinked
      ? 'Bank account is verified as linked to Aadhaar for Direct Benefit Transfer.'
      : 'Bank account is not indicated as linked to Aadhaar.',
    action: bankLinked
      ? 'No action required.'
      : 'Visit your bank branch or use internet banking to link Aadhaar with NPCI mapping.'
  });

  // ---------------------------------------------------------
  // Check 4: Name Matches Across Documents
  // ---------------------------------------------------------
  const nameVal = student?.nameMatchesDocuments;
  const nameMatches = nameVal === true || String(nameVal).toLowerCase() === 'yes';

  checks.push({
    id: 'name_matches_documents',
    title: 'Name Consistency Across Academic & ID Documents',
    passed: Boolean(nameMatches),
    status: nameMatches ? 'Passed' : 'Failed',
    reason: nameMatches
      ? 'Student name is verified as consistent across Aadhaar, certificates, and records.'
      : 'Student name discrepancies flagged or unconfirmed across documents.',
    action: nameMatches
      ? 'No action required.'
      : 'Ensure name matches character-for-character across 10th marksheet, Aadhaar, and bank account.'
  });

  // ---------------------------------------------------------
  // Check 5: Scholarship Deadline Has Not Passed
  // ---------------------------------------------------------
  const deadlineStr = scholarship?.deadline;
  const deadlineDate = parseDate(deadlineStr);

  let deadlinePassed = false;
  let deadlineStatus = 'Failed';
  let deadlineReason = '';
  let deadlineAction = '';

  if (!deadlineStr || !deadlineDate) {
    deadlinePassed = false;
    deadlineStatus = 'Missing Information';
    deadlineReason = 'Scholarship deadline is missing or unspecified.';
    deadlineAction = 'Check official scholarship portal for accurate deadline.';
  } else {
    // Set deadline to end of day (23:59:59.999) if only date is provided
    const eodDeadline = new Date(deadlineDate);
    eodDeadline.setHours(23, 59, 59, 999);

    if (now.getTime() <= eodDeadline.getTime()) {
      deadlinePassed = true;
      deadlineStatus = 'Passed';
      const daysLeft = Math.max(0, Math.ceil((eodDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      deadlineReason = `Deadline active: ${deadlineStr} (${daysLeft} day(s) remaining).`;
      deadlineAction = 'Prepare and submit your application before the closing date.';
    } else {
      deadlinePassed = false;
      deadlineStatus = 'Failed';
      deadlineReason = `Scholarship deadline passed on ${deadlineStr}.`;
      deadlineAction = 'Applications closed. Check for future cycles or other active scholarships.';
    }
  }

  checks.push({
    id: 'deadline_active',
    title: 'Scholarship Application Deadline Active',
    passed: deadlinePassed,
    status: deadlineStatus,
    reason: deadlineReason,
    action: deadlineAction
  });

  // ---------------------------------------------------------
  // Aggregate Score
  // ---------------------------------------------------------
  const score = checks.filter(c => c.passed).length;
  const pendingActions = checks.filter(c => !c.passed).map(c => `${c.title}: ${c.action}`);

  return {
    score,
    maxScore: 5,
    label: `Ready ${score}/5`,
    isReady: score === 5,
    checks,
    pendingActions,
    advisoryDisclaimer: READINESS_DISCLAIMER
  };
}
