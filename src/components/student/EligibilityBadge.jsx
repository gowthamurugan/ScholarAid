import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export default function EligibilityBadge({ status, showIcon = true }) {
  if (status === 'Eligible') {
    return (
      <span className="badge badge-eligible">
        {showIcon && <CheckCircle2 size={13} />} Eligible
      </span>
    );
  }

  if (status === 'Not eligible') {
    return (
      <span className="badge badge-ineligible">
        {showIcon && <XCircle size={13} />} Not Eligible
      </span>
    );
  }

  return (
    <span className="badge badge-pending">
      {showIcon && <AlertTriangle size={13} />} Cannot Determine
    </span>
  );
}
