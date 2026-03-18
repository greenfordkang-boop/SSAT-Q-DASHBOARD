import { useState, useCallback } from 'react';

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export function useTableControls<T extends Record<string, any>>(initialExpanded = true) {
  const [expanded, setExpanded] = useState(initialExpanded);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  const toggleExpand = useCallback(() => setExpanded(prev => !prev), []);

  const requestSort = useCallback((key: string) => {
    setSortConfig(prev =>
      prev?.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  }, []);

  const sortData = useCallback((data: T[]) => {
    if (!sortConfig) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = typeof aVal === 'string'
        ? aVal.localeCompare(bVal as string)
        : (aVal as number) - (bVal as number);
      return sortConfig.direction === 'asc' ? cmp : -cmp;
    });
  }, [sortConfig]);

  return { expanded, toggleExpand, sortConfig, requestSort, sortData };
}
