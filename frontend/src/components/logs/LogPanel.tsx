import React from 'react';

interface LogPanelProps {
  onClose: () => void;
}

const LogPanel: React.FC<LogPanelProps> = ({ onClose }) => {
  return (
    <div className="w-96 bg-white h-full p-4 border-l border-gray-200 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Logs</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">&times;</button>
      </div>
      <p className="text-sm text-gray-500">(Log panel content)</p>
    </div>
  );
};

export default LogPanel; 