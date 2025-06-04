import { create } from 'zustand';
import { 
  Node, 
  Edge, 
  Workflow,
  WorkflowContext
} from '../types';
import { nanoid } from 'nanoid';

interface WorkflowState {
  workflows: Workflow[];
  activeWorkflowId: string | null;
  nodes: Node[];
  edges: Edge[];
  context: WorkflowContext;
  
  // Workflow Actions
  createWorkflow: (name: string, description: string) => string;
  deleteWorkflow: (id: string) => void;
  setActiveWorkflow: (id: string) => void;
  updateWorkflow: (id: string, data: Partial<Omit<Workflow, 'id'>>) => void;
  
  // Node Actions
  addNode: (type: string, position: { x: number, y: number }, data: any) => string;
  updateNode: (id: string, data: Partial<Node['data']>) => void;
  removeNode: (id: string) => void;
  
  // Edge Actions
  addEdge: (source: string, sourceHandle: string | null, target: string, targetHandle: string | null) => string;
  removeEdge: (id: string) => void;
  
  // Context Actions
  setGlobalContext: (context: Partial<WorkflowContext>) => void;
  setNodeContext: (nodeId: string, context: Record<string, any>) => void;
  getNodeContext: (nodeId: string) => Record<string, any>;
  clearContext: () => void;
  
  // Utility
  getActiveWorkflow: () => Workflow | null;
  saveWorkflow: () => void;
}

const initialContext: WorkflowContext = {
  global: {},
  nodes: {},
  lastUpdated: new Date(),
};

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  workflows: [],
  activeWorkflowId: null,
  nodes: [],
  edges: [],
  context: initialContext,
  
  createWorkflow: (name, description) => {
    const id = nanoid();
    const newWorkflow: Workflow = {
      id,
      name,
      description,
      nodes: [],
      edges: [],
      context: initialContext,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    set(state => ({
      workflows: [...state.workflows, newWorkflow],
      activeWorkflowId: id,
      nodes: [],
      edges: [],
      context: initialContext,
    }));
    
    return id;
  },
  
  deleteWorkflow: (id) => {
    set(state => ({
      workflows: state.workflows.filter(w => w.id !== id),
      activeWorkflowId: state.activeWorkflowId === id ? null : state.activeWorkflowId,
      nodes: state.activeWorkflowId === id ? [] : state.nodes,
      edges: state.activeWorkflowId === id ? [] : state.edges,
      context: state.activeWorkflowId === id ? initialContext : state.context,
    }));
  },
  
  setActiveWorkflow: (id) => {
    const workflow = get().workflows.find(w => w.id === id);
    if (!workflow) return;
    
    set({
      activeWorkflowId: id,
      nodes: workflow.nodes,
      edges: workflow.edges,
      context: workflow.context || initialContext,
    });
  },
  
  updateWorkflow: (id, data) => {
    set(state => ({
      workflows: state.workflows.map(w => 
        w.id === id ? { ...w, ...data, updatedAt: new Date() } : w
      ),
    }));
  },
  
  addNode: (type, position, data) => {
    const id = nanoid();
    const newNode: Node = {
      id,
      type,
      position,
      data: { ...data },
    };
    
    set(state => ({
      nodes: [...state.nodes, newNode],
      context: {
        ...state.context,
        nodes: {
          ...state.context.nodes,
          [id]: {},
        },
      },
    }));
    
    get().saveWorkflow();
    return id;
  },
  
  updateNode: (id, data) => {
    set(state => ({
      nodes: state.nodes.map(node => 
        node.id === id ? { ...node, data: { ...node.data, ...data } } : node
      ),
    }));
    
    get().saveWorkflow();
  },
  
  removeNode: (id) => {
    set(state => {
      const { [id]: removedContext, ...remainingNodeContexts } = state.context.nodes;
      return {
        nodes: state.nodes.filter(node => node.id !== id),
        edges: state.edges.filter(
          edge => edge.source !== id && edge.target !== id
        ),
        context: {
          ...state.context,
          nodes: remainingNodeContexts,
        },
      };
    });
    
    get().saveWorkflow();
  },
  
  addEdge: (source, sourceHandle, target, targetHandle) => {
    const id = nanoid();
    const newEdge: Edge = {
      id,
      source,
      sourceHandle,
      target,
      targetHandle,
    };
    
    set(state => ({
      edges: [...state.edges, newEdge],
    }));
    
    get().saveWorkflow();
    return id;
  },
  
  removeEdge: (id) => {
    set(state => ({
      edges: state.edges.filter(edge => edge.id !== id),
    }));
    
    get().saveWorkflow();
  },
  
  setGlobalContext: (context) => {
    set(state => ({
      context: {
        ...state.context,
        global: {
          ...state.context.global,
          ...context,
        },
        lastUpdated: new Date(),
      },
    }));
    
    get().saveWorkflow();
  },
  
  setNodeContext: (nodeId, context) => {
    set(state => ({
      context: {
        ...state.context,
        nodes: {
          ...state.context.nodes,
          [nodeId]: {
            ...state.context.nodes[nodeId],
            ...context,
          },
        },
        lastUpdated: new Date(),
      },
    }));
    
    get().saveWorkflow();
  },
  
  getNodeContext: (nodeId) => {
    return get().context.nodes[nodeId] || {};
  },
  
  clearContext: () => {
    set(state => ({
      context: initialContext,
    }));
    
    get().saveWorkflow();
  },
  
  getActiveWorkflow: () => {
    const { workflows, activeWorkflowId } = get();
    return workflows.find(w => w.id === activeWorkflowId) || null;
  },
  
  saveWorkflow: () => {
    const { activeWorkflowId, nodes, edges, context, workflows } = get();
    
    if (!activeWorkflowId) return;
    
    set({
      workflows: workflows.map(workflow => 
        workflow.id === activeWorkflowId
          ? { ...workflow, nodes, edges, context, updatedAt: new Date() }
          : workflow
      ),
    });
  },
}));