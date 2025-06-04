import { create } from 'zustand';

export type LogEntry = {
  id: string; // Unique ID for the log entry, e.g., using Date.now() or a UUID
  nodeId: string;
  message: string;
  timestamp: string;
  type: 'info' | 'error' | 'warning' | 'success' | 'debug'; // Optional: for different log levels/colors
};

interface LogsState {
  logs: LogEntry[];
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  clearLogs: (nodeId?: string) => void; // Optional: to clear logs for a specific node or all logs
}

export const useLogsStore = create<LogsState>((set) => ({
  logs: [],
  addLog: (logEntry) =>
    set((state) => ({
      logs: [
        ...state.logs,
        {
          ...logEntry,
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
        },
      ],
    })),
  clearLogs: (nodeId) =>
    set((state) => ({
      logs: nodeId ? state.logs.filter((log) => log.nodeId !== nodeId) : [],
    })),
}));

// Example usage (can be in any component or service):
// import { useLogsStore } from './logsStore';
// const addLog = useLogsStore.getState().addLog;
// addLog({ nodeId: 'node-1', message: 'Node execution started', type: 'info' });
// addLog({ nodeId: 'node-1', message: 'Something went wrong!', type: 'error' });

// To use in a component and react to changes:
// const logsForNode = useLogsStore(state => state.logs.filter(log => log.nodeId === 'node-1')); 