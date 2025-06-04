import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { PortConfig } from '../plugins/sdk'; // Import PortConfig

export interface ActionNodeData {
  label?: string;
  icon?: React.ReactNode; 
  actionType?: string; 
  inputs?: PortConfig[];
  outputs?: PortConfig[];
}

// Default ports are now handled by VisualWorkflowPage.createNewNodeData
// const defaultActionInputPorts: PortConfig[] = [
//   {
//     id: 'input',
//     name: 'Input',
//     dataType: 'any',
//     description: 'Input data for the action'
//   }
// ];
// const defaultActionOutputPorts: PortConfig[] = [
//   {
//     id: 'output',
//     name: 'Output',
//     dataType: 'object',
//     description: 'Result of the action'
//   }
// ];

const ActionNode: React.FC<NodeProps<ActionNodeData>> = ({ data, isConnectable, selected }) => {
  const inputs = data.inputs || []; // Fallback to empty array
  const outputs = data.outputs || []; // Fallback to empty array

  return (
    <div 
      className={`bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-4 rounded-lg shadow-lg w-60 border-2 ${selected ? 'border-purple-400 shadow-purple-300/50' : 'border-blue-700'}`}
    >
      {/* Dynamically render input Handles */}
      {inputs.map((port, index) => (
        <Handle
          key={port.id}
          type="target"
          position={Position.Left}
          id={port.id}
          data-testid={`input-${port.id}`}
          data-type={port.dataType}
          isConnectable={isConnectable}
          className="!bg-gray-200 w-3 h-3 border-2 !border-slate-500 transform translate-y-[-50%]"
          style={{ top: inputs.length > 1 ? `${(index + 1) * (100 / (inputs.length + 1))}%` : '50%' }}
        >
          <span className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-600 bg-white px-1 rounded shadow">
            {port.name}
          </span>
        </Handle>
      ))}
      
      <div className="text-center mb-2">
        <div className="flex items-center justify-center mb-1">
            {data.icon && <span className="mr-2 text-xl">{data.icon}</span>}
            <strong className="text-sm truncate" title={data.label || 'Action'}>{data.label || 'Action'}</strong>
        </div>
        {data.actionType && <p className="text-xs bg-black bg-opacity-20 px-2 py-0.5 rounded-full inline-block">{data.actionType}</p>}
      </div>
      <p className="text-xs opacity-90 mb-1 text-center">Performs a specific operation or task.</p>

      {/* Dynamically render output Handles */}
      {outputs.map((port, index) => (
        <Handle
          key={port.id}
          type="source"
          position={Position.Right}
          id={port.id}
          data-testid={`output-${port.id}`}
          data-type={port.dataType}
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

export default memo(ActionNode); 