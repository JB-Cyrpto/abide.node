import React, { useEffect, useRef } from 'react';
import { useLogsStore, LogEntry } from '../store/logsStore'; // Adjust path as needed

interface LogPanelProps {
  nodeId: string | null; // Allow null if no node is selected
  className?: string;
}

const LogPanel: React.FC<LogPanelProps> = ({ nodeId, className }) => {
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Filter logs for the specific nodeId or show all if no nodeId is provided (or handle as needed)
  const relevantLogs = useLogsStore((state) =>
    nodeId ? state.logs.filter((log) => log.nodeId === nodeId) : state.logs // Or an empty array: []
  );

  useEffect(() => {
    // Auto-scroll to the bottom when new logs are added
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [relevantLogs]);

  const getLogTypeColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'success': return 'text-green-400';
      case 'info': return 'text-blue-400'; // Or a more neutral color like text-gray-300
      case 'debug': return 'text-purple-400';
      default: return 'text-gray-300';
    }
  };

  if (!nodeId && !relevantLogs.length) { // Optional: hide panel if no node selected and no global logs
    // return null; or show a generic message
  }

  return (
    <div 
      className={`bg-gray-900 text-gray-200 p-4 rounded-lg shadow-xl h-64 w-full flex flex-col ${className || ''}`}
    >
      <h3 className="text-sm font-semibold text-gray-400 mb-3 border-b border-gray-700 pb-2">
        {nodeId ? `Execution Logs for ${nodeId}` : 'Global Logs'}
      </h3>
      <div 
        ref={logsContainerRef} 
        className="flex-grow overflow-y-auto space-y-1.5 text-xs scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 pr-2"
      >
        {relevantLogs.length === 0 ? (
          <p className="text-gray-500 italic">No logs yet for this node.</p>
        ) : (
          relevantLogs.map((log) => (
            <div key={log.id} className="font-mono flex items-start">
              <span className="text-gray-500 mr-2 min-w-[130px]">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
              <span className={`${getLogTypeColor(log.type)} mr-2 uppercase min-w-[60px]`}>[{log.type}]</span>
              <span className={`flex-1 ${getLogTypeColor(log.type)} break-words ws-pre-wrap`}>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LogPanel; 