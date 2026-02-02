import React from 'react';
import { Clock } from 'lucide-react';

export default function ExpressBadge({ className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1 bg-accent text-accent-foreground text-sm font-bold px-2 py-1 rounded ${className}`}>
      <Clock className="w-3 h-3" />
      ENTREGA 1H
    </span>
  );
}