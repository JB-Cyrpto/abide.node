import React, { ChangeEvent, useState, useMemo, useEffect, DragEvent as ReactDragEvent } from 'react';
import { Node } from 'reactflow'; // Import Node type
import { LLMAgentNodeData } from '../nodes/LLMAgentNode'; // Import specific data type
import { CronTriggerNodeData } from '../nodes/CronTriggerNode'; // Import CronTriggerNodeData
import { WebhookTriggerNodeData } from '../nodes/WebhookTriggerNode'; // Import WebhookTriggerNodeData
import { executeLLMTest, LLMTestResult, fillPromptTemplate } from '../lib/llmUtils'; // Import LLM utils
import { FiPlay, FiX, FiMaximize2, FiMinimize2, FiSettings, FiTerminal, FiCopy, FiAlertCircle, FiCheckCircle, FiFileText, FiSearch, FiBox, FiZap, FiMessageSquare, FiGitBranch, FiCpu, FiClock, FiLink } from 'react-icons/fi'; // More icons
import { NodePlugin } from '../plugins/sdk'; // Import NodePlugin type
// import NodeComments from '../collaboration/NodeComments'; // Temporarily commented out
// import { useCollaborationStore } from '../../store/collaborationStore'; // Temporarily commented out

// Define specific data types for each node if they aren't already globally available
// For simplicity, we'll use 'any' for data fields here, but you should refine these
// based on your TriggerNodeData, ActionNodeData, LogicNodeData interfaces.
interface NodeData {
  label?: string;
  actionType?: string; // For ActionNode
  condition?: string;  // For LogicNode
  logicType?: string;  // For LogicNode
  // Add other specific fields from your node data types
}

// Combined NodeData type for convenience in SidebarProps
interface CombinedNodeData extends LLMAgentNodeData, CronTriggerNodeData, WebhookTriggerNodeData {
  label?: string;
  actionType?: string; 
  condition?: string;  
  logicType?: string;  
  // Fields from LLMAgentNodeData are now inherited
  // Fields from CronTriggerNodeData are now inherited (cronString, timezone, isRunning etc.)
  // promptTemplate?: string; 
  // inputVariables?: string[]; 
  // model?: string; 
  // testInputValues?: Record<string, string>;
  // temperature?: number; // Already in LLMAgentNodeData
  // memoryEnabled?: boolean; // Already in LLMAgentNodeData
  // chatHistory?: Array<{role: 'user' | 'assistant', content: string}>; // Already in LLMAgentNodeData
  [key: string]: any; // Allow other properties for plugin data
}

interface SidebarProps {
  selectedNode: Node<CombinedNodeData> | null; // Use combined data type
  onUpdateNodeConfig: (nodeId: string, newData: Partial<CombinedNodeData>) => void;
  onDeselectNode: () => void;
  plugins: NodePlugin[]; // Added plugins prop
  onDragStartNode: (event: ReactDragEvent<HTMLDivElement>, nodeType: string) => void; // For dragging from palette
  addNode: (type: string, position?: { x: number; y: number }, data?: any) => void; // For adding nodes programmatically
}

interface PaletteNode {
  type: string;
  label: string;
  description?: string;
  category?: string;
  icon?: React.ReactElement;
  plugin?: NodePlugin; 
}

// Removed initialNodeTypesAvailable as it will be generated from the plugin registry

// Function to parse {{variables}} from a prompt string
const parseInputVariables = (template: string): string[] => {
  if (!template) return [];
  const regex = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;
  const matches = new Set<string>();
  let match;
  while ((match = regex.exec(template)) !== null) {
    matches.add(match[1]);
  }
  return Array.from(matches);
};

const renderConfigFields = (
  node: Node<CombinedNodeData>, 
  onUpdateNodeConfig: SidebarProps['onUpdateNodeConfig'], 
  onToggleSandbox: () => void, 
  plugin?: NodePlugin
) => {
  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = event.target;
    let processedValue: any = value;
    if (type === 'checkbox') {
      processedValue = (event.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      processedValue = parseFloat(value);
    } else if (name === 'cronString' && node.type === 'cron_trigger') {
      // Validation is primarily handled by the node itself.
      // UI feedback for invalid cron can be enhanced here if needed.
    }

    let updateData: Partial<CombinedNodeData> = { [name]: processedValue };

    if (name === 'promptTemplate' && (node.type === 'llm_agent' || plugin?.id === 'llm_agent')) { 
      const newVars = parseInputVariables(value);
      const oldTestValues = (node.data as LLMAgentNodeData).testInputValues || {};
      const newTestValues: Record<string, string> = {};
      newVars.forEach(key => { newTestValues[key] = oldTestValues[key] || ''; });
      updateData.inputVariables = newVars;
      updateData.testInputValues = newTestValues;
    }
    onUpdateNodeConfig(node.id, updateData);
  };

  const handleTestInputChange = (variableName: string, value: string) => {
    const currentTestData = (node.data as LLMAgentNodeData).testInputValues || {};
    const newTestValues = { ...currentTestData, [variableName]: value };
    onUpdateNodeConfig(node.id, { testInputValues: newTestValues } as Partial<CombinedNodeData>);
  };
  
  const commonLabelField = (
    <div className="mb-4">
      <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-1">Label</label>
      <input
        type="text"
        id="label"
        name="label"
        value={node.data.label || plugin?.defaultData?.label || node.data.label || ''}
        onChange={handleInputChange}
        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      />
    </div>
  );

  if (plugin && plugin.configFields && plugin.configFields.length > 0) {
    return (
        <>
            {commonLabelField}
            {plugin.configFields.filter(field => field.name !== 'label').map(field => {
                const fieldName = field.name as keyof CombinedNodeData;
                const fieldValue = node.data[fieldName] !== undefined ? node.data[fieldName] : field.defaultValue;
                switch (field.type) {
                    case 'text':
                        return (
                            <div key={String(fieldName)} className="mb-4">
                                <label htmlFor={String(fieldName)} className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                                <textarea
                                    id={String(fieldName)}
                                    name={String(fieldName)}
                                    value={(fieldValue as string) || ''}
                                    onChange={handleInputChange}
                                    rows={3}
                                    placeholder={field.placeholder}
                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                                />
                            </div>
                        );
                    case 'boolean':
                        return (
                            <div key={String(fieldName)} className="mb-4 flex items-center">
                                <input
                                    type="checkbox"
                                    id={String(fieldName)}
                                    name={String(fieldName)}
                                    checked={!!fieldValue}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded mr-2"
                                />
                                <label htmlFor={String(fieldName)} className="text-sm font-medium text-gray-700">{field.label}</label>
                            </div>
                        );
                    case 'select':
                        return (
                            <div key={String(fieldName)} className="mb-4">
                                <label htmlFor={String(fieldName)} className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                                <select
                                    id={String(fieldName)}
                                    name={String(fieldName)}
                                    value={(fieldValue as string) || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white"
                                >
                                    {field.options?.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        );
                    case 'number':
                    case 'string': 
                    default:
                        return (
                            <div key={String(fieldName)} className="mb-4">
                                <label htmlFor={String(fieldName)} className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                                <input
                                    type={field.type === 'number' ? 'number' : 'text'}
                                    id={String(fieldName)}
                                    name={String(fieldName)}
                                    value={(fieldValue as string | number) || ''}
                                    onChange={handleInputChange}
                                    placeholder={field.placeholder}
                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                                />
                            </div>
                        );
                }
            })}
            {node.type === 'llm_agent' && ( // This should likely be driven by plugin capabilities too
                <div className="mt-6 mb-4">
                    <button
                        onClick={onToggleSandbox}
                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                        <FiTerminal className="mr-2 h-5 w-5" /> Test LLM Agent (Sandbox)
                    </button>
                </div>
            )}
        </>
    );
  }

  // Fallback to old hardcoded fields if no plugin.configFields
  switch (node.type) {
    case 'action':
      return (
        <>
          {commonLabelField}
          <div className="mb-4">
            <label htmlFor="actionType" className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
            <input
              type="text"
              id="actionType"
              name="actionType"
              value={node.data.actionType || ''}
              onChange={handleInputChange}
              placeholder="e.g., HTTP Request, Console Log"
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </>
      );
    case 'logic':
      return (
        <>
          {commonLabelField}
          <div className="mb-4">
            <label htmlFor="logicType" className="block text-sm font-medium text-gray-700 mb-1">Logic Type</label>
            <input
              type="text"
              id="logicType"
              name="logicType"
              value={node.data.logicType || ''}
              onChange={handleInputChange}
              placeholder="e.g., If/Else, Switch"
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
            <textarea
              id="condition"
              name="condition"
              value={node.data.condition || ''}
              onChange={handleInputChange}
              rows={3}
              placeholder="e.g., inputs.value > 10"
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
            />
          </div>
        </>
      );
    case 'llm_agent':
      const llmData = node.data as LLMAgentNodeData;
      return (
        <>
          {commonLabelField}
          <div className="mb-4">
            <label htmlFor="promptTemplate" className="block text-sm font-medium text-gray-700 mb-1">Prompt Template</label>
            <textarea
              id="promptTemplate"
              name="promptTemplate"
              value={llmData.promptTemplate || ''}
              onChange={handleInputChange}
              rows={5}
              placeholder="e.g., Translate {{text}} to {{language}}."
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">Model</label>
            <input
              type="text"
              id="model"
              name="model"
              value={llmData.model || 'gpt-3.5-turbo'}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
            <input
              type="number"
              id="temperature"
              name="temperature"
              value={llmData.temperature === undefined ? 0.7 : llmData.temperature}
              onChange={handleInputChange}
              step="0.1"
              min="0"
              max="2"
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              id="memoryEnabled"
              name="memoryEnabled"
              checked={!!llmData.memoryEnabled}
              onChange={handleInputChange}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded mr-2"
            />
            <label htmlFor="memoryEnabled" className="text-sm font-medium text-gray-700">Enable Memory (Chat History)</label>
          </div>

          {(llmData.inputVariables && llmData.inputVariables.length > 0) && (
            <div className="mb-4 p-3 border border-gray-200 rounded-md bg-gray-50">
              <h4 className="text-xs font-semibold text-gray-600 mb-2">Test Input Variables:</h4>
              {llmData.inputVariables.map(variable => (
                <div key={variable} className="mb-2">
                  <label htmlFor={`test_${variable}`} className="block text-xs font-medium text-gray-500 mb-0.5">{variable}</label>
                  <input
                    type="text"
                    id={`test_${variable}`}
                    value={llmData.testInputValues?.[variable] || ''}
                    onChange={(e) => handleTestInputChange(variable, e.target.value)}
                    className="w-full p-1.5 border border-gray-300 rounded-md shadow-sm sm:text-xs"
                  />
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 mb-4">
            <button 
              onClick={onToggleSandbox}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <FiTerminal className="mr-2 h-5 w-5" /> Test LLM Agent (Sandbox)
            </button>
          </div>
        </>
      );
    case 'cron_trigger': { // Added block scope for clarity
      const cronData = node.data as CronTriggerNodeData;
      const cronErrorString = typeof node.data.error === 'string' ? node.data.error : null;
      const nextRunValidString = typeof node.data.nextRun === 'string' && node.data.nextRun !== 'Invalid cron string' ? node.data.nextRun : null;
      const lastRunValidString = typeof node.data.lastRun === 'string' ? node.data.lastRun : null;

      return (
        <>
          {commonLabelField}
          <div className="mb-4">
            <label htmlFor="cronString" className="block text-sm font-medium text-gray-700 mb-1">Cron String</label>
            <input
              type="text"
              id="cronString"
              name="cronString"
              value={cronData.cronString || ''}
              onChange={handleInputChange}
              placeholder="* * * * *"
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm font-mono focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            {cronErrorString && <p className="text-xs text-red-500 mt-1">{cronErrorString}</p>}
          </div>
          <div className="mb-4">
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">Timezone (Optional)</label>
            <input
              type="text"
              id="timezone"
              name="timezone"
              value={cronData.timezone || ''}
              onChange={handleInputChange}
              placeholder="e.g., America/New_York, UTC. Defaults to browser/server."
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              id="isRunning"
              name="isRunning"
              checked={cronData.isRunning === undefined ? true : !!cronData.isRunning}
              onChange={handleInputChange}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded mr-2 focus:ring-indigo-500"
            />
            <label htmlFor="isRunning" className="text-sm font-medium text-gray-700">Enable Cron Job</label>
          </div>
          {nextRunValidString && !cronErrorString && 
            <p className="text-xs text-gray-600 mb-1">Next run: {new Date(nextRunValidString).toLocaleString()}</p>}
          {lastRunValidString && 
            <p className="text-xs text-gray-600">Last run: {new Date(lastRunValidString).toLocaleString()}</p>}
        </>
      );
    }
    case 'webhook_trigger': { // Added block scope for clarity
      const webhookData = node.data as WebhookTriggerNodeData;
      const lastTriggeredValidString = typeof webhookData.lastTriggered === 'string' ? webhookData.lastTriggered : null;
      
      return (
        <>
          {commonLabelField}
          <div className="mb-4">
            <label htmlFor="webhookIdDisplay" className="block text-sm font-medium text-gray-700 mb-1">Webhook ID</label>
            <input
              type="text"
              id="webhookIdDisplay"
              name="webhookIdDisplay"
              value={webhookData.webhookId || node.id}
              readOnly
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 sm:text-sm font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">The full webhook URL is displayed on the node.</p>
          </div>
          {lastTriggeredValidString && 
            <p className="text-xs text-gray-600 mb-1">
              Last triggered: {new Date(lastTriggeredValidString).toLocaleString()}
            </p>}
          {webhookData.lastPayload && (
            <details className="mt-1 text-xs mb-4">
              <summary className="cursor-pointer text-gray-500 hover:text-gray-700">Show last payload</summary>
              <pre className="mt-1 p-2 bg-gray-50 border rounded max-h-32 overflow-auto text-gray-600 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {JSON.stringify(webhookData.lastPayload, null, 2)}
              </pre>
            </details>
          )}
        </>
      );
    }
    default:
      return commonLabelField;
  }
};

const MAX_CHAT_HISTORY_TURNS = 5; // Keep the last 5 pairs of user/assistant messages

const Sidebar: React.FC<SidebarProps> = ({ selectedNode, onUpdateNodeConfig, onDeselectNode, plugins, onDragStartNode, addNode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSandbox, setShowSandbox] = useState(false);
  const [sandboxResult, setSandboxResult] = useState<LLMTestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [activeTab, setActiveTab] = useState('palette'); // 'palette' or 'config' or 'sandbox'
  const [isMaximized, setIsMaximized] = useState(false);

  // Determine current plugin for selected node (if any)
  const currentPlugin = useMemo(() => {
    if (selectedNode && plugins.find(p => p.id === selectedNode.type)) {
      return plugins.find(p => p.id === selectedNode.type);
    }
    return undefined;
  }, [selectedNode, plugins]);

  useEffect(() => {
    if (selectedNode) {
      setActiveTab('config');
      setShowSandbox(false); // Reset sandbox view when node changes
    } else {
      setActiveTab('palette');
    }
  }, [selectedNode]);

  const handleToggleSandbox = () => {
    if (activeTab === 'sandbox') {
      setActiveTab('config');
      setShowSandbox(false);
    } else {
      setActiveTab('sandbox');
      setShowSandbox(true);
      setSandboxResult(null); // Clear previous results when opening sandbox
    }
  };

  const handleRunTest = async () => {
    if (selectedNode && selectedNode.type === 'llm_agent') {
      const data = selectedNode.data as LLMAgentNodeData;
      if (!data.promptTemplate || !data.testInputValues) {
        setSandboxResult({ success: false, error: 'Prompt template or test input values are missing.', filledPrompt: '' });
        return;
      }
      setIsTesting(true);
      try {
        const result = await executeLLMTest(data.promptTemplate, data.testInputValues, data.model, data.temperature);
        setSandboxResult(result);
      } catch (error: any) {
        setSandboxResult({ success: false, error: error.message || 'An unknown error occurred during testing.', filledPrompt: fillPromptTemplate(data.promptTemplate, data.testInputValues) });
      }
      setIsTesting(false);
    }
  };

  const handleCopyText = (text: string | undefined) => {
    if (text) {
      navigator.clipboard.writeText(text).then(() => {
        // console.log('Text copied to clipboard');
        // Optionally, show a small notification
      }).catch(err => {
        console.error('Failed to copy text: ', err);
      });
    }
  };

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: string) => {
    onDragStartNode(event, nodeType);
  };

  const availableNodeTypes: PaletteNode[] = useMemo(() => {
    const coreNodes: PaletteNode[] = [
      {
        type: 'trigger',
        label: 'Generic Trigger',
        description: 'A standard event-based trigger.',
        category: 'Triggers',
        icon: <FiZap className="text-purple-500" />,
      },
      {
        type: 'cron_trigger',
        label: 'Cron Schedule Trigger',
        description: 'Triggers workflow on a CRON schedule.',
        category: 'Triggers',
        icon: <FiClock className="text-teal-500" />,
      },
      {
        type: 'webhook_trigger', // Add WebhookTrigger to palette
        label: 'Webhook Trigger',
        description: 'Triggers workflow via an HTTP POST request.',
        category: 'Triggers',
        icon: <FiLink className="text-indigo-500" />,
      },
      {
        type: 'action',
        label: 'Action',
        description: 'Performs a specific task.',
        category: 'Actions',
        icon: <FiPlay className="text-blue-500" />,
      },
      {
        type: 'logic',
        label: 'Logic',
        description: 'Controls flow with conditional logic.',
        category: 'Control Flow',
        icon: <FiGitBranch className="text-yellow-500" />
      },
      {
        type: 'llm_agent',
        label: 'LLM Agent',
        description: 'Interacts with a Large Language Model.',
        category: 'AI / LLM',
        icon: <FiCpu className="text-pink-500" />
      }
    ];

    const pluginNodes: PaletteNode[] = plugins.map(plugin => ({
      type: plugin.id,
      label: plugin.name,
      description: plugin.description,
      category: plugin.category || 'Custom Plugins',
      icon: <FiBox className="text-gray-500" />, // Default icon for plugins
      plugin: plugin
    }));

    return [...coreNodes, ...pluginNodes];
  }, [plugins]);

  const filteredNodes = useMemo(() => {
    if (!searchTerm) return availableNodeTypes;
    return availableNodeTypes.filter(node => 
      node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (node.description && node.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      node.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, availableNodeTypes]);

  const groupedNodes = useMemo(() => {
    return filteredNodes.reduce((acc, node) => {
      const category = node.category || 'Miscellaneous';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(node);
      return acc;
    }, {} as Record<string, PaletteNode[]>);
  }, [filteredNodes]);

  const renderPalette = () => (
    <div className={`p-1 ${isMaximized ? '' : 'overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100'}`}>
      <div className="p-3 sticky top-0 bg-white z-10">
        <input 
          type="text" 
          placeholder="Search nodes..." 
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      {Object.entries(groupedNodes).sort(([catA], [catB]) => catA.localeCompare(catB)).map(([category, nodesInCategory]) => (
        <div key={category} className="mb-4 px-2">
          <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2 px-1 tracking-wider">{category}</h3>
          {nodesInCategory.map((nodeEntry) => (
            <div 
              key={nodeEntry.type} 
              onDragStart={(event) => handleDragStart(event, nodeEntry.type)} 
              draggable 
              className="flex items-center p-2.5 mb-1.5 rounded-md hover:bg-indigo-50 cursor-grab transition-colors border border-gray-200 bg-white shadow-sm"
            >
              {nodeEntry.icon && <span className="mr-3 text-lg">{nodeEntry.icon}</span>}
              <div>
                <div className="font-medium text-sm text-gray-800">{nodeEntry.label}</div>
                {nodeEntry.description && <p className="text-xs text-gray-500">{nodeEntry.description}</p>}
              </div>
            </div>
          ))}
        </div>
      ))}
      {filteredNodes.length === 0 && <p className="text-center text-gray-500 py-4">No nodes found.</p>}
    </div>
  );

  const renderConfigPanel = () => {
    if (!selectedNode) return <div className="p-6 text-center text-gray-500">Select a node to configure its properties.</div>;
    
    return (
      <div className={`p-5 ${isMaximized ? '' : 'overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100'}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 truncate pr-2" title={selectedNode.data.label || selectedNode.type}>
             {selectedNode.data.label || selectedNode.type}
          </h3>
          <button 
            onClick={onDeselectNode} 
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            title="Close Configuration"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
        {renderConfigFields(selectedNode as Node<CombinedNodeData>, onUpdateNodeConfig, handleToggleSandbox, currentPlugin)}
        
        {/* Node Comments - Temporarily commented out */}
        {/* {selectedNode && 
          <div className="mt-6 pt-4 border-t border-gray-200">
            <NodeComments nodeId={selectedNode.id} /> 
          </div>
        } */}
      </div>
    );
  };

  const renderLLMSandbox = () => {
    if (!selectedNode || selectedNode.type !== 'llm_agent') return null;
    const data = selectedNode.data as LLMAgentNodeData;
    const filledPrompt = fillPromptTemplate(data.promptTemplate || '', data.testInputValues || {});

    return (
      <div className={`p-5 ${isMaximized ? '' : 'overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100'}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">LLM Agent Sandbox</h3>
          <button 
            onClick={handleToggleSandbox} 
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            title="Back to Configuration"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 text-sm">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Node</label>
            <p className="p-2 bg-gray-100 rounded-md text-gray-700">{data.label} ({selectedNode.id})</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Model</label>
            <p className="p-2 bg-gray-100 rounded-md text-gray-700">{data.model}</p>
          </div>
           <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Temperature</label>
            <p className="p-2 bg-gray-100 rounded-md text-gray-700">{data.temperature !== undefined ? data.temperature : 'Default'}</p>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-medium text-gray-500">Prompt Template</label>
              <button onClick={() => handleCopyText(data.promptTemplate)} title="Copy Prompt Template" className="text-xs text-blue-500 hover:text-blue-700"><FiCopy className="inline mr-1"/>Copy</button>
            </div>
            <pre className="p-3 bg-gray-800 text-gray-200 rounded-md text-xs font-mono overflow-x-auto max-h-32 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-700">{data.promptTemplate || 'No prompt template set.'}</pre>
          </div>

          {(data.inputVariables && data.inputVariables.length > 0) && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Test Input Values</label>
              <div className="p-3 bg-gray-100 rounded-md space-y-1.5 text-xs">
                {Object.entries(data.testInputValues || {}).map(([key, value]) => (
                    <div key={key} className="flex">
                        <span className="font-semibold text-gray-600 w-1/3 truncate" title={key}>{key}:</span> 
                        <span className="text-gray-800 w-2/3 truncate" title={value}>{value}</span>
                    </div>
                ))}
                {Object.keys(data.testInputValues || {}).length === 0 && <p className="text-gray-500 italic">No test values provided.</p>}
              </div>
            </div>
          )}
          
          <div className="mt-6">
            <button 
              onClick={handleRunTest} 
              disabled={isTesting} 
              className="w-full flex items-center justify-center px-4 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60"
            >
              {isTesting ? (
                <><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Processing...</>
              ) : <><FiPlay className="mr-2 h-5 w-5"/>Run Test</>}
            </button>
          </div>

          {sandboxResult && (
            <div className="mt-5 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                {sandboxResult.success ? <FiCheckCircle className="text-green-500 mr-2 h-5 w-5"/> : <FiAlertCircle className="text-red-500 mr-2 h-5 w-5"/>}
                Test Result
              </h4>
              {sandboxResult.filledPrompt && (
                 <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-medium text-gray-500">Filled Prompt</label>
                        <button onClick={() => handleCopyText(sandboxResult.filledPrompt)} title="Copy Filled Prompt" className="text-xs text-blue-500 hover:text-blue-700"><FiCopy className="inline mr-1"/>Copy</button>
                    </div>
                    <pre className="p-3 bg-gray-800 text-gray-200 rounded-md text-xs font-mono overflow-x-auto max-h-32 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-700">{sandboxResult.filledPrompt}</pre>
                </div>
              )}
              {sandboxResult.output && (
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-medium text-gray-500">LLM Output</label>
                    <button onClick={() => handleCopyText(sandboxResult.output)} title="Copy Output" className="text-xs text-blue-500 hover:text-blue-700"><FiCopy className="inline mr-1"/>Copy</button>
                  </div>
                  <pre className="p-3 bg-gray-100 text-gray-800 rounded-md text-xs whitespace-pre-wrap overflow-x-auto max-h-40 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">{sandboxResult.output}</pre>
                </div>
              )}
              {sandboxResult.error && (
                <div className="mt-3">
                  <label className="block text-xs font-medium text-red-600 mb-1">Error</label>
                  <pre className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-xs whitespace-pre-wrap overflow-x-auto max-h-40 scrollbar-thin scrollbar-thumb-red-300 scrollbar-track-red-100">{sandboxResult.error}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const sidebarWidthClass = isMaximized ? "w-full md:w-1/2 lg:w-1/3 xl:w-1/4" : "w-80"; // Adjust widths as needed
  const mainContentFlexClass = isMaximized ? "flex-1 min-w-0" : "flex-1"; // For main content area with ReactFlow

  return (
    <aside className={`bg-white border-r border-gray-200 shadow-lg flex flex-col transition-all duration-300 ease-in-out ${sidebarWidthClass}`}>
      <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <div className="flex space-x-1">
          <button 
            onClick={() => setActiveTab('palette')} 
            className={`px-3 py-1.5 text-sm font-medium rounded-md focus:outline-none transition-colors ${activeTab === 'palette' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
          >
            <FiBox className="inline mr-1.5 mb-0.5"/> Nodes
          </button>
          {selectedNode && (
            <button 
              onClick={() => setActiveTab(showSandbox ? 'sandbox' : 'config')} 
              className={`px-3 py-1.5 text-sm font-medium rounded-md focus:outline-none transition-colors ${activeTab !== 'palette' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
            >
              {activeTab === 'sandbox' ? <FiTerminal className="inline mr-1.5 mb-0.5" /> : <FiSettings className="inline mr-1.5 mb-0.5"/>}
              {activeTab === 'sandbox' ? 'Sandbox' : 'Config'}
            </button>
          )}
        </div>
        <button 
          onClick={() => setIsMaximized(!isMaximized)} 
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
          title={isMaximized ? "Minimize Sidebar" : "Maximize Sidebar"}
        >
          {isMaximized ? <FiMinimize2 className="h-4 w-4" /> : <FiMaximize2 className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex-grow min-h-0"> {/* This div takes remaining space and allows scrolling for its children */}
        {activeTab === 'palette' && renderPalette()}
        {activeTab === 'config' && renderConfigPanel()}
        {activeTab === 'sandbox' && renderLLMSandbox()}
      </div>
      
    </aside>
  );
};

export default Sidebar; 