import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { PortConfig } from '../plugins/sdk'; // Import PortConfig

export interface LogicNodeData {
  label?: string;
  icon?: React.ReactNode;
  logicType?: string; 
  condition?: string; 
  inputs?: PortConfig[];
  outputs?: PortConfig[];
}

// Default ports are now handled by VisualWorkflowPage.createNewNodeData
// const defaultLogicInputPorts: PortConfig[] = [
//   {
//     id: 'input',
//     name: 'Input',
//     dataType: 'any',
//     description: 'Input data for the logic condition'
//   }
// ];
// const defaultLogicOutputPorts: PortConfig[] = [
//   {
//     id: 'output_true',
//     name: 'True',
//     dataType: 'any',
//     description: 'Output if condition is true'
//   },
//   {
//     id: 'output_false',
//     name: 'False',
//     dataType: 'any',
//     description: 'Output if condition is false'
//   }
// ];

const LogicNode: React.FC<NodeProps<LogicNodeData>> = ({ data, isConnectable, selected }) => {
  const inputs = data.inputs || []; // Fallback to empty array
  const outputs = data.outputs || []; // Fallback to empty array

  return (
    <div 
      className={`bg-gradient-to-br from-purple-500 to-pink-600 text-white p-4 rounded-lg shadow-lg w-64 border-2 ${selected ? 'border-yellow-400 shadow-yellow-300/50' : 'border-purple-700'}`}
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
            <strong className="text-sm truncate" title={data.label || 'Logic'}>{data.label || 'Logic'}</strong>
        </div>
        {data.logicType && <p className="text-xs bg-black bg-opacity-20 px-2 py-0.5 rounded-full inline-block mb-1">{data.logicType}</p>}
        {data.condition && 
          <div className="text-xs font-mono bg-black bg-opacity-30 p-1.5 rounded break-all" title={data.condition}>
            If: {data.condition.length > 50 ? `${data.condition.substring(0, 47)}...` : data.condition}
          </div>}
      </div>

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

export default memo(LogicNode); 