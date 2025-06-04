import { create } from 'zustand';
import { OpenAI } from 'openai';
import { useWorkflowStore } from './workflowStore';
import { useNodeDefinitionStore } from './nodeDefinitionStore';
import { useLogStore } from './logStore';

interface AIState {
  isProcessing: boolean;
  error: string | null;
  
  // Natural Language Workflow Creation
  createWorkflowFromDescription: (description: string) => Promise<string>;
  suggestNextNode: (workflowId: string) => Promise<string[]>;
  optimizeWorkflow: (workflowId: string) => Promise<void>;
  
  // Node Generation
  generateNodeFromOpenAPI: (specUrl: string) => Promise<void>;
  generateNodeFromDescription: (description: string) => Promise<void>;
  
  // AI Agents
  createAIAgent: (config: Record<string, any>) => Promise<string>;
  executeAIAgent: (agentId: string, input: any) => Promise<any>;
  
  // Health Monitoring
  analyzeWorkflowHealth: (workflowId: string) => Promise<{
    issues: string[];
    suggestions: string[];
  }>;
}

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Enable client-side usage
});

export const useAIStore = create<AIState>((set, get) => ({
  isProcessing: false,
  error: null,
  
  createWorkflowFromDescription: async (description) => {
    set({ isProcessing: true, error: null });
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert workflow designer. Convert the user's description into a workflow specification."
          },
          {
            role: "user",
            content: description
          }
        ]
      });
      
      const workflowSpec = JSON.parse(response.choices[0].message.content);
      const workflowId = useWorkflowStore.getState().createWorkflow(
        workflowSpec.name,
        workflowSpec.description
      );
      
      // Create nodes and connections based on the AI response
      workflowSpec.nodes.forEach((nodeSpec: any) => {
        useWorkflowStore.getState().addNode(
          nodeSpec.type,
          nodeSpec.position,
          nodeSpec.data
        );
      });
      
      set({ isProcessing: false });
      return workflowId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isProcessing: false });
      throw error;
    }
  },
  
  suggestNextNode: async (workflowId) => {
    const workflow = useWorkflowStore.getState().getActiveWorkflow();
    if (!workflow) throw new Error('No active workflow');
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an AI workflow assistant. Suggest the next node type based on the current workflow state."
          },
          {
            role: "user",
            content: JSON.stringify(workflow)
          }
        ]
      });
      
      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage });
      throw error;
    }
  },
  
  optimizeWorkflow: async (workflowId) => {
    set({ isProcessing: true, error: null });
    try {
      const workflow = useWorkflowStore.getState().getActiveWorkflow();
      if (!workflow) throw new Error('No active workflow');

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a workflow optimization expert. Analyze the workflow and suggest improvements."
          },
          {
            role: "user",
            content: JSON.stringify(workflow)
          }
        ]
      });

      const suggestions = JSON.parse(response.choices[0].message.content);
      set({ isProcessing: false });
      return suggestions;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isProcessing: false });
      throw error;
    }
  },
  
  generateNodeFromOpenAPI: async (specUrl) => {
    set({ isProcessing: true, error: null });
    try {
      const response = await fetch(specUrl);
      const spec = await response.json();

      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Generate a node definition from this OpenAPI specification."
          },
          {
            role: "user",
            content: JSON.stringify(spec)
          }
        ]
      });

      const nodeDefinition = JSON.parse(aiResponse.choices[0].message.content);
      set({ isProcessing: false });
      return nodeDefinition;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isProcessing: false });
      throw error;
    }
  },
  
  generateNodeFromDescription: async (description) => {
    set({ isProcessing: true, error: null });
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Generate a node definition from this natural language description."
          },
          {
            role: "user",
            content: description
          }
        ]
      });

      const nodeDefinition = JSON.parse(response.choices[0].message.content);
      set({ isProcessing: false });
      return nodeDefinition;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isProcessing: false });
      throw error;
    }
  },
  
  createAIAgent: async (config) => {
    set({ isProcessing: true, error: null });
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Create an AI agent with the following configuration."
          },
          {
            role: "user",
            content: JSON.stringify(config)
          }
        ]
      });

      const agentDefinition = response.choices[0].message.content;
      set({ isProcessing: false });
      return agentDefinition;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isProcessing: false });
      throw error;
    }
  },
  
  executeAIAgent: async (agentId, input) => {
    set({ isProcessing: true, error: null });
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `Execute agent ${agentId} with the following input.`
          },
          {
            role: "user",
            content: JSON.stringify(input)
          }
        ]
      });

      const result = JSON.parse(response.choices[0].message.content);
      set({ isProcessing: false });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isProcessing: false });
      throw error;
    }
  },
  
  analyzeWorkflowHealth: async (workflowId) => {
    set({ isProcessing: true, error: null });
    try {
      const workflow = useWorkflowStore.getState().getActiveWorkflow();
      if (!workflow) throw new Error('No active workflow');

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Analyze this workflow for potential issues and suggest improvements."
          },
          {
            role: "user",
            content: JSON.stringify(workflow)
          }
        ]
      });

      const analysis = JSON.parse(response.choices[0].message.content);
      set({ isProcessing: false });
      return analysis;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isProcessing: false });
      throw error;
    }
  },
}));