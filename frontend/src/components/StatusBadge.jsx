import React from 'react';
import { Clock, CheckCircle, XCircle, CheckCheck } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const normalized = (status || '').toLowerCase();

  switch (normalized) {
    case 'pending':
      return (
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3.5 h-3.5" />
          <span>Pending</span>
        </span>
      );
    case 'confirmed':
      return (
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Confirmed</span>
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3.5 h-3.5" />
          <span>Cancelled</span>
        </span>
      );
    case 'completed':
      return (
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
          <CheckCheck className="w-3.5 h-3.5" />
          <span>Completed</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
          {status}
        </span>
      );
  }
};

export default StatusBadge;
