import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function EmergencyBadge({ pulseOnly = false }) {
  if (pulseOnly) {
    return (
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center space-x-1.5 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400 border border-red-500/20">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
      </span>
      <AlertTriangle className="h-3 w-3" />
      <span>Emergency</span>
    </span>
  );
}
