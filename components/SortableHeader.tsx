import React from 'react';
import type { SortConfig } from '../hooks/useTableControls';

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  sortConfig: SortConfig | null;
  onSort: (key: string) => void;
  className?: string;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({ label, sortKey, sortConfig, onSort, className = '' }) => {
  const isActive = sortConfig?.key === sortKey;
  return (
    <th
      className={`cursor-pointer select-none hover:bg-slate-100 transition-colors ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className={`text-[10px] ${isActive ? 'text-blue-500' : 'text-slate-400'}`}>
          {isActive ? (sortConfig!.direction === 'asc' ? '\u25B2' : '\u25BC') : '\u21C5'}
        </span>
      </span>
    </th>
  );
};

export default SortableHeader;
