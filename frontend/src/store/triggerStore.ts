import { create } from 'zustand';
import { WorkflowTrigger, Workflow } from '../types';
import { CronJob } from 'cron';
import { nanoid } from 'nanoid';
import { useWorkflowStore } from './workflowStore';
import { useLogStore } from './logStore';

interface TriggerState {
  activeJobs: Map<string, CronJob>;
  webhookEndpoints: Map<string, (payload: any) => void>;
  eventListeners: Map<string, Set<(event: any) => void>>;
  
  // Trigger Management
  createTrigger: (workflowId: string, type: WorkflowTrigger['type'], config: Record<string, any>) => string;
  deleteTrigger: (workflowId: string, triggerId: string) => void;
  enableTrigger: (workflowId: string, triggerId: string) => void;
  disableTrigger: (workflowId: string, triggerId: string) => void;
  
  // Trigger Execution
  executeTrigger: (workflowId: string, triggerId: string, payload?: any) => Promise<void>;
  
  // Event Management
  addEventListener: (eventName: string, callback: (event: any) => void) => () => void;
  emitEvent: (eventName: string, payload: any) => void;
  
  // Webhook Management
  registerWebhook: (workflowId: string, endpoint: string, handler: (payload: any) => void) => void;
  unregisterWebhook: (workflowId: string, endpoint: string) => void;
  
  // Cleanup
  cleanup: () => void;
}

export const useTriggerStore = create<TriggerState>((set, get) => ({
  activeJobs: new Map(),
  webhookEndpoints: new Map(),
  eventListeners: new Map(),
  
  createTrigger: (workflowId, type, config) => {
    const triggerId = nanoid();
    const trigger: WorkflowTrigger = {
      id: triggerId,
      type,
      configuration: config,
      enabled: true,
    };
    
    const workflow = useWorkflowStore.getState().workflows.find(w => w.id === workflowId);
    if (!workflow) throw new Error('Workflow not found');
    
    useWorkflowStore.getState().updateWorkflow(workflowId, {
      triggers: [...(workflow.triggers || []), trigger],
    });
    
    if (type === 'schedule' && config.cronExpression) {
      const job = new CronJob(config.cronExpression, () => {
        get().executeTrigger(workflowId, triggerId);
      });
      get().activeJobs.set(triggerId, job);
      job.start();
    }
    
    return triggerId;
  },
  
  deleteTrigger: (workflowId, triggerId) => {
    const workflow = useWorkflowStore.getState().workflows.find(w => w.id === workflowId);
    if (!workflow) return;
    
    const job = get().activeJobs.get(triggerId);
    if (job) {
      job.stop();
      get().activeJobs.delete(triggerId);
    }
    
    useWorkflowStore.getState().updateWorkflow(workflowId, {
      triggers: workflow.triggers?.filter(t => t.id !== triggerId) || [],
    });
  },
  
  enableTrigger: (workflowId, triggerId) => {
    const workflow = useWorkflowStore.getState().workflows.find(w => w.id === workflowId);
    if (!workflow) return;
    
    const trigger = workflow.triggers?.find(t => t.id === triggerId);
    if (!trigger) return;
    
    if (trigger.type === 'schedule') {
      const job = get().activeJobs.get(triggerId);
      if (job && !job.running) job.start();
    }
    
    useWorkflowStore.getState().updateWorkflow(workflowId, {
      triggers: workflow.triggers?.map(t => 
        t.id === triggerId ? { ...t, enabled: true } : t
      ),
    });
  },
  
  disableTrigger: (workflowId, triggerId) => {
    const workflow = useWorkflowStore.getState().workflows.find(w => w.id === workflowId);
    if (!workflow) return;
    
    const trigger = workflow.triggers?.find(t => t.id === triggerId);
    if (!trigger) return;
    
    if (trigger.type === 'schedule') {
      const job = get().activeJobs.get(triggerId);
      if (job && job.running) job.stop();
    }
    
    useWorkflowStore.getState().updateWorkflow(workflowId, {
      triggers: workflow.triggers?.map(t => 
        t.id === triggerId ? { ...t, enabled: false } : t
      ),
    });
  },
  
  executeTrigger: async (workflowId, triggerId, payload?) => {
    const workflow = useWorkflowStore.getState().workflows.find(w => w.id === workflowId);
    if (!workflow) return;
    
    const trigger = workflow.triggers?.find(t => t.id === triggerId);
    if (!trigger || !trigger.enabled) return;
    
    const logger = useLogStore.getState();
    
    try {
      logger.log('info', `Executing trigger ${triggerId} for workflow ${workflowId}`, {
        workflowId,
        triggerId,
        payload,
      });
      
      // Execute workflow logic here
      // This is where you'd implement the actual workflow execution
      
      logger.log('info', `Trigger ${triggerId} executed successfully`, {
        workflowId,
        triggerId,
      });
    } catch (error) {
      logger.log('error', `Trigger ${triggerId} execution failed: ${error.message}`, {
        workflowId,
        triggerId,
        error,
      });
    }
  },
  
  addEventListener: (eventName, callback) => {
    const { eventListeners } = get();
    if (!eventListeners.has(eventName)) {
      eventListeners.set(eventName, new Set());
    }
    eventListeners.get(eventName)?.add(callback);
    
    return () => {
      eventListeners.get(eventName)?.delete(callback);
    };
  },
  
  emitEvent: (eventName, payload) => {
    const listeners = get().eventListeners.get(eventName);
    if (listeners) {
      listeners.forEach(listener => listener(payload));
    }
  },
  
  registerWebhook: (workflowId, endpoint, handler) => {
    get().webhookEndpoints.set(`${workflowId}:${endpoint}`, handler);
  },
  
  unregisterWebhook: (workflowId, endpoint) => {
    get().webhookEndpoints.delete(`${workflowId}:${endpoint}`);
  },
  
  cleanup: () => {
    get().activeJobs.forEach(job => job.stop());
    get().activeJobs.clear();
    get().webhookEndpoints.clear();
    get().eventListeners.clear();
  },
}));