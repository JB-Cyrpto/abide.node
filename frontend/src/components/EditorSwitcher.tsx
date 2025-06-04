import React, { useState } from 'react';
import VisualWorkflowPage from './VisualWorkflowPage';
import NodeBuilderPage from './NodeBuilderPage'; // Import NodeBuilderPage

interface EditorSwitcherProps {}

type EditorView = 'visual' | 'builder' | 'code';

const EditorSwitcher: React.FC<EditorSwitcherProps> = () => {
  const [activeView, setActiveView] = useState<EditorView>('visual');

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="p-3 bg-gray-800 text-white shadow-md flex items-center space-x-2">
        <button
          onClick={() => setActiveView('visual')}
          disabled={activeView === 'visual'}
          className={`px-4 py-2 font-semibold rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors
            ${activeView === 'visual' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300 hover:text-white'}`}
        >
          Visual Workflow
        </button>
        <button
          onClick={() => setActiveView('builder')}
          disabled={activeView === 'builder'}
          className={`px-4 py-2 font-semibold rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 transition-colors
            ${activeView === 'builder' ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300 hover:text-white'}`}
        >
          Node Builder
        </button>
        <button
          onClick={() => setActiveView('code')}
          disabled={activeView === 'code'}
          className={`px-4 py-2 font-semibold rounded hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75 transition-colors
            ${activeView === 'code' ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-300 hover:text-white'}`}
        >
          Code Editor (Placeholder)
        </button>
      </div>

      <div className="flex-grow overflow-auto"> {/* Added overflow-auto for pages like NodeBuilderPage */}
        {activeView === 'visual' && <VisualWorkflowPage />}
        {activeView === 'builder' && <NodeBuilderPage />}
        {activeView === 'code' && (
          <div className="p-6">
            <div className="p-4 border rounded bg-white shadow">
                <h2 className="text-xl font-semibold">Code Editor View</h2>
                <p>(Placeholder for your existing code editor or Monaco integration)</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorSwitcher; 