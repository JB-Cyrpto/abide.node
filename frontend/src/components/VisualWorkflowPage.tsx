import React, { useState, useCallback, useMemo, useRef, DragEvent, MouseEvent as ReactMouseEvent, ChangeEvent, useEffect } from 'react';
import ReactFlow, {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  Controls,
  Background,
  ReactFlowProvider,
  ReactFlowInstance,
  NodeChange,
  XYPosition,
  Connection,
  useReactFlow,
  Viewport,
  EdgeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useContextMenu } from 'react-contexify';
import { FiSave, FiDownload, FiUpload, FiGrid, FiXCircle, FiClock, FiTrash2, FiGitCommit, FiHardDrive } from 'react-icons/fi';
import { v4 as uuidv4 } from 'uuid';

// Yjs imports
import * as Y from 'yjs';
import { useYjs } from '../hooks/useYjs';

// Import custom nodes
import TriggerNode from '../nodes/TriggerNode';
import ActionNode from '../nodes/ActionNode';
import LogicNode from '../nodes/LogicNode';
import LLMAgentNode from '../nodes/LLMAgentNode';
import GenericPluginNode from '../nodes/GenericPluginNode';
import CronTriggerNode from '../nodes/CronTriggerNode';
import WebhookTriggerNode from '../nodes/WebhookTriggerNode';
import Sidebar from './Sidebar';
import NodeContextMenu, { NODE_CONTEXT_MENU_ID } from './NodeContextMenu';
import LogPanel from './LogPanel';
import { WorkflowTemplate } from '../server/types'; // Import WorkflowTemplate type

// Import from pluginService
import { getPlugins as getSavablePlugins, SavableNodePlugin } from '../plugins/pluginService'; // Renamed import
import pluginRegistry from '../plugins/registry'; // Import pluginRegistry
import { NodePlugin } from '../plugins/sdk'; // For the final NodePlugin type

// Import PortConfig for defining default ports
import { PortConfig, DataType } from '../plugins/sdk';
import { TriggerNodeData } from '../nodes/TriggerNode';
import { ActionNodeData } from '../nodes/ActionNode';
import { LogicNodeData } from '../nodes/LogicNode';
import { LLMAgentNodeData } from '../nodes/LLMAgentNode'; // Add this import
import { CronTriggerNodeData } from '../nodes/CronTriggerNode'; // Add this import
import { WebhookTriggerNodeData } from '../nodes/WebhookTriggerNode'; // Add this import

// Import versioning functions and types
import {
  WorkflowVersion,
  RFState,
  getWorkflowVersions,
  saveWorkflowVersion,
  loadWorkflowVersion,
  deleteWorkflowVersion,
  clearAllWorkflowVersions
} from '../lib/workflowVersioning';

const getUniqueNodeId = () => `dndnode_${uuidv4()}`;

// Define default port configurations for built-in nodes
const defaultTriggerOutputPorts: PortConfig[] = [
  { id: 'output', name: 'Output', dataType: 'object', description: 'Data output when the trigger fires' }
];

const defaultActionInputPorts: PortConfig[] = [
  { id: 'input', name: 'Input', dataType: 'any', description: 'Input data for the action' }
];
const defaultActionOutputPorts: PortConfig[] = [
  { id: 'output', name: 'Result', dataType: 'object', description: 'Result of the action' }
];

const defaultLogicInputPorts: PortConfig[] = [
  { id: 'input', name: 'Input', dataType: 'any', description: 'Input data for the logic condition' }
];
const defaultLogicOutputPorts: PortConfig[] = [
  { id: 'output_true', name: 'True', dataType: 'any', description: 'Output if condition is true' },
  { id: 'output_false', name: 'False', dataType: 'any', description: 'Output if condition is false' }
];

// Initial nodes using the new custom types
const initialNodes: Node<TriggerNodeData | ActionNodeData | LLMAgentNodeData | CronTriggerNodeData | WebhookTriggerNodeData >[] = [
  { 
    id: '1', 
    type: 'trigger', 
    data: { 
      label: 'On App Start', 
      outputs: defaultTriggerOutputPorts
    }, 
    position: { x: 100, y: 50 } 
  },
  { 
    id: '2', 
    type: 'action', 
    data: { 
      label: 'Log Message', 
      actionType: 'Console Log',
      inputs: defaultActionInputPorts,
      outputs: defaultActionOutputPorts
    }, 
    position: { x: 350, y: 50 } 
  },
];

const initialEdges: Edge[] = [];

// Simple Modal Component (Inline for now)
interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => void;
}

const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!name.trim()) {
      alert('Template name is required.'); // Simple validation
      return;
    }
    onSave(name, description);
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', width: '400px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginTop: 0, marginBottom: '15px' }}>Save Workflow as Template</h2>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="templateName" style={{ display: 'block', marginBottom: '5px' }}>Template Name*</label>
          <input type="text" id="templateName" value={name} onChange={(e) => setName(e.target.value)} style={{ width: 'calc(100% - 16px)', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}/>
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="templateDesc" style={{ display: 'block', marginBottom: '5px' }}>Description</label>
          <textarea id="templateDesc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ width: 'calc(100% - 16px)', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}/>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ marginRight: '10px', padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSubmit} style={{ padding: '8px 12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save Template</button>
        </div>
      </div>
    </div>
  );
};

// Mock Templates Data (replace with actual data source later)
const mockTemplates: WorkflowTemplate[] = [
  {
    templateId: 'tmpl_basic_linear',
    templateName: 'Basic Linear Flow',
    templateDescription: 'A simple trigger followed by an action.',
    name: 'Basic Linear Flow',
    nodes: [
      { id: 't1', type: 'trigger', data: { label: 'Webhook Received' }, position: { x: 50, y: 50 } },
      { id: 'a1', type: 'action', data: { label: 'Send Email', actionType: 'SMTP' }, position: { x: 300, y: 50 } },
    ],
    edges: [{ id: 'e_t1_a1', source: 't1', target: 'a1', sourceHandle: 'output', targetHandle: 'input' }],
    createdAt: new Date().toISOString(),
  },
  {
    templateId: 'tmpl_llm_summary',
    templateName: 'LLM Content Summarizer',
    templateDescription: 'Receives text input and uses an LLM to summarize it.',
    name: 'LLM Content Summarizer',
    nodes: [
      { id: 'trig1', type: 'trigger', data: { label: 'Article Input' }, position: { x: 50, y: 150 } },
      { id: 'llm1', type: 'llm_agent', data: { label: 'Summarize Article', promptTemplate: 'Summarize the following text: {{article_text}}', inputVariables: ['article_text'], model: 'gpt-3.5-turbo', testInputValues: {article_text: 'Long article here...'} }, position: { x: 300, y: 150 } },
      { id: 'act1', type: 'action', data: { label: 'Save Summary', actionType: 'Database Write' }, position: { x: 550, y: 150 } },
    ],
    edges: [
      { id: 'e_trig1_llm1', source: 'trig1', target: 'llm1', sourceHandle: 'output', targetHandle: 'input' },
      { id: 'e_llm1_act1', source: 'llm1', target: 'act1', sourceHandle: 'output', targetHandle: 'input' },
    ],
    createdAt: new Date().toISOString(),
  },
];

interface LoadTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTemplate: (template: WorkflowTemplate) => void;
  templates: WorkflowTemplate[];
}

const LoadTemplateModal: React.FC<LoadTemplateModalProps> = ({ isOpen, onClose, onLoadTemplate, templates }) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', width: '500px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h2 style={{ marginTop: 0, marginBottom: '15px' }}>Load Workflow Template</h2>
          <button onClick={onClose} style={{background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer'}}><FiXCircle /></button>
        </div>
        {templates.length === 0 ? <p>No templates available.</p> :
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {templates.map(template => (
              <li key={template.templateId} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #eee', borderRadius: '4px', cursor: 'pointer' }} onClick={() => { onLoadTemplate(template); onClose(); }}>
                <h3 style={{ fontSize: '1.1em', margin: '0 0 5px 0' }}>{template.templateName}</h3>
                <p style={{ fontSize: '0.9em', margin: 0, color: '#555' }}>{template.templateDescription || 'No description.'}</p>
              </li>
            ))}
          </ul>
        }
      </div>
    </div>
  );
};

// New Modal for Managing Workflow Versions
interface VersionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: WorkflowVersion[];
  onLoadVersion: (versionId: string) => void;
  onDeleteVersion: (versionId: string) => void;
  onClearAll: () => void;
}

const VersionsModal: React.FC<VersionsModalProps> = (
  { isOpen, onClose, versions, onLoadVersion, onDeleteVersion, onClearAll }
) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050 // Higher zIndex
    }}>
      <div style={{
        background: 'white', padding: '20px', borderRadius: '8px', width: '600px',
        maxHeight: '80vh', boxShadow: '0 4px 8px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
          <h2 style={{ marginTop: 0, marginBottom: 0, fontSize: '1.4em' }}>Manage Workflow Versions</h2>
          <button onClick={onClose} style={{background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer'}}><FiXCircle /></button>
        </div>
        
        {versions.length === 0 ? (
          <p className="text-gray-600 py-4 text-center">No versions saved yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, overflowY: 'auto', flexGrow: 1 }}>
            {versions.map(version => (
              <li 
                key={version.versionId} 
                style={{
                  marginBottom: '10px', padding: '12px', border: '1px solid #eee', borderRadius: '6px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div>
                  <h3 style={{ fontSize: '1.05em', margin: '0 0 5px 0', fontWeight: 500 }}>{version.name}</h3>
                  <p style={{ fontSize: '0.85em', margin: 0, color: '#555' }}>
                    Saved: {new Date(version.createdAt).toLocaleString()}
                  </p>
                  <p style={{ fontSize: '0.8em', margin: '2px 0 0 0', color: '#777' }}>
                    Nodes: {version.nodes.length}, Edges: {version.edges.length}
                  </p>
                </div>
                <div className="space-x-2 flex items-center">
                  <button 
                    onClick={() => onLoadVersion(version.versionId)} 
                    className="p-2 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center"
                    title="Load this version"
                  >
                     <FiUpload className="mr-1 h-3 w-3" /> Load
                  </button>
                  <button 
                    onClick={() => onDeleteVersion(version.versionId)} 
                    className="p-2 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center"
                    title="Delete this version"
                  >
                    <FiTrash2 className="mr-1 h-3 w-3" /> Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {versions.length > 0 && (
          <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={() => {
                if (window.confirm('Are you sure you want to delete ALL workflow versions? This cannot be undone.')) {
                  onClearAll();
                }
              }}
              className="p-2 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors flex items-center"
              title="Clear all saved versions"
            >
              <FiTrash2 className="mr-1 h-3 w-3"/> Clear All History
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const VisualWorkflowPage: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  
  const { doc, provider, awareness, nodesMap: yNodesMap, edgesArray: yEdgesArray } = useYjs();

  const [nodes, setNodes] = useState<Node<any>[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [sidebarView, setSidebarView] = useState<'palette' | 'config'>('palette');
  const { show } = useContextMenu({ id: NODE_CONTEXT_MENU_ID });
  const { setViewport, toObject } = useReactFlow();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals state
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [isLoadTemplateModalOpen, setIsLoadTemplateModalOpen] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState<WorkflowTemplate[]>(mockTemplates); // Replace with actual fetch later
  const [isVersionsModalOpen, setIsVersionsModalOpen] = useState(false);
  const [workflowVersions, setWorkflowVersions] = useState<WorkflowVersion[]>([]);

  const [workflowName, setWorkflowName] = useState<string>('My Workflow');
  const [isLogPanelOpen, setIsLogPanelOpen] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);

  // Loaded plugins
  const [plugins, setPlugins] = useState<NodePlugin[]>([]);
  const [savablePlugins, setSavablePlugins] = useState<SavableNodePlugin[]>([]);

  const { project } = useReactFlow();

  // Effect to load plugins
  useEffect(() => {
    // Get runtime plugins from the registry
    const runtimePlugins = pluginRegistry.getAllPlugins();
    setPlugins(runtimePlugins);

    // Get savable plugin configurations
    const savablePluginConfigs = getSavablePlugins();
    setSavablePlugins(savablePluginConfigs);
    
    console.log("Loaded runtime plugins:", runtimePlugins);
    console.log("Loaded savable plugin configs:", savablePluginConfigs);
  }, []);

  // Helper to convert a plain JS object for a node to a Y.Map structure for nodes
  const convertNodeToYMap = (node: Node | Record<string, any>): Y.Map<any> => {
    const yNode = new Y.Map();
    Object.entries(node).forEach(([key, value]) => {
      if (key === 'data' && typeof value === 'object' && value !== null && !(value instanceof Y.Map)) {
        const yData = new Y.Map();
        Object.entries(value as Record<string, any>).forEach(([dKey, dValue]) => {
          yData.set(dKey, dValue);
        });
        yNode.set(key, yData);
      } else if (key === 'position' && typeof value === 'object' && value !== null && !(value instanceof Y.Map)) {
        const yPos = new Y.Map();
        Object.entries(value as Record<string, any>).forEach(([pKey, pValue]) => {
          yPos.set(pKey, pValue);
        });
        yNode.set(key, yPos);
      } else {
        yNode.set(key, value);
      }
    });
    return yNode;
  };

  // Yjs: Initialize and observe nodes
  useEffect(() => {
    if (!yNodesMap || !doc) return;

    const syncNodes = () => {
      const currentNodes: Node[] = [];
      yNodesMap.forEach((yNodeValue, id) => {
        // Ensure yNodeValue is treated as Y.Map<any>
        const nodeYMap = yNodeValue as Y.Map<any>; 
        const node = nodeYMap.toJSON() as Omit<Node, 'data' | 'position'> & { data: any, position: any };

        // Convert Y.Map data and position back to plain objects if they are Y.Maps
        const rawData = nodeYMap.get('data');
        node.data = rawData instanceof Y.Map ? rawData.toJSON() : rawData;
        
        const rawPosition = nodeYMap.get('position');
        node.position = rawPosition instanceof Y.Map ? rawPosition.toJSON() : rawPosition;
        
        currentNodes.push(node as Node);
      });
      setNodes(currentNodes);
    };

    // Initialize from initialNodes only if yNodesMap is empty and this client is not the first one to connect (avoid races)
    if (yNodesMap.size === 0 && initialNodes.length > 0 && doc.clientID !== 0) { 
      doc.transact(() => {
        initialNodes.forEach(node => {
          yNodesMap.set(node.id, convertNodeToYMap(node));
        });
      });
    } else if (yNodesMap.size > 0) { // If there are existing nodes in Yjs, sync them immediately
        syncNodes();
    }

    yNodesMap.observeDeep(syncNodes);

    return () => {
      yNodesMap.unobserveDeep(syncNodes);
    };
  }, [yNodesMap, doc]); // initialNodes is intentionally not a dependency to avoid re-populating

  // Yjs: Initialize and observe edges
  useEffect(() => {
    if (!yEdgesArray || !doc) return;

    const syncEdges = () => {
      const currentEdges = yEdgesArray.toArray().map(edgeMap => {
        const edgeObject: Record<string, any> = {};
        (edgeMap as Y.Map<any>).forEach((value, key) => {
          edgeObject[key] = value;
        });
        return { ...edgeObject } as Edge; // Ensure it's a new object for React state
      });
      setEdges(currentEdges);
    };
    
    if (yEdgesArray.length === 0 && initialEdges.length > 0 && doc.clientID !== 0) {
      doc.transact(() => {
        initialEdges.forEach(edge => {
          const yEdge = new Y.Map();
          Object.entries(edge).forEach(([key, value]) => {
            yEdge.set(key, value);
          });
          yEdgesArray.push([yEdge]);
        });
      });
    }

    syncEdges();
    yEdgesArray.observeDeep(syncEdges);

    return () => {
      yEdgesArray.unobserveDeep(syncEdges);
    };
  }, [yEdgesArray, doc]);

  const nodeTypes = useMemo(() => ({
    trigger: TriggerNode,
    action: ActionNode,
    logic: LogicNode,
    llm_agent: LLMAgentNode,
    cron_trigger: CronTriggerNode,
    webhook_trigger: WebhookTriggerNode,
    // GenericPluginNode will be added dynamically for plugin types
  }), []);

  const onNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // console.log("Local onNodesChange, changes:", changes);
      // Changes are applied to Yjs doc, which will then trigger setNodes via observer
      if (!yNodesMap || !doc) return;

      doc.transact(() => {
        changes.forEach(change => {
          // Type guard for selection changes
          if (change.type === 'select' && 'id' in change) {
            const node = yNodesMap.get(change.id)?.toJSON();
            if(node) {
               const nodeData = node.data instanceof Y.Map ? node.data.toJSON() : { ...node.data };
               setSelectedNode(change.selected ? { ...node, data: nodeData } as Node : null);
               if(change.selected) setSidebarView('config');
            }
            setNodes((nds) => applyNodeChanges([change], nds));
            return;
          }
          
          if (change.type === 'remove' && 'id' in change) {
            yNodesMap.delete(change.id);
            // Also remove related edges when a node is deleted by this client
            if (yEdgesArray) { // Null check for yEdgesArray
              const edgesToRemove = yEdgesArray.toArray().filter(edgeMap => {
                  const edge = edgeMap.toJSON();
                  return edge.source === change.id || edge.target === change.id;
              }).map(edgeMap => edgeMap.get('id'));
  
              if (edgesToRemove.length > 0 && doc) { // doc should also be checked, though less likely null here
                  const indicesToRemove: number[] = [];
                  for (let i = 0; i < yEdgesArray.length; i++) {
                      const yEdge = yEdgesArray.get(i) as Y.Map<any>;
                      if (edgesToRemove.includes(yEdge.get('id'))) {
                          indicesToRemove.push(i);
                      }
                  }
                  for (let i = indicesToRemove.length - 1; i >= 0; i--) {
                      yEdgesArray.delete(indicesToRemove[i], 1);
                  }
              }
            }

          } else if ('id' in change) { // Ensure 'id' exists for other change types that need it
            const yNode = yNodesMap.get(change.id);
            if (yNode) {
              if (change.type === 'position' && change.position) {
                // Ensure 'position' on yNode is a Y.Map
                let yPosition = yNode.get('position') as Y.Map<number>; 
                if (!(yPosition instanceof Y.Map)) {
                    yPosition = new Y.Map<number>();
                    yNode.set('position', yPosition);
                }
                if(change.position.x !== undefined) yPosition.set('x', change.position.x);
                if(change.position.y !== undefined) yPosition.set('y', change.position.y);
                
                if (change.dragging !== undefined) {
                  yNode.set('dragging', change.dragging);
                }
              } else if (change.type === 'dimensions' && change.dimensions) {
                 // Ensure 'width' and 'height' are Y.Map or handle appropriately
                 // For now, we reflect these changes, assuming they are numbers
                if (change.dimensions.width !== undefined) yNode.set('width', change.dimensions.width);
                if (change.dimensions.height !== undefined) yNode.set('height', change.dimensions.height);
              }
            }
          }
        });
      });
       setNodes((nds) => applyNodeChanges(changes.filter(c => c.type !== 'select'), nds));
    },
    [project, yNodesMap, yEdgesArray, doc, setNodes] 
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      // console.log("Local onEdgesChange, changes:", changes);
      if (!yEdgesArray || !doc) return;

      doc.transact(() => {
        changes.forEach(change => {
          if (change.type === 'remove') {
            // Find the index of the edge to remove
            let edgeIndex = -1;
            for (let i = 0; i < yEdgesArray.length; i++) {
              const yEdge = yEdgesArray.get(i) as Y.Map<any>;
              if (yEdge.get('id') === change.id) {
                edgeIndex = i;
                break;
              }
            }
            if (edgeIndex !== -1) {
              yEdgesArray.delete(edgeIndex, 1);
            }
          } else if (change.type === 'select') {
            // Edge selection is typically local and not synced, handle if needed
            // For now, let React Flow manage this locally.
             setEdges((eds) => applyEdgeChanges([change], eds));
            return;
          }
          // Other changes like add are handled by onConnect
        });
      });
      // Apply to local React Flow for immediate feedback
      setEdges((eds) => applyEdgeChanges(changes.filter(c => c.type !== 'select'), eds));
    },
    [yEdgesArray, doc, setEdges] // Added yEdgesArray, doc, setEdges
  );

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      // console.log("Local onConnect, connection:", connection);
      if (!yEdgesArray || !doc || !connection.source || !connection.target) return;
      
      const newEdge = { id: uuidv4(), ...connection };
      const yEdge = new Y.Map();
      Object.entries(newEdge).forEach(([key, value]) => {
        yEdge.set(key, value);
      });

      doc.transact(() => {
        yEdgesArray.push([yEdge]);
      });
      // Local update for immediate feedback, Yjs will confirm
      // setEdges((eds) => addEdge(newEdge, eds)); // This will be handled by yEdgesArray observer
    },
    [yEdgesArray, doc, setEdges] // Added yEdgesArray, doc, setEdges
  );

  const getHandleDataType = (nodeId: string, handleId: string, handleType: 'source' | 'target'): DataType | undefined => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return undefined;

    const portList = handleType === 'source' ? node.data.outputs : node.data.inputs;
    if (Array.isArray(portList)) {
      const port = portList.find((p: PortConfig) => p.id === handleId);
      return port?.dataType;
    }
    
    // Fallback for older nodes or nodes not yet updated (like LLMAgentNode, CronTriggerNode etc. if they still use data-type on Handle)
    // This part might be removable once all nodes use the new system
    if (node.type === 'cron_trigger') {
        if (handleType === 'source' && handleId === 'output') return 'object';
    }
    if (node.type === 'webhook_trigger') {
        if (handleType === 'source' && handleId === 'output') return 'object';
    }
    // For GenericPluginNode, data type is already on the handle's data-type attribute
    // which is not directly accessible here without inspecting the DOM element or passing it.
    // For now, we rely on the new system for plugin nodes if they conform.
    // The `isValidConnection` function might need to access `data-type` from the handle element if this isn't sufficient.

    return undefined; // Default if not found or not an array
  };

  const isValidConnection = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target || !connection.sourceHandle || !connection.targetHandle) {
        return false;
      }
      const sourceType = getHandleDataType(connection.source, connection.sourceHandle, 'source');
      const targetType = getHandleDataType(connection.target, connection.targetHandle, 'target');

      if (!sourceType || !targetType) {
        console.warn('Could not determine data type for one or both handles', connection, {sourceType, targetType});
        // Allow connection if a type is unknown to prevent blocking valid old connections,
        // or adjust this to be stricter as needed.
        return true; 
      }

      // console.log(`Connection attempt: ${sourceType} (source) -> ${targetType} (target)`);
      return sourceType === 'any' || targetType === 'any' || sourceType === targetType;
    },
    [nodes, getHandleDataType] // Ensure getHandleDataType is in dependencies
  );

  const updateNodeConfig = (nodeId: string, newData: any) => {
    if (!yNodesMap || !doc) return;

    const yNode = yNodesMap.get(nodeId);
    if (yNode) {
      doc.transact(() => {
        const yData = yNode.get('data') as Y.Map<any>; // Assume data is always a Y.Map
        if (yData) {
          Object.entries(newData).forEach(([key, value]) => {
            yData.set(key, value);
          });
        } else {
          // This case should ideally not happen if nodes are initialized correctly with Y.Map for data
          console.warn(`Yjs: Node ${nodeId} data is not a Y.Map. Recreating as Y.Map.`);
          const newYData = new Y.Map();
          Object.entries(newData).forEach(([key, value]) => {
            newYData.set(key, value);
          });
          yNode.set('data', newYData);
        }
      });
      // No need to call setNodes here, yNodesMap.observe will trigger it.
      // Update selected node for local UI responsiveness, if it's the one being configured.
      if (selectedNode && selectedNode.id === nodeId) {
        setSelectedNode(prevNode => ({
          ...prevNode!,
          data: { ...prevNode!.data, ...newData }, // Local update for immediate UI feedback
        }));
      }
    } else {
      console.warn("Yjs: updateNodeConfig - Node not found in yNodesMap:", nodeId);
    }
  };

  const onNodesDelete = useCallback((deleted: Node[]) => {
    const deletedIds = deleted.map(node => node.id);
    setEdges(eds => eds.filter(edge => !deletedIds.includes(edge.source) && !deletedIds.includes(edge.target)));
  }, [setEdges]);

  const onNodeContextMenu = useCallback(
    (event: ReactMouseEvent, node: Node) => {
      event.preventDefault();
      setSelectedNode(node);
      show({ event, props: { nodeId: node.id } });
    },
    [show, setSelectedNode]
  );

  const onNodeClick = useCallback((event: ReactMouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  const createNewNodeData = (nodeType: string, currentPlugins: NodePlugin[], nodeName?: string): any => {
    let baseData: any = { label: nodeName || `New ${nodeType}` };
  
    // Check built-in types first
    switch (nodeType) {
      case 'trigger':
        baseData = { ...baseData, label: nodeName || 'On Event', outputs: defaultTriggerOutputPorts };
        break;
      case 'action':
        baseData = { ...baseData, label: nodeName || 'Perform Action', actionType: 'Generic Action', inputs: defaultActionInputPorts, outputs: defaultActionOutputPorts };
        break;
      case 'logic':
        baseData = { ...baseData, label: nodeName || 'If Condition', logicType: 'Simple Condition', condition: '' , inputs: defaultLogicInputPorts, outputs: defaultLogicOutputPorts };
        break;
      case 'llm_agent':
        baseData = {
          ...baseData,
          label: nodeName || 'LLM Agent',
          promptTemplate: '{{input}}',
          inputVariables: ['input'],
          model: 'gpt-3.5-turbo',
          testInputValues: { input: 'Hello world' },
          inputs: [{ id: 'input', name: 'Input', dataType: 'object', description: 'Data for the LLM agent' }],
          outputs: [{ id: 'output', name: 'Output', dataType: 'string', description: 'Response from the LLM agent' }]
        };
        break;
      case 'cron_trigger':
        baseData = { ...baseData, label: nodeName || 'Cron Job', cronExpression: '*/5 * * * *', outputs: defaultTriggerOutputPorts };
        break;
      case 'webhook_trigger':
        baseData = { ...baseData, label: nodeName || 'Webhook', webhookPath: `/webhook/${uuidv4()}`, outputs: defaultTriggerOutputPorts };
        break;
      // Default case will be handled by plugin check or generic fallback
    }
  
    // Check registered plugins for default data
    const plugin = currentPlugins.find(p => p.id === nodeType);
    if (plugin && plugin.defaultData) {
      // Merge plugin default data, ensuring label from nodeName (if provided) or commonData takes precedence
      baseData = { ...plugin.defaultData, ...baseData, label: baseData.label || plugin.defaultData.label || `New ${nodeType}` };
      // Ensure plugin ports are added if not already set by specific cases above
      if (!baseData.inputs && plugin.inputs) baseData.inputs = plugin.inputs;
      if (!baseData.outputs && plugin.outputs) baseData.outputs = plugin.outputs;
    }
  
    return baseData;
  };

  const addNode = useCallback((type: string, position?: XYPosition, data?: any) => {
    if (!reactFlowInstance || !yNodesMap || !doc || !plugins) return;

    const targetPosition = position || reactFlowInstance.project({
      x: (reactFlowWrapper.current?.clientWidth || 400) / 2 - 75, 
      y: (reactFlowWrapper.current?.clientHeight || 300) / 2 - 20, 
    });

    const newNodeId = getUniqueNodeId(); 
    // If data is not provided, createNewNodeData is called. Pass a potential name if available.
    // If data IS provided, use it (it might already have a label from onDrop).
    const newNodeData = data || createNewNodeData(type, plugins, type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));

    const newNodeDefinition: Node = {
      id: newNodeId,
      type,
      position: targetPosition,
      data: newNodeData,
    };

    const yNode = convertNodeToYMap(newNodeDefinition);

    doc.transact(() => {
      yNodesMap.set(newNodeId, yNode);
    });
  }, [reactFlowInstance, yNodesMap, doc, plugins, convertNodeToYMap]); // Added plugins and convertNodeToYMap to dependencies

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      if (!reactFlowInstance) return;

      const type = event.dataTransfer.getData('application/reactflow-nodetype');
      const name = event.dataTransfer.getData('application/reactflow-nodename'); // Name from sidebar
      const defaultNodeDataString = event.dataTransfer.getData('application/reactflow-defaultdata');
      const defaultNodeData = defaultNodeDataString ? JSON.parse(defaultNodeDataString) : {};

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      // Create initial data, giving precedence to a name if dragged from sidebar
      const initialData = createNewNodeData(type, plugins, name || undefined);
      // Merge any specific default data passed from the drag source
      const finalData = { ...initialData, ...defaultNodeData, label: name || initialData.label };

      addNode(type, position, finalData);
    },
    [reactFlowInstance, plugins, addNode] // createNewNodeData is stable, addNode is now a dependency
  );
  
  // Simplified onDragStartSidebarNode signature for now
  const onDragStartSidebarNode = (event: DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow-nodetype', nodeType);
    // If we want to pass name and defaultData, Sidebar.tsx will need to accept them
    // For now, keeping it simple. The name for createNewNodeData will be derived in onDrop or addNode.
    // event.dataTransfer.setData('application/reactflow-nodename', nodeName);
    // if (defaultData) {
    // event.dataTransfer.setData('application/reactflow-defaultdata', JSON.stringify(defaultData));
    // }
    event.dataTransfer.effectAllowed = 'move';
  };

  const addNodeFromSidebar = (type: string, initialData?: any, nodeName?: string) => {
    if (!reactFlowInstance) return;
    const position = reactFlowInstance.project({
        x: (reactFlowWrapper.current?.clientWidth || 800) / 2 - 75 + (Math.random() * 100 - 50), // Centered with slight random offset
        y: (reactFlowWrapper.current?.clientHeight || 600) / 3 - 20 + (Math.random() * 50 - 25), // Higher on the screen
    });
    // Use the main addNode function
    const nodeData = initialData || createNewNodeData(type, plugins, nodeName || `New ${type}`);
    if (nodeName && !nodeData.label) nodeData.label = nodeName;
    addNode(type, position, nodeData);
  };

  const handleEditNode = (nodeId: string) => {
    const nodeToEdit = nodes.find(n => n.id === nodeId);
    if (nodeToEdit) setSelectedNode(nodeToEdit);
  };

  const handleDuplicateNode = (nodeId: string) => {
    if (!yNodesMap || !doc) return;
    const originalNodeMap = yNodesMap.get(nodeId);
    if (!originalNodeMap) return;

    const originalNode = originalNodeMap.toJSON() as Node; // Convert to plain object to read
    
    const newId = getUniqueNodeId();
    const newPosition = {
      x: (originalNode.position.x || 0) + 30,
      y: (originalNode.position.y || 0) + 30,
    };

    // Create a new node definition by deep cloning data and assigning new id/position
    const duplicatedNodeDefinition: Node = {
      ...originalNode,
      id: newId,
      position: newPosition,
      data: JSON.parse(JSON.stringify(originalNode.data)), // Deep clone data
      selected: false, // New node shouldn't be selected initially
    };

    const yDuplicatedNode = convertNodeToYMap(duplicatedNodeDefinition);

    doc.transact(() => {
      yNodesMap.set(newId, yDuplicatedNode);
    });
    // Yjs observer will update React Flow state
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode(null);
    }
  };

  const handleSaveAsTemplate = (templateName: string, templateDescription: string) => {
    if (!reactFlowInstance) return;
    const flowData = reactFlowInstance.toObject();
    const newTemplate: WorkflowTemplate = {
      templateId: uuidv4(),
      templateName,
      templateDescription,
      name: templateName,
      nodes: flowData.nodes,
      edges: flowData.edges,
      createdAt: new Date().toISOString(),
    };
    setAvailableTemplates(prev => [...prev, newTemplate]);
    console.log("Workflow saved as template:", newTemplate);
  };

  const handleExportWorkflow = () => {
    if (!reactFlowInstance) return;
    const flow = reactFlowInstance.toObject();
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(flow, null, 2))}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = 'workflow.json';
    link.click();
  };

  const handleImportWorkflow = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const flow = JSON.parse(e.target?.result as string);
          if (flow && flow.nodes && flow.edges) {
            setNodes(flow.nodes || []);
            setEdges(flow.edges || []);
            setViewport(flow.viewport || { x: 0, y: 0, zoom: 1 });
            let maxId = -1;
            flow.nodes.forEach((node: Node) => {
              const numericId = parseInt(node.id.replace(/[^0-9]/g, ''), 10);
              if (!isNaN(numericId) && numericId > maxId) {
                maxId = numericId;
              }
            });
            idCounter = maxId + 1;
          } else {
            alert('Invalid workflow file format.');
          }
        } catch (error) {
          console.error("Error importing workflow:", error);
          alert('Failed to import workflow file.');
        }
      };
      reader.readAsText(file);
      if(fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLoadTemplate = (template: WorkflowTemplate) => {
    setNodes(template.nodes || []);
    setEdges(template.edges || []);
    setViewport({ x: 0, y: 0, zoom: 1 });
    let maxId = -1;
    template.nodes.forEach((node: Node) => {
      const numericIdPart = node.id.replace(/[^0-9]/g, '');
      if (numericIdPart) {
        const numericId = parseInt(numericIdPart, 10);
        if (!isNaN(numericId) && numericId > maxId) {
          maxId = numericId;
        }
      }
    });
    idCounter = maxId >= 0 ? maxId + 1 : (template.nodes.length > 0 ? template.nodes.length : 0);
    setSelectedNode(null);
  };

  // --- Workflow Versioning Handlers ---
  const handleSaveCurrentVersion = () => {
    if (!reactFlowInstance) {
      alert("React Flow instance not available.");
      return;
    }
    const currentFlowState = reactFlowInstance.toObject() as RFState; // Cast to ensure viewport is included
    const savedVersion = saveWorkflowVersion(currentFlowState);
    if (savedVersion) {
      // Maybe show a small notification
      console.log("Workflow version saved:", savedVersion.name);
      // Optionally refresh currentVersionsList if modal might be open or to keep it fresh
      setWorkflowVersions(getWorkflowVersions());
    } else {
      alert("Failed to save workflow version.");
    }
  };

  const handleOpenVersionsModal = () => {
    setWorkflowVersions(getWorkflowVersions());
    setIsVersionsModalOpen(true);
  };

  const handleLoadVersion = (versionId: string) => {
    const versionToLoad = loadWorkflowVersion(versionId);
    if (versionToLoad && reactFlowInstance) {
      setNodes(versionToLoad.nodes || []);
      setEdges(versionToLoad.edges || []);
      setViewport(versionToLoad.viewport || { x: 0, y: 0, zoom: 1 });
      // Recalculate idCounter based on loaded nodes
      let maxId = -1;
      versionToLoad.nodes.forEach((node: Node) => {
        const numericIdPart = node.id.replace(/[^0-9]/g, '');
        if (numericIdPart) {
            const numericId = parseInt(numericIdPart, 10);
            if (!isNaN(numericId) && numericId > maxId) {
                maxId = numericId;
            }
        }
      });
      idCounter = maxId >= 0 ? maxId + 1 : (versionToLoad.nodes.length > 0 ? versionToLoad.nodes.length : 0);
      setSelectedNode(null);
      setIsVersionsModalOpen(false); // Close modal after loading
      console.log("Workflow version loaded:", versionToLoad.name);
    } else {
      alert("Failed to load workflow version.");
    }
  };

  const handleDeleteVersion = (versionId: string) => {
    if (deleteWorkflowVersion(versionId)) {
      setWorkflowVersions(getWorkflowVersions()); // Refresh list
    } else {
      alert("Failed to delete workflow version.");
    }
  };

  const handleClearAllVersions = () => {
    clearAllWorkflowVersions();
    setWorkflowVersions([]); // Clear list in UI
    // setIsVersionsModalOpen(false); // Optionally close modal
  };

  return (
    <div className="flex h-screen w-full bg-gray-100">
      <Sidebar 
        onDragStartNode={onDragStartSidebarNode}
        selectedNode={selectedNode}
        onUpdateNodeConfig={updateNodeConfig}
        onDeselectNode={() => setSelectedNode(null)}
        plugins={plugins}
        addNode={addNode}
      />
      <div className="flex-grow flex flex-col" ref={reactFlowWrapper}>
        <div className="h-12 bg-gray-200 border-b border-gray-300 flex items-center px-4 space-x-2 shadow-sm">
          <button onClick={() => setIsSaveTemplateModalOpen(true)} className="p-2 rounded hover:bg-gray-300 transition-colors" title="Save Workflow as Template"><FiSave className="text-gray-700" /></button>
          <button onClick={() => setIsLoadTemplateModalOpen(true)} className="p-2 rounded hover:bg-gray-300 transition-colors" title="Load Workflow from Template"><FiUpload className="text-gray-700" /></button>
          <button onClick={handleSaveCurrentVersion} className="p-2 rounded hover:bg-gray-300 transition-colors" title="Save Current Workflow Version"><FiClock className="text-gray-700" /></button>
          <button onClick={handleOpenVersionsModal} className="p-2 rounded hover:bg-gray-300 transition-colors" title="Manage Workflow Versions"><FiGitCommit className="text-gray-700" /></button>
          <button onClick={handleExportWorkflow} className="p-2 rounded hover:bg-gray-300 transition-colors" title="Export Workflow (JSON)"><FiDownload className="text-gray-700" /></button>
          <input type="file" ref={fileInputRef} onChange={handleImportWorkflow} accept=".json" style={{ display: 'none' }} />
          <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded hover:bg-gray-300 transition-colors" title="Import Workflow (JSON)"><FiUpload className="text-gray-700" /></button>
          <button onClick={() => setIsLogPanelOpen(!isLogPanelOpen)} className="p-2 rounded hover:bg-gray-300 transition-colors" title={isLogPanelOpen ? "Hide Logs" : "Show Logs"}><FiGrid className="text-gray-700" /></button>
        </div>

        <div className="flex-grow relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            fitView
            nodeTypes={nodeTypes}
            onNodeContextMenu={onNodeContextMenu}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            isValidConnection={isValidConnection}
            className="bg-gradient-to-br from-gray-50 to-gray-200"
          >
            <Controls className="bottom-4 left-4 !text-gray-600 !border-gray-400" />
            <Background color="#aaa" gap={20} size={1.5} />
          </ReactFlow>
        </div>
        {isLogPanelOpen && (
          <div className="w-full border-t border-gray-300 shadow-inner" style={{ height: '250px' }}>
            <LogPanel nodeId={selectedNode ? selectedNode.id : null} className="h-full" />
          </div>
        )}
      </div>
      <NodeContextMenu onEdit={handleEditNode} onDuplicate={handleDuplicateNode} onDelete={handleDeleteNode} />
      <SaveTemplateModal isOpen={isSaveTemplateModalOpen} onClose={() => setIsSaveTemplateModalOpen(false)} onSave={handleSaveAsTemplate} />
      <LoadTemplateModal isOpen={isLoadTemplateModalOpen} onClose={() => setIsLoadTemplateModalOpen(false)} onLoadTemplate={handleLoadTemplate} templates={availableTemplates} />
      <VersionsModal 
        isOpen={isVersionsModalOpen} 
        onClose={() => setIsVersionsModalOpen(false)} 
        versions={workflowVersions} 
        onLoadVersion={handleLoadVersion} 
        onDeleteVersion={handleDeleteVersion}
        onClearAll={handleClearAllVersions}
      />
    </div>
  );
};

const VisualWorkflowPageWithProvider: React.FC = () => (
  <ReactFlowProvider>
    <VisualWorkflowPage />
  </ReactFlowProvider>
);

export default VisualWorkflowPageWithProvider; 