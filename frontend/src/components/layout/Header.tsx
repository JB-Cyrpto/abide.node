import React from 'react';
import { Code, Menu, X } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';

interface HeaderProps {}

const Header: React.FC<HeaderProps> = () => {
  const { activeWorkflowId, getActiveWorkflow } = useWorkflowStore();
  const activeWorkflow = getActiveWorkflow();

  return (
    <header className="h-9 bg-gray-900 border-b border-gray-800 flex items-center px-4 text-sm">
      <div className="flex items-center space-x-4 text-gray-400">
        <div className="flex items-center">
          <Code size={16} className="mr-2" />
          <span>abide.AI</span>
        </div>
        <div className="flex space-x-3">
          <button className="hover:text-white">File</button>
          <button className="hover:text-white">Edit</button>
          <button className="hover:text-white">View</button>
          <button className="hover:text-white">Run</button>
          <button className="hover:text-white">Help</button>
        </div>
      </div>
      
      <div className="flex-1 flex justify-center">
        {activeWorkflowId && (
          <div className="text-gray-400">
            {activeWorkflow?.name || 'Untitled Workflow'}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;