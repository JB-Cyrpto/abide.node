import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NodeData, NodePort } from '../../../types';
import { 
  Code, 
  Mail, 
  Database, 
  Webhook, 
  Bot, 
  Workflow,
  MoreHorizontal 
} from 'lucide-react';

// Map of node types to icons
const iconMap: Record<string, React.ReactNode> = {
  javascript: <Code size={16} />,
  email: <Mail size={16} />,
  database: <Database size={16} />,
  webhook: <Webhook size={16} />,
  ai: <Bot size={16} />,
  workflow: <Workflow size={16} />
};

const GenericNode: React.FC<NodeProps<NodeData>> = ({ data, type, selected }) => {
  const icon = iconMap[type] || <Code size={16} />;
  
  return (
    <div className={`rounded-lg shadow-md bg-white border ${selected ? 'border-primary-500' : 'border-border-light'} transition-all w-64`}>
      <div className={`flex items-center p-3 border-b ${selected ? 'bg-primary-50' : 'bg-gray-50'} rounded-t-lg`}>
        <div className="flex items-center flex-1">
          <div className="mr-2 text-gray-600">{icon}</div>
          <div className="font-medium text-gray-800 truncate">{data.label}</div>
        </div>
        <button className="p-1 rounded-full hover:bg-gray-200 text-gray-600">
          <MoreHorizontal size={16} />
        </button>
      </div>
      
      <div className="p-4">
        {/* Render inputs */}
        {data.inputs && data.inputs.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-500 mb-2">Inputs</div>
            <div className="space-y-2">
              {data.inputs.map((input: NodePort) => (
                <div key={input.id} className="flex items-center">
                  <Handle
                    type="target"
                    position={Position.Left}
                    id={input.id}
                    className="w-3 h-3 bg-primary-500"
                  />
                  <div className="ml-2 text-sm text-gray-700">
                    {input.label} <span className="text-xs text-gray-500">({input.type})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Render outputs */}
        {data.outputs && data.outputs.length > 0 && (
          <div>
            <div className="text-xs font-medium text-gray-500 mb-2">Outputs</div>
            <div className="space-y-2">
              {data.outputs.map((output: NodePort) => (
                <div key={output.id} className="flex items-center justify-end">
                  <div className="mr-2 text-sm text-gray-700">
                    {output.label} <span className="text-xs text-gray-500">({output.type})</span>
                  </div>
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={output.id}
                    className="w-3 h-3 bg-secondary-500"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenericNode;