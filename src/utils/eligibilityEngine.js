/**
 * Centralized Eligibility Engine for ScholarAid
 *
 * Implements a single, reusable, pure JavaScript evaluation function
 * used consistently across:
 * - Approved Scholarships listings
 * - Eligible Scholarships filter
 * - Administrator eligibility impact counters
 * - Announcement recipient targeting
 */

/**
 * Normalizes text for comparison (trim, lowercase, collapses whitespace).
 * @param {string|any} text
 * @returns {string}
 */
export function normalizeText(text) {
  if (text === null || text === undefined) return '';
  return String(text).trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Checks if a criterion value represents an unrestricted "Any" condition.
 * @param {string|any} value
 * @returns {boolean}
 */
export function isAny(value) {
  if (value === null || value === undefined) return true;
  const normalized = normalizeText(value);
  return (
    normalized === '' ||
    normalized === 'any' ||
    normalized === 'all' ||
    normalized === 'any category' ||
    normalized === 'any course' ||
    normalized === 'all states' ||
    normalized === 'any state' ||
    normalized === 'all courses' ||
    normalized === 'open to all'
  );
}

/**
 * Checks whether a student profile matches the selected target groups (OBC, BC, MBC, SC, ST, women, men, etc.).
 * @param {Object} student - Student profile object
 * @param {string[]} targetTypes - Array of target strings
 * @returns {boolean}
 */
export function matchesTargetType(student, targetTypes = []) {
  if (!targetTypes || targetTypes.length === 0 || targetTypes.includes('All') || targetTypes.includes('All Students') || targetTypes.includes('All Eligible')) {
    return true;
  }
  if (!student) return false;

  const normalizedTargets = targetTypes.map(t => String(t).trim().toLowerCase());
  const studentCategory = String(student.category || '').trim().toLowerCase();
  const studentGender = String(student.gender || '').trim().toLowerCase();

  // Check gender matching
  const targetWomen = normalizedTargets.includes('women') || normalizedTargets.includes('womens') || normalizedTargets.includes('female');
  const targetMen = normalizedTargets.includes('men') || normalizedTargets.includes('mens') || normalizedTargets.includes('male');

  if (targetWomen && (studentGender === 'female' || studentGender === 'women')) {
    return true;
  }
  if (targetMen && (studentGender === 'male' || studentGender === 'men')) {
    return true;
  }

  // Check social category matching (OBC, BC, MBC, SC, ST, General, EWS)
  return normalizedTargets.some(target => {
    if (target === 'obc' && (studentCategory === 'obc' || studentCategory === 'bc' || studentCategory === 'mbc')) return true;
    if (target === 'bc' && (studentCategory === 'bc' || studentCategory === 'obc')) return true;
    if (target === 'mbc' && (studentCategory === 'mbc' || studentCategory === 'obc')) return true;
    if (target === 'sc' && studentCategory === 'sc') return true;
    if (target === 'st' && studentCategory === 'st') return true;
    if (target === 'general' && studentCategory === 'general') return true;
    if (target === 'ews' && studentCategory === 'ews') return true;
    return studentCategory === target;
  });
}

/**
 * Evaluates scholarship eligibility for a given student profile against scholarship criteria.
 *
 * @param {Object} student - Student profile object
 * @param {Object} scholarship - Scholarship record object
 * @returns {{
 *   status: 'Eligible' | 'Not eligible' | 'Cannot determine eligibility',
 *   eligible: boolean,
 *   passedCriteria: string[],
 *   failedCriteria: string[],
 *   missingFields: string[],
 *   reasons: string[]
 * }}
 */
export function evaluateEligibility(student, scholarship) {
  const missingFields = [];
  const passedCriteria = [];
  const failedCriteria = [];
  const reasons = [];

  // Guard against missing inputs
  if (!scholarship || typeof scholarship !== 'object') {
    return {
      status: 'Cannot determine eligibility',
      eligible: false,
      passedCriteria: [],
      failedCriteria: ['scholarship'],
      missingFields: ['scholarship'],
      reasons: ['Scholarship details are missing or malformed.']
    };
  }

  if (!student || typeof student !== 'object') {
    return {
      status: 'Cannot determine eligibility',
      eligible: false,
      passedCriteria: [],
      failedCriteria: ['student_profile'],
      missingFields: ['student_profile'],
      reasons: ['Student profile is missing. Please sign in and complete your profile.']
    };
  }

  // ---------------------------------------------------------
  // 1. GPA Evaluation
  // ---------------------------------------------------------
  const minGpa = scholarship.minGpa !== undefined && scholarship.minGpa !== null && scholarship.minGpa !== ''
    ? Number(scholarship.minGpa)
    : null;

  if (minGpa !== null && !isNaN(minGpa) && minGpa > 0) {
    if (student.gpa === undefined || student.gpa === null || student.gpa === '') {
      missingFields.push('gpa');
      reasons.push('GPA is missing in your student profile.');
    } else {
      const studentGpa = Number(student.gpa);
      if (isNaN(studentGpa)) {
        missingFields.push('gpa');
        reasons.push('Student GPA must be a valid number.');
      } else if (studentGpa >= minGpa) {
        passedCriteria.push('gpa');
      } else {
        failedCriteria.push('gpa');
        reasons.push('Your GPA is below the minimum required GPA.');
      }
    }
  } else {
    // No minimum GPA restriction specified
    passedCriteria.push('gpa');
  }

  // ---------------------------------------------------------
  // 2. Category Evaluation
  // ---------------------------------------------------------
  const scholarshipCategory = scholarship.eligibleCategory || scholarship.category;
  if (!isAny(scholarshipCategory)) {
    if (!student.category || String(student.category).trim() === '') {
      missingFields.push('category');
      reasons.push('Category is missing in your student profile.');
    } else {
      const normStudentCat = normalizeText(student.category);
      // Scholarship category can be comma-separated or single value
      const allowedCategories = String(scholarshipCategory)
        .split(',')
        .map(c => normalizeText(c))
        .filter(Boolean);

      const matches = allowedCategories.some(cat => cat === normStudentCat || cat === 'any' || cat === 'all');
      if (matches) {
        passedCriteria.push('category');
      } else {
        failedCriteria.push('category');
        reasons.push('Your category does not match this scholarship.');
      }
    }
  } else {
    passedCriteria.push('category');
  }

  // ---------------------------------------------------------
  // 3. Course Evaluation
  // ---------------------------------------------------------
  const scholarshipCourse = scholarship.eligibleCourse || scholarship.course;
  if (!isAny(scholarshipCourse)) {
    if (!student.course || String(student.course).trim() === '') {
      missingFields.push('course');
      reasons.push('Course is missing in your student profile.');
    } else {
      const normStudentCourse = normalizeText(student.course);
      const allowedCourses = String(scholarshipCourse)
        .split(',')
        .map(c => normalizeText(c))
        .filter(Boolean);

      const matches = allowedCourses.some(c => c === normStudentCourse || c === 'any' || c === 'all');
      if (matches) {
        passedCriteria.push('course');
      } else {
        failedCriteria.push('course');
        reasons.push('Your course does not match the eligible course.');
      }
    }
  } else {
    passedCriteria.push('course');
  }

  // ---------------------------------------------------------
  // 4. Family Annual Income Evaluation
  // ---------------------------------------------------------
  const maxIncome = scholarship.maxFamilyIncome !== undefined && scholarship.maxFamilyIncome !== null && scholarship.maxFamilyIncome !== ''
    ? Number(scholarship.maxFamilyIncome)
    : null;

  if (maxIncome !== null && !isNaN(maxIncome) && maxIncome > 0) {
    if (student.familyIncome === undefined || student.familyIncome === null || student.familyIncome === '') {
      missingFields.push('familyIncome');
      reasons.push('Family annual income is missing in your student profile.');
    } else {
      const studentIncome = Number(student.familyIncome);
      if (isNaN(studentIncome)) {
        missingFields.push('familyIncome');
        reasons.push('Family income must be a valid number.');
      } else if (studentIncome <= maxIncome) {
        passedCriteria.push('familyIncome');
      } else {
        failedCriteria.push('familyIncome');
        reasons.push('Your family income exceeds the permitted limit.');
      }
    }
  } else {
    passedCriteria.push('familyIncome');
  }

  // ---------------------------------------------------------
  // 5. State Evaluation
  // ---------------------------------------------------------
  const scholarshipState = scholarship.eligibleState || scholarship.state;
  if (!isAny(scholarshipState)) {
    if (!student.state || String(student.state).trim() === '') {
      missingFields.push('state');
      reasons.push('State is missing in your student profile.');
    } else {
      const normStudentState = normalizeText(student.state);
      const allowedStates = String(scholarshipState)
        .split(',')
        .map(s => normalizeText(s))
        .filter(Boolean);

      const matches = allowedStates.some(s => s === normStudentState || s === 'any' || s === 'all');
      if (matches) {
        passedCriteria.push('state');
      } else {
        failedCriteria.push('state');
        reasons.push("Your state does not match the scholarship's eligible state.");
      }
    }
  } else {
    passedCriteria.push('state');
  }

  // ---------------------------------------------------------
  // 6. Targeted Student Types Evaluation (Admin-specified target groups)
  // ---------------------------------------------------------
  const targetedTypes = scholarship.targetedStudentTypes;
  if (targetedTypes && Array.isArray(targetedTypes) && targetedTypes.length > 0) {
    const isTargetedToAll = targetedTypes.includes('All') || targetedTypes.includes('All Students') || targetedTypes.includes('All Eligible');
    if (!isTargetedToAll) {
      if (!matchesTargetType(student, targetedTypes)) {
        failedCriteria.push('targetedGroup');
        reasons.push(`This scholarship is specifically targeted to ${targetedTypes.join(', ')} students.`);
      } else {
        passedCriteria.push('targetedGroup');
      }
    } else {
      passedCriteria.push('targetedGroup');
    }
  }

  // ---------------------------------------------------------
  // Determine Final Eligibility Status
  // ---------------------------------------------------------
  if (missingFields.length > 0) {
    return {
      status: 'Cannot determine eligibility',
      eligible: false,
      passedCriteria,
      failedCriteria,
      missingFields,
      reasons: reasons.length > 0 ? reasons : ['Profile incomplete. Missing required fields.']
    };
  }

  if (failedCriteria.length > 0) {
    return {
      status: 'Not eligible',
      eligible: false,
      passedCriteria,
      failedCriteria,
      missingFields: [],
      reasons
    };
  }

  return {
    status: 'Eligible',
    eligible: true,
    passedCriteria,
    failedCriteria: [],
    missingFields: [],
    reasons: ['You satisfy all eligibility criteria for this scholarship.']
  };
}
