import { create } from 'zustand';
import { NodeDefinition } from '../types';
import { Code, Mail, Database, Webhook, Bot, Workflow } from 'lucide-react';

interface NodeDefinitionState {
  definitions: NodeDefinition[];
  getDefinitionByType: (type: string) => NodeDefinition | undefined;
}

const initialDefinitions: NodeDefinition[] = [
  {
    type: 'javascript',
    label: 'JavaScript',
    category: 'Code',
    description: 'Execute custom JavaScript code',
    icon: 'Code',
    defaultData: {
      label: 'JavaScript',
      code: 'return { success: true, data: {} }',
      inputs: [
        { id: 'input', label: 'Input', type: 'object' }
      ],
      outputs: [
        { id: 'output', label: 'Output', type: 'object' }
      ]
    }
  },
  {
    type: 'email',
    label: 'Email',
    category: 'Communication',
    description: 'Send emails through various providers',
    icon: 'Mail',
    defaultData: {
      label: 'Send Email',
      inputs: [
        { id: 'to', label: 'To', type: 'string' },
        { id: 'subject', label: 'Subject', type: 'string' },
        { id: 'body', label: 'Body', type: 'string' }
      ],
      outputs: [
        { id: 'success', label: 'Success', type: 'boolean' },
        { id: 'error', label: 'Error', type: 'string' }
      ]
    }
  },
  {
    type: 'database',
    label: 'Database',
    category: 'Data',
    description: 'Connect to and query databases',
    icon: 'Database',
    defaultData: {
      label: 'Database Query',
      query: 'SELECT * FROM users',
      inputs: [
        { id: 'params', label: 'Parameters', type: 'object' }
      ],
      outputs: [
        { id: 'results', label: 'Results', type: 'array' },
        { id: 'error', label: 'Error', type: 'string' }
      ]
    }
  },
  {
    type: 'webhook',
    label: 'Webhook',
    category: 'Triggers',
    description: 'Trigger workflows via webhook',
    icon: 'Webhook',
    defaultData: {
      label: 'Webhook Trigger',
      endpoint: '/webhook',
      outputs: [
        { id: 'payload', label: 'Payload', type: 'object' },
        { id: 'headers', label: 'Headers', type: 'object' }
      ]
    }
  },
  {
    type: 'ai',
    label: 'AI Assistant',
    category: 'AI',
    description: 'Leverage AI for text generation and analysis',
    icon: 'Bot',
    defaultData: {
      label: 'AI Assistant',
      prompt: 'Write a response to the following email:',
      inputs: [
        { id: 'prompt', label: 'Prompt', type: 'string' },
        { id: 'context', label: 'Context', type: 'string' }
      ],
      outputs: [
        { id: 'response', label: 'Response', type: 'string' }
      ]
    }
  },
  {
    type: 'workflow',
    label: 'Sub-workflow',
    category: 'Flow',
    description: 'Run another workflow as a step',
    icon: 'Workflow',
    defaultData: {
      label: 'Sub-workflow',
      workflowId: '',
      inputs: [
        { id: 'input', label: 'Input', type: 'object' }
      ],
      outputs: [
        { id: 'output', label: 'Output', type: 'object' }
      ]
    }
  }
];

export const useNodeDefinitionStore = create<NodeDefinitionState>((set, get) => ({
  definitions: initialDefinitions,
  
  getDefinitionByType: (type) => {
    return get().definitions.find(def => def.type === type);
  }
}));