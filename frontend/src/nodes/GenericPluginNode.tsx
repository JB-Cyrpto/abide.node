import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NodePlugin } from '../plugins/sdk'; // Adjust path as needed
import { FiBox } from 'react-icons/fi'; // Generic icon for plugins

// Define the expected structure of the node's data prop when using GenericPluginNode
export interface GenericPluginNodeData {
  label: string;
  plugin: NodePlugin; // The full plugin definition
  // Any other properties from plugin.defaultData will also be here
  [key: string]: any;
}

const GenericPluginNode: React.FC<NodeProps<GenericPluginNodeData>> = ({ data, isConnectable, selected }) => {
  const { label, plugin } = data;

  // Use a fallback color if plugin.color is not defined
  const nodeColor = plugin.color || 'bg-slate-500';
  const borderColor = selected ? 'border-indigo-600' : 'border-gray-400';

  return (
    <div 
      className={`rounded-md border ${borderColor} shadow-md text-sm ${selected ? 'shadow-lg' : ''}`}
      style={{ minWidth: 180, background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)' }} // Light gradient background
    >
      <div className={`p-2 ${nodeColor} text-white rounded-t-md flex items-center justify-between`}>
        <div className="flex items-center">
          {plugin.icon ? <span className="mr-2">{typeof plugin.icon === 'string' ? <img src={plugin.icon} alt="" className="w-4 h-4" /> : plugin.icon}</span> : <FiBox className="mr-2" />}
          <span className="font-semibold">{label || plugin.name}</span>
        </div>
      </div>
      
      <div className="p-3 space-y-2 bg-white">
        {/* Inputs */}
        {plugin.inputs && plugin.inputs.map((port, index) => (
          <div key={port.id} className="relative flex items-center">
            <Handle
              type="target"
              position={Position.Left}
              id={port.id}
              style={{ top: `${(index / plugin.inputs.length) * 80 + 10}%`, background: '#555' }} // Distribute handles
              isConnectable={isConnectable}
              data-type={port.dataType} // For connection validation
            />
            <span className="text-xs text-gray-600 ml-5">{port.name} ({port.dataType})</span>
          </div>
        ))}

        {/* Outputs */}
        {plugin.outputs && plugin.outputs.map((port, index) => (
          <div key={port.id} className="relative flex items-center justify-end">
            <span className="text-xs text-gray-600 mr-5">{port.name} ({port.dataType})</span>
            <Handle
              type="source"
              position={Position.Right}
              id={port.id}
              style={{ top: `${(index / plugin.outputs.length) * 80 + 10}%`, background: '#555' }} // Distribute handles
              isConnectable={isConnectable}
              data-type={port.dataType} // For connection validation
            />
          </div>
        ))}
        
        {(!plugin.inputs || plugin.inputs.length === 0) && (!plugin.outputs || plugin.outputs.length === 0) && (
          <p className="text-xs text-gray-400 text-center py-2">No ports defined.</p>
        )}
      </div>
      
      {plugin.description && (
        <div className="px-3 py-2 border-t border-gray-200 bg-slate-50 rounded-b-md">
          <p className="text-xs text-gray-500 italic">{plugin.description}</p>
        </div>
      )}
    </div>
  );
};

export default GenericPluginNode; 