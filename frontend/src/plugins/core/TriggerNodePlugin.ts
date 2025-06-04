import { NodePlugin, PortConfig, DataType } from '../sdk';
import pluginRegistry from '../registry';

// Data structure for TriggerNode
export interface TriggerNodeData {
  label?: string;
  // Potentially add specific trigger configuration here later,
  // e.g., eventType, schedule, webhookConfig
  // For now, only label is used from defaultData and configFields.
  // The run method might emit specific data based on such configs.
  someInitialValue?: string; // Example data field
}

const triggerNodePlugin: NodePlugin<TriggerNodeData> = {
  id: 'trigger', // Matches the existing type in VisualWorkflowPage for now
  name: 'Trigger',
  description: 'Starts the workflow (e.g., On App Start, Webhook)',
  category: 'Core',
  icon: 'FiPlayCircle', // Example icon name (ensure react-icons/fi is used or adjust)
  color: 'bg-green-400', // Tailwind class for background color

  inputs: [], // Triggers typically don't have inputs from other workflow nodes

  outputs: [
    {
      id: 'output', // Matches the handle id in TriggerNode.tsx
      name: 'Output',
      dataType: 'object',
      description: 'Data to start the workflow',
    },
  ],

  defaultData: {
    label: 'On App Start',
    someInitialValue: 'Hello Workflow!',
  },

  // Example run method for a trigger
  // In a real scenario, this might be invoked by an external event (webhook, schedule)
  // or by the workflow engine when a workflow starts with this trigger.
  // The 'inputs' for a trigger's run method might be context from the trigger event itself.
  async run(inputs: Record<string, any>, context?: any): Promise<Record<string, any>> {
    console.log(`TriggerNode (${this.defaultData.label}) run method executed.`);
    // 'context' could contain trigger-specific data if applicable (e.g., webhook payload)
    const outputData = {
      message: `Workflow triggered by '${this.defaultData.label}'`,
      timestamp: new Date().toISOString(),
      initialValue: this.defaultData.someInitialValue,
      triggerContext: context || {},
    };
    // The key in the returned object must match an output port's id
    return { output: outputData };
  },

  configFields: [
    {
      name: 'label',
      label: 'Label',
      type: 'string',
      placeholder: 'Enter trigger label',
      defaultValue: 'On App Start',
    },
    {
      name: 'someInitialValue', // Key must exist in TriggerNodeData
      label: 'Initial Value (Test)',
      type: 'string',
      placeholder: 'Initial data to emit',
      defaultValue: 'Hello Workflow!',
    }
  ],
  // We are still using the dedicated TriggerNode.tsx for rendering for now.
  // CustomNodeComponent: TriggerNode, // This would be the ideal way if rendering was fully generic
};

// Register the plugin with the registry
pluginRegistry.register(triggerNodePlugin);

export default triggerNodePlugin; 