import { Node as ReactFlowNode, Edge as ReactFlowEdge } from 'reactflow';

// Define what a persisted workflow might look like
export interface WorkflowDefinition {
  id: string; // Unique ID for the workflow
  name: string;
  nodes: ReactFlowNode[]; // The nodes from React Flow
  edges: ReactFlowEdge[]; // The edges from React Flow
  // Potentially add userId, projectId, version, etc.
  createdAt: string;
  updatedAt: string;
}

// Define what a workflow template might look like
export interface WorkflowTemplate extends Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt'> {
  templateId: string; // Unique ID for the template
  templateName: string;
  templateDescription?: string;
  // version?: string; // For template versioning
  // author?: string;
  // tags?: string[];
  // icon?: string; // For visual representation in a template library
  createdAt: string; // Template creation time
  // lastUsed?: string;
  // usageCount?: number;
}

// Define the state of a single workflow execution (a "run" or "instance")
export interface WorkflowRun {
  id: string;               // Unique ID for this specific execution
  workflowDefinitionId: string; // ID of the workflow being run
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  startedAt?: string;
  completedAt?: string;
  currentStepId?: string;    // ID of the node currently being executed or last executed
  contextData: Record<string, any>; // Stores outputs of completed nodes, keyed by nodeId.portId
  error?: {
    nodeId?: string;
    message: string;
    details?: any;
  };
  // Logs will be stored separately, but we might keep a summary or last few here.
}

// Structure for step execution result/log
export interface StepExecutionResult {
  nodeId: string;
  status: 'success' | 'error' | 'skipped';
  startedAt: string;
  completedAt: string;
  inputs: Record<string, any>;    // Actual inputs received by the node's run method
  outputs?: Record<string, any>;   // Outputs produced by the node's run method
  error?: string;
  logs?: Array<{ timestamp: string; message: string; level: 'info' | 'error' | 'warn' | 'debug' }>;
  durationMs?: number;
}

// Represents a job in the execution queue
export interface ExecutionJob {
  workflowRunId: string;    // ID of the workflow run this job belongs to
  nodeToExecuteId: string;  // ID of the specific node to execute in this job
  // inputsForNode: Record<string, any>; // Inputs specifically for this node, resolved from contextData
  // May include retry counts, priority, etc. for BullMQ
} 