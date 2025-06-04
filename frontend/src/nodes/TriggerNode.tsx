import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { PortConfig } from '../plugins/sdk'; // Import PortConfig

export interface TriggerNodeData {
  label?: string;
  icon?: React.ReactNode;
  outputs?: PortConfig[]; 
}

// Default ports are now handled by VisualWorkflowPage.createNewNodeData
// const defaultTriggerPorts: PortConfig[] = [
//   {
//     id: 'output',
//     name: 'Trigger Output',
//     dataType: 'object',
//     description: 'Data output when the trigger fires'
//   }
// ];

const TriggerNode: React.FC<NodeProps<TriggerNodeData>> = ({ data, isConnectable, selected }) => {
  // Use data.outputs directly; it should be provided by VisualWorkflowPage
  const outputs = data.outputs || []; // Fallback to empty array if not provided

  return (
    <div 
      className={`bg-gradient-to-br from-green-500 to-emerald-600 text-white p-4 rounded-lg shadow-lg w-56 border-2 ${selected ? 'border-blue-400 shadow-blue-300/50' : 'border-green-700'}`}
    >
      <div className="flex items-center mb-2">
        {data.icon && <span className="mr-2 text-xl">{data.icon}</span>}
        <strong className="text-sm truncate" title={data.label || 'Trigger'}>{data.label || 'Trigger'}</strong>
      </div>
      <p className="text-xs opacity-90 mb-3">Initiates a workflow based on an event or condition.</p>
      
      {/* Dynamically render output Handles */}
      {outputs.map((port, index) => (
        <Handle
          key={port.id}
          type="source"
          position={Position.Right}
          id={port.id}
          data-testid={`output-${port.id}`}
          data-type={port.dataType} // Pass dataType for connection validation
          isConnectable={isConnectable}
          className="!bg-gray-700 w-3 h-3 border-2 !border-white transform translate-y-[-50%]"
          style={{ top: outputs.length > 1 ? `${(index + 1) * (100 / (outputs.length + 1))}%` : '50%' }}
        >
          <span className="absolute right-full mr-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-600 bg-white px-1 rounded shadow">
            {port.name}
          </span>
        </Handle>
      ))}
    </div>
  );
};

export default memo(TriggerNode); 