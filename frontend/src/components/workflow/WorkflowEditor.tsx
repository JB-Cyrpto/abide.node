import React, { useCallback, useState } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useWorkflowStore } from '../../store/workflowStore';
import { useNodeDefinitionStore } from '../../store/nodeDefinitionStore';
import { useCollaborationStore } from '../../store/collaborationStore';
import { useLogStore } from '../../store/logStore';
import JavaScriptNode from './nodes/JavaScriptNode';
import GenericNode from './nodes/GenericNode';
import CollaborationPanel from '../collaboration/CollaborationPanel';
import LogPanel from '../logs/LogPanel';
import TriggerPanel from '../triggers/TriggerPanel';
import TemplateGallery from '../templates/TemplateGallery';
import { Plus, Users, FileText, Clock, Share2 } from 'lucide-react';
import CollaboratorCursors from '../collaboration/CollaboratorCursors';

const nodeTypes = {
  javascript: JavaScriptNode,
  default: GenericNode
};

const WorkflowEditor: React.FC = () => {
  const { nodes: storeNodes, edges: storeEdges, addNode, removeNode, addEdge: addStoreEdge, removeEdge } = useWorkflowStore();
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showTriggers, setShowTriggers] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  
  // Use React Flow's state management
  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges);
  
  const { getDefinitionByType } = useNodeDefinitionStore();
  const { updateCursor } = useCollaborationStore();
  
  // Sync React Flow state with our store
  React.useEffect(() => {
    setNodes(storeNodes);
    setEdges(storeEdges);
  }, [storeNodes, storeEdges, setNodes, setEdges]);
  
  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        addStoreEdge(
          connection.source,
          connection.sourceHandle,
          connection.target,
          connection.targetHandle
        );
      }
    },
    [addStoreEdge]
  );
  
  const onEdgeDelete = useCallback(
    (edge: Edge) => {
      removeEdge(edge.id);
    },
    [removeEdge]
  );
  
  const onNodeDelete = useCallback(
    (nodeId: string) => {
      removeNode(nodeId);
    },
    [removeNode]
  );
  
  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  
  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      
      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const nodeData = event.dataTransfer.getData('application/reactflow');
      
      if (!nodeData) return;
      
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };
      
      try {
        const { type } = JSON.parse(nodeData);
        const definition = getDefinitionByType(type);
        
        if (definition) {
          addNode(type, position, { 
            ...definition.defaultData, 
            label: definition.label 
          });
        }
      } catch (error) {
        console.error('Error adding node:', error);
      }
    },
    [addNode, getDefinitionByType]
  );
  
  const onMouseMove = useCallback((event: React.MouseEvent) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    updateCursor({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    });
  }, [updateCursor]);
  
  return (
    <div className="w-full h-full flex">
      <div className="flex-1 relative" onMouseMove={onMouseMove} onDragOver={onDragOver} onDrop={onDrop}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgesDelete={edges => edges.forEach(edge => onEdgeDelete(edge))}
          onNodesDelete={nodes => nodes.forEach(node => onNodeDelete(node.id))}
          nodeTypes={nodeTypes}
          fitView
          deleteKeyCode={['Backspace', 'Delete']}
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
        <CollaboratorCursors />
        
        {/* Quick Action Buttons */}
        <div className="absolute top-4 right-4 flex space-x-2">
          <button
            onClick={() => setShowCollaboration(!showCollaboration)}
            className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50"
          >
            <Users size={20} className="text-gray-700" />
          </button>
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50"
          >
            <FileText size={20} className="text-gray-700" />
          </button>
          <button
            onClick={() => setShowTriggers(!showTriggers)}
            className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50"
          >
            <Clock size={20} className="text-gray-700" />
          </button>
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50"
          >
            <Share2 size={20} className="text-gray-700" />
          </button>
        </div>
      </div>
      
      {/* Side Panels */}
      {showCollaboration && (
        <CollaborationPanel onClose={() => setShowCollaboration(false)} />
      )}
      {showLogs && (
        <LogPanel onClose={() => setShowLogs(false)} />
      )}
      {showTriggers && (
        <TriggerPanel onClose={() => setShowTriggers(false)} />
      )}
      {showTemplates && (
        <TemplateGallery onClose={() => setShowTemplates(false)} />
      )}
    </div>
  );
};

export default WorkflowEditor;