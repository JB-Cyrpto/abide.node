import React, { memo, useEffect, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FiCpu, FiMessageSquare } from 'react-icons/fi'; // LLM/AI related icon and FiMessageSquare
import { useCollaborationStore } from '../store/collaborationStore'; // Corrected import path
import { PortConfig } from '../plugins/sdk'; // Import PortConfig

export interface LLMAgentNodeData {
  label?: string;
  promptTemplate?: string;
  // inputVariables could be an array of strings derived from the template, e.g., ['topic', 'tone']
  inputVariables?: string[]; 
  model?: string; // e.g., 'gpt-3.5-turbo', 'ollama/mistral'
  temperature?: number; // OpenAI temperature
  top_p?: number; // Added
  presence_penalty?: number; // Added
  frequency_penalty?: number; // Added
  memoryEnabled?: boolean; // Toggle for local context chaining
  chatHistory?: Array<{role: 'user' | 'assistant', content: string}>; // For storing conversation history
  testInputValues?: Record<string, string>; // Added for storing test values
  inputs?: PortConfig[]; // Added for dynamic inputs
  outputs?: PortConfig[]; // Added for dynamic outputs
  // Later: tools, memoryConfig, etc.
}

interface CommentStub {
    id: string;
    // We only need to know if comments exist and how many, not their full content here
}

const LLMAgentNode: React.FC<NodeProps<LLMAgentNodeData>> = ({ id, data, isConnectable, selected }) => {
  const defaultLabel = 'LLM Agent';
  const defaultPrompt = 'Write a short paragraph about {{topic}} in a {{tone}} tone.';
  const { doc, provider } = useCollaborationStore(); // Get Yjs doc and provider
  const [commentCount, setCommentCount] = useState(0);

  // Use data.inputs and data.outputs directly; they should be provided by VisualWorkflowPage
  const inputs = data.inputs || []; // Fallback to empty array
  const outputs = data.outputs || []; // Fallback to empty array

  useEffect(() => {
    if (!doc || !provider) return; // Only run if collaboration is active

    const commentsMap = doc.getMap('comments');
    
    const updateCommentCount = () => {
      const nodeComments = (commentsMap.get(id) as CommentStub[] | undefined) || [];
      setCommentCount(nodeComments.length);
    };

    updateCommentCount(); // Initial count
    commentsMap.observeDeep(updateCommentCount); // Observe for changes

    return () => {
      commentsMap.unobserveDeep(updateCommentCount);
    };
  }, [doc, provider, id]);

  return (
    <div 
      className={`p-3 rounded-lg shadow-md w-64 bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-2 relative ${selected ? 'border-yellow-300 ring-2 ring-yellow-300' : 'border-transparent'}
    `}>
      {/* Comment Badge */}
      {provider && commentCount > 0 && (
        <div className="absolute top-[-8px] right-[-8px] bg-red-500 text-white text-xxs w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm" title={`${commentCount} comment${commentCount > 1 ? 's' : ''}`}>
          {commentCount}
          <FiMessageSquare className="w-2 h-2 ml-0.5 hidden" /> {/* Icon optional or use a simpler count number */}
        </div>
      )}

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
          className="!bg-gray-300 hover:!bg-gray-400 w-3 h-3 rounded-full !border-slate-400"
          style={{ top: inputs.length > 1 ? `${(index + 1) * (100 / (inputs.length + 1))}%` : '50%', left: -7 }}
        >
          <span className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-600 bg-white px-1 rounded shadow">
            {port.name}
          </span>
        </Handle>
      ))}
      
      <div className="flex items-center mb-2">
        <FiCpu className="w-5 h-5 mr-2 flex-shrink-0" />
        <strong className="text-sm truncate" title={data.label || defaultLabel}>{data.label || defaultLabel}</strong>
      </div>
      
      <div className="text-xs bg-black bg-opacity-20 p-2 rounded mb-2">
        <p className="font-mono truncate" title={data.promptTemplate || defaultPrompt}>
          {data.promptTemplate || defaultPrompt}
        </p>
      </div>
      
      {/* Placeholder for displaying derived input variables or other info */}
      {/* {data.inputVariables && data.inputVariables.length > 0 && (
        <div className="text-xxs text-indigo-200">
          Inputs: {data.inputVariables.join(', ')}
        </div>
      )} */}

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
          className="!bg-green-400 hover:!bg-green-500 w-3 h-3 rounded-full !border-white"
          style={{ top: outputs.length > 1 ? `${(index + 1) * (100 / (outputs.length + 1))}%` : '50%', right: -7 }}
        >
          <span className="absolute right-full mr-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-600 bg-white px-1 rounded shadow">
            {port.name}
          </span>
        </Handle>
      ))}
    </div>
  );
};

export default memo(LLMAgentNode); 