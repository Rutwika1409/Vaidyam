import React from 'react';

export default function LoadingSpinner({ fullPage = true }) {
  const containerClasses = fullPage
    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-navy'
    : 'flex flex-col items-center justify-center p-8';

  return (
    <div className={containerClasses}>
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulsing ring */}
        <div className="absolute h-16 w-16 animate-ping rounded-full bg-teal/20"></div>
        {/* Spinning border ring */}
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-teal border-t-transparent"></div>
        {/* Inner static brand core */}
        <div className="absolute h-4 w-4 rounded-full bg-teal shadow-[0_0_12px_#00C9A7]"></div>
      </div>
      <span className="mt-4 font-display text-sm font-semibold tracking-wider text-teal animate-pulse">
        vAIdyam
      </span>
    </div>
  );
}
