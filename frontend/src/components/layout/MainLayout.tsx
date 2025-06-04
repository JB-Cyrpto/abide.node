import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import AIAssistantPanel from '../ai/AIAssistantPanel';
import { useWorkflowStore } from '../../store/workflowStore';
import { Code, Settings, GitBranch, Search, Play } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const ActivityBarItem: React.FC<{
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  tooltip: string;
}> = ({ icon, isActive, onClick, tooltip }) => (
  <button
    className={`w-12 h-12 flex items-center justify-center hover:bg-gray-800 relative group ${
      isActive ? 'bg-gray-800 border-l-2 border-primary-500' : ''
    }`}
    onClick={onClick}
  >
    <div className="text-gray-400 group-hover:text-white">{icon}</div>
    <div className="absolute left-14 bg-gray-800 text-white px-2 py-1 rounded text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none">
      {tooltip}
    </div>
  </button>
);

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<'files' | 'search' | 'git' | 'run' | 'settings'>('files');
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(true);
  const { activeWorkflowId } = useWorkflowStore();

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar */}
        <div className="w-12 bg-gray-900 flex flex-col border-r border-gray-800">
          <ActivityBarItem
            icon={<Code size={24} />}
            isActive={activeView === 'files'}
            onClick={() => setActiveView('files')}
            tooltip="Workflows"
          />
          <ActivityBarItem
            icon={<Search size={24} />}
            isActive={activeView === 'search'}
            onClick={() => setActiveView('search')}
            tooltip="Search"
          />
          <ActivityBarItem
            icon={<GitBranch size={24} />}
            isActive={activeView === 'git'}
            onClick={() => setActiveView('git')}
            tooltip="Source Control"
          />
          <ActivityBarItem
            icon={<Play size={24} />}
            isActive={activeView === 'run'}
            onClick={() => setActiveView('run')}
            tooltip="Run Workflow"
          />
          <div className="flex-1" />
          <ActivityBarItem
            icon={<Settings size={24} />}
            isActive={activeView === 'settings'}
            onClick={() => setActiveView('settings')}
            tooltip="Settings"
          />
        </div>

        {/* Sidebar */}
        {isSidebarOpen && (
          <Sidebar
            activeView={activeView}
            onClose={() => setIsSidebarOpen(false)}
          />
        )}
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-900">
          <div className="flex-1 overflow-hidden">
            {activeWorkflowId ? (
              children
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md p-8">
                  <h2 className="text-2xl font-bold text-gray-100 mb-4">Welcome to abide.AI</h2>
                  <p className="text-gray-400 mb-6">
                    Create a new workflow or select an existing one from the sidebar to get started.
                  </p>
                  <button
                    onClick={() => {
                      const id = useWorkflowStore.getState().createWorkflow('New Workflow', 'Description of your workflow');
                      useWorkflowStore.getState().setActiveWorkflow(id);
                    }}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                  >
                    Create Workflow
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* AI Assistant Panel */}
          {isAIPanelOpen && (
            <AIAssistantPanel
              onClose={() => setIsAIPanelOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;