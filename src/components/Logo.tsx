import React from 'react';

export function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <circle cx="50" cy="50" r="45" fill="#4F46E5" fillOpacity="0.1" />
      <path 
        d="M50 20L80 35V65L50 80L20 65V35L50 20Z" 
        fill="#4F46E5" 
        stroke="#4338CA" 
        strokeWidth="2" 
        strokeLinejoin="round"
      />
      <path 
        d="M50 20V80M20 35L80 65M80 35L20 65" 
        stroke="white" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      <circle cx="50" cy="50" r="10" fill="white" />
      <path 
        d="M45 50L48 53L55 46" 
        stroke="#4F46E5" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}
