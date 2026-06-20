import React from 'react';

export default function DoctorAvatar({ name = '', size = 'md' }) {
  const getInitials = (fullName) => {
    const clean = fullName.replace(/^(dr\.|dr)\s+/i, '').trim();
    const parts = clean.split(/\s+/);
    if (parts.length === 0 || !parts[0]) return 'MD';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const initials = getInitials(name);

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-lg',
  };

  return (
    <div className={`flex items-center justify-center rounded-full font-bold bg-teal/15 text-teal border border-teal/30 shadow-[0_0_10px_var(--teal-glow)] ${sizeClasses[size] || sizeClasses.md}`}>
      {initials}
    </div>
  );
}
