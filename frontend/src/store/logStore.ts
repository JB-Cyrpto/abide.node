import { create } from 'zustand';
import { LogEntry } from '../types';
import { nanoid } from 'nanoid';

interface LogState {
  entries: LogEntry[];
  maxEntries: number;
  levels: Set<LogEntry['level']>;
  
  // Logging
  log: (level: LogEntry['level'], message: string, metadata?: Record<string, any>) => void;
  clear: () => void;
  
  // Filtering
  setLevels: (levels: LogEntry['level'][]) => void;
  
  // Export
  exportLogs: (format: 'json' | 'csv') => string;
}

export const useLogStore = create<LogState>((set, get) => ({
  entries: [],
  maxEntries: 1000,
  levels: new Set(['info', 'warn', 'error', 'debug']),
  
  log: (level, message, metadata?) => {
    const entry: LogEntry = {
      id: nanoid(),
      timestamp: new Date(),
      level,
      message,
      ...metadata,
    };
    
    set(state => ({
      entries: [entry, ...state.entries].slice(0, state.maxEntries),
    }));
  },
  
  clear: () => {
    set({ entries: [] });
  },
  
  setLevels: (levels) => {
    set({ levels: new Set(levels) });
  },
  
  exportLogs: (format) => {
    const { entries } = get();
    
    if (format === 'json') {
      return JSON.stringify(entries, null, 2);
    }
    
    if (format === 'csv') {
      const headers = ['timestamp', 'level', 'message', 'workflowId', 'nodeId'];
      const rows = entries.map(entry => [
        entry.timestamp.toISOString(),
        entry.level,
        entry.message,
        entry.workflowId || '',
        entry.nodeId || '',
      ]);
      
      return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }
    
    return '';
  },
}));