export interface Node {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  data: NodeData;
}

export interface NodeData {
  label: string;
  inputs?: Array<NodePort>;
  outputs?: Array<NodePort>;
  [key: string]: any;
}

export interface NodePort {
  id: string;
  label: string;
  type: string;
  configuration?: Record<string, any>;
  validation?: {
    required?: boolean;
    schema?: any;
  };
}

export interface Edge {
  id: string;
  source: string;
  sourceHandle: string | null;
  target: string;
  targetHandle: string | null;
}

export interface WorkflowContext {
  global: Record<string, any>;
  nodes: Record<string, Record<string, any>>;
  lastUpdated: Date;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
  context: WorkflowContext;
  triggers: WorkflowTrigger[];
  version: string;
  template?: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowTrigger {
  id: string;
  type: 'manual' | 'schedule' | 'webhook' | 'event';
  configuration: Record<string, any>;
  enabled: boolean;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  workflow: Workflow;
  category: string;
  author: string;
  version: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  nodes: PluginNode[];
  triggers?: PluginTrigger[];
  configuration?: Record<string, any>;
}

export interface PluginNode {
  type: string;
  label: string;
  category: string;
  description: string;
  icon: string;
  component: React.ComponentType<any>;
  defaultData: Partial<NodeData>;
}

export interface PluginTrigger {
  type: string;
  label: string;
  description: string;
  configuration: Record<string, any>;
  handler: (workflow: Workflow, config: Record<string, any>) => Promise<void>;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  workflowId?: string;
  nodeId?: string;
  metadata?: Record<string, any>;
}

export interface AIAssistanceRequest {
  prompt: string;
  code?: string;
  context?: string;
  action: 'complete' | 'generate' | 'explain' | 'debug';
}

export interface AIAssistanceResponse {
  result: string;
  alternatives?: string[];
  explanation?: string;
}

export interface NodeDefinition {
  type: string;
  label: string;
  category: string;
  description: string;
  icon: string;
  defaultData: Partial<NodeData>;
}