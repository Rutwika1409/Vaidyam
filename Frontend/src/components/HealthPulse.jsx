import React from 'react';

export default function HealthPulse({ className = '' }) {
  return (
    <svg
      className={`w-full overflow-visible ${className}`}
      viewBox="0 0 600 120"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background track */}
      <path
        d="M0 60 L180 60 L195 50 L210 70 L220 20 L235 100 L245 60 L260 60 L275 60 L290 60 L310 60 L490 60 L505 50 L520 70 L530 20 L545 100 L555 60 L570 60 L585 60 L600 60"
        fill="none"
        stroke="rgba(255, 255, 255, 0.03)"
        strokeWidth="2"
      />
      {/* Animated travel path */}
      <path
        className="health-pulse-path"
        d="M0 60 L180 60 L195 50 L210 70 L220 20 L235 100 L245 60 L260 60 L275 60 L290 60 L310 60 L490 60 L505 50 L520 70 L530 20 L545 100 L555 60 L570 60 L585 60 L600 60"
      />
    </svg>
  );
}
