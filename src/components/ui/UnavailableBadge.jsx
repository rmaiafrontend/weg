import React from 'react';

export default function UnavailableBadge({ className = "" }) {
  return (
    <span className={`inline-flex items-center bg-gray-400 text-white text-sm font-medium px-2 py-1 rounded ${className}`}>
      INDISPONÍVEL
    </span>
  );
}