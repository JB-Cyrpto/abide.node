import React from 'react';
import { Plus, Code, Mail, Database, Webhook, Bot, Workflow, X } from 'lucide-react';
import { useNodeDefinitionStore } from '../../store/nodeDefinitionStore';
import { useWorkflowStore } from '../../store/workflowStore';

interface SidebarProps {
  activeView: string;
  onClose: () => void;
}

const iconMap: Record<string, React.ReactNode> = {
  Code: <Code size={18} />,
  Mail: <Mail size={18} />,
  Database: <Database size={18} />,
  Webhook: <Webhook size={18} />,
  Bot: <Bot size={18} />,
  Workflow: <Workflow size={18} />
};

const Sidebar: React.FC<SidebarProps> = ({ activeView, onClose }) => {
  const { definitions } = useNodeDefinitionStore();
  const { workflows, createWorkflow, setActiveWorkflow, activeWorkflowId } = useWorkflowStore();

  const definitionsByCategory = definitions.reduce((acc, def) => {
    if (!acc[def.category]) {
      acc[def.category] = [];
    }
    acc[def.category].push(def);
    return acc;
  }, {} as Record<string, typeof definitions>);

  const handleCreateWorkflow = () => {
    const id = createWorkflow('New Workflow', 'Description of your workflow');
    setActiveWorkflow(id);
  };

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="flex items-center justify-between p-3 text-gray-400 text-sm">
        <span className="uppercase font-semibold">
          {activeView === 'files' ? 'Workflows' : activeView}
        </span>
        <button onClick={onClose} className="hover:text-white">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeView === 'files' && (
          <>
            <div className="p-3">
              <button
                onClick={handleCreateWorkflow}
                className="flex items-center justify-center w-full px-3 py-1.5 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
              >
                <Plus size={16} className="mr-1" />
                New Workflow
              </button>
            </div>

            <div className="px-3">
              {workflows.map((workflow) => (
                <button
                  key={workflow.id}
                  onClick={() => setActiveWorkflow(workflow.id)}
                  className={`flex items-center w-full px-2 py-1 text-sm rounded mb-1 ${
                    activeWorkflowId === workflow.id
                      ? 'bg-primary-900 text-primary-400'
                      : 'text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  <Workflow size={14} className="mr-2" />
                  <span className="truncate">{workflow.name}</span>
                </button>
              ))}
            </div>

            <div className="mt-4">
              <div className="px-3 py-2 text-xs text-gray-500 font-medium uppercase">
                Nodes
              </div>
              {Object.entries(definitionsByCategory).map(([category, defs]) => (
                <div key={category} className="mb-2">
                  <div className="px-3 py-1 text-xs text-gray-500">{category}</div>
                  {defs.map((def) => (
                    <div
                      key={def.type}
                      className="flex items-center px-3 py-1 text-sm text-gray-400 hover:bg-gray-800 cursor-grab"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/reactflow', JSON.stringify({ type: def.type }));
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                    >
                      <div className="mr-2">{iconMap[def.icon]}</div>
                      <span>{def.label}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;