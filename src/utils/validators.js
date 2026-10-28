/**
 * Input & Security Validators for ScholarAid
 */

/**
 * Validates whether a URL is a legitimate, safe HTTP/HTTPS URL.
 * Prevents javascript:, data:, file: and malformed URI exploits.
 * @param {string} urlString
 * @returns {boolean}
 */
export function isValidHttpUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') return false;
  try {
    const url = new URL(urlString.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Safely opens an external official URL in a new tab with noopener, noreferrer.
 * @param {string} url
 * @returns {boolean} Whether the window.open call was initiated safely
 */
export function safelyOpenExternalUrl(url) {
  if (!isValidHttpUrl(url)) {
    return false;
  }
  const win = window.open(url.trim(), '_blank', 'noopener,noreferrer');
  if (win) {
    win.opener = null;
    return true;
  }
  return false;
}

/**
 * Validates email format.
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

/**
 * Formats a currency amount into Indian Rupee format (INR).
 * @param {number|string} amount
 * @returns {string}
 */
export function formatCurrencyINR(amount) {
  if (amount === null || amount === undefined || amount === '') return 'N/A';
  const num = Number(amount);
  if (isNaN(num)) return String(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
}

/**
 * Formats a date into a clean human-readable date.
 * @param {string|Date} dateVal
 * @returns {string}
 */
export function formatDate(dateVal) {
  if (!dateVal) return 'N/A';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
