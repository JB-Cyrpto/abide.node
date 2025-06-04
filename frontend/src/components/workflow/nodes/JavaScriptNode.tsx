import React, { useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NodeData, NodePort } from '../../../types';
import Editor from '@monaco-editor/react';
import { Code, ChevronDown, ChevronUp, Zap, HelpCircle } from 'lucide-react';
import { useAIAssistantStore } from '../../../store/aiAssistantStore';
import { useWorkflowStore } from '../../../store/workflowStore';

interface JavaScriptEditorProps {
  code: string;
  onChange: (value: string) => void;
  onAIComplete: () => void;
  onAIGenerate: () => void;
  onAIExplain: () => void;
  onAIDebug: () => void;
  context: Record<string, any>;
}

const JavaScriptEditor: React.FC<JavaScriptEditorProps> = ({
  code,
  onChange,
  onAIComplete,
  onAIGenerate,
  onAIExplain,
  onAIDebug,
  context
}) => {
  const { isProcessing } = useAIAssistantStore();
  
  return (
    <div className="space-y-4">
      <div className="border rounded-md overflow-hidden">
        <div className="bg-gray-100 border-b px-3 py-2 flex items-center justify-between">
          <div className="text-sm font-medium">JavaScript Code</div>
          <div className="flex space-x-1">
            <button
              className="p-1 text-xs rounded hover:bg-gray-200 text-gray-700 flex items-center"
              onClick={onAIComplete}
              disabled={isProcessing}
            >
              <Zap size={14} className="mr-1" />
              Complete
            </button>
            <button
              className="p-1 text-xs rounded hover:bg-gray-200 text-gray-700 flex items-center"
              onClick={onAIGenerate}
              disabled={isProcessing}
            >
              <Zap size={14} className="mr-1" />
              Generate
            </button>
            <button
              className="p-1 text-xs rounded hover:bg-gray-200 text-gray-700 flex items-center"
              onClick={onAIExplain}
              disabled={isProcessing}
            >
              <HelpCircle size={14} className="mr-1" />
              Explain
            </button>
            <button
              className="p-1 text-xs rounded hover:bg-gray-200 text-gray-700 flex items-center"
              onClick={onAIDebug}
              disabled={isProcessing}
            >
              <HelpCircle size={14} className="mr-1" />
              Debug
            </button>
          </div>
        </div>
        <Editor
          height="200px"
          defaultLanguage="javascript"
          value={code}
          onChange={(value) => onChange(value || '')}
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
          }}
        />
      </div>
      
      {Object.keys(context).length > 0 && (
        <div className="border rounded-md overflow-hidden">
          <div className="bg-gray-100 border-b px-3 py-2">
            <div className="text-sm font-medium">Node Context</div>
          </div>
          <div className="p-3">
            <pre className="text-xs whitespace-pre-wrap">
              {JSON.stringify(context, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

const JavaScriptNode: React.FC<NodeProps<NodeData>> = ({ data, id, selected }) => {
  const [expanded, setExpanded] = useState(false);
  const { updateNode, getNodeContext, setNodeContext } = useWorkflowStore();
  const { 
    generateCompletion,
    generateCode,
    explainCode,
    debugCode,
    isProcessing,
  } = useAIAssistantStore();
  
  const nodeContext = getNodeContext(id);
  
  useEffect(() => {
    // Initialize node context if empty
    if (Object.keys(nodeContext).length === 0) {
      setNodeContext(id, {
        lastExecuted: null,
        executionCount: 0,
        lastResult: null,
      });
    }
  }, [id, nodeContext, setNodeContext]);
  
  const handleCodeChange = (code: string) => {
    updateNode(id, { code });
  };
  
  const handleCodeExecution = async () => {
    try {
      const result = await eval(`(async () => { ${data.code} })()`);
      setNodeContext(id, {
        ...nodeContext,
        lastExecuted: new Date(),
        executionCount: (nodeContext.executionCount || 0) + 1,
        lastResult: result,
      });
    } catch (error) {
      setNodeContext(id, {
        ...nodeContext,
        lastExecuted: new Date(),
        executionCount: (nodeContext.executionCount || 0) + 1,
        lastResult: null,
        error: error.message,
      });
    }
  };
  
  const handleAIComplete = async () => {
    try {
      const response = await generateCompletion(data.code || '');
      if (response.result) {
        handleCodeChange(response.result);
      }
    } catch (error) {
      console.error('Error completing code:', error);
    }
  };
  
  const handleAIGenerate = async () => {
    try {
      const prompt = window.prompt('Describe what you want the code to do:');
      if (prompt) {
        const response = await generateCode(prompt);
        if (response.result) {
          handleCodeChange(response.result);
        }
      }
    } catch (error) {
      console.error('Error generating code:', error);
    }
  };
  
  const handleAIExplain = async () => {
    try {
      const response = await explainCode(data.code || '');
      if (response.result) {
        alert(response.result);
      }
    } catch (error) {
      console.error('Error explaining code:', error);
    }
  };
  
  const handleAIDebug = async () => {
    try {
      const response = await debugCode(data.code || '');
      if (response.result) {
        handleCodeChange(response.result);
        
        if (response.explanation) {
          alert(response.explanation);
        }
      }
    } catch (error) {
      console.error('Error debugging code:', error);
    }
  };
  
  return (
    <div className={`rounded-lg shadow-md bg-white border ${selected ? 'border-primary-500' : 'border-border-light'} transition-all w-80`}>
      <div className={`flex items-center p-3 border-b ${selected ? 'bg-primary-50' : 'bg-gray-50'} rounded-t-lg`}>
        <div className="flex items-center flex-1">
          <div className="mr-2 text-gray-600"><Code size={16} /></div>
          <div className="font-medium text-gray-800 truncate">{data.label}</div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCodeExecution}
            className="p-1 rounded hover:bg-gray-200 text-gray-600"
          >
            <Zap size={16} />
          </button>
          <button 
            className="p-1 rounded-full hover:bg-gray-200 text-gray-600"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>
      
      {/* Inputs section always visible */}
      <div className="p-3 border-b">
        {data.inputs && data.inputs.length > 0 && (
          <div className="mb-2">
            <div className="text-xs font-medium text-gray-500 mb-1">Inputs</div>
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
      </div>
      
      {/* Expanded view */}
      {expanded && (
        <div className="p-3 border-b">
          <JavaScriptEditor
            code={data.code || 'return { success: true, data: {} }'}
            onChange={handleCodeChange}
            onAIComplete={handleAIComplete}
            onAIGenerate={handleAIGenerate}
            onAIExplain={handleAIExplain}
            onAIDebug={handleAIDebug}
            context={nodeContext}
          />
          
          {isProcessing && (
            <div className="mt-2 text-sm text-gray-600 animate-pulse-slow">
              AI is processing your request...
            </div>
          )}
        </div>
      )}
      
      {/* Outputs section always visible */}
      <div className="p-3">
        {data.outputs && data.outputs.length > 0 && (
          <div>
            <div className="text-xs font-medium text-gray-500 mb-1">Outputs</div>
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

export default JavaScriptNode;