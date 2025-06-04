import { NodePlugin, PortConfig, DataType } from '../sdk';
import pluginRegistry from '../registry';
import { LLMAgentNodeData } from '../../nodes/LLMAgentNode'; // We can reuse this interface
import { executeLLMTest } from '../../lib/llmUtils'; // For the run method simulation

// Ensure LLMAgentNodeData aligns with what plugin expects for configFields
// (e.g. label, promptTemplate, inputVariables, model, testInputValues)

const llmAgentNodePlugin: NodePlugin<LLMAgentNodeData> = {
  id: 'llm_agent', // Critical: matches existing type
  name: 'LLM Agent',
  description: 'Integrates an AI Language Model for advanced tasks.',
  category: 'AI',
  icon: 'FiCpu', // From react-icons/fi
  color: 'bg-purple-500', // Example Tailwind color

  inputs: [
    {
      id: 'input', // Matches Handle id in LLMAgentNode.tsx
      name: 'Input Data',
      dataType: 'object',
      description: 'Object containing data to fill prompt template variables.',
    },
  ],
  outputs: [
    {
      id: 'output', // Matches Handle id in LLMAgentNode.tsx
      name: 'LLM Response',
      dataType: 'string',
      description: 'The text response from the Language Model.',
    },
  ],

  defaultData: {
    label: 'LLM Agent',
    promptTemplate: 'Write a short paragraph about {{topic}} in a {{tone}} tone.',
    inputVariables: ['topic', 'tone'],
    model: 'gpt-3.5-turbo',
    testInputValues: { topic: 'AI', tone: 'neutral' },
  },

  // The 'run' method for the LLM Agent will simulate calling an LLM
  // In a real execution engine, this would make an actual API call.
  async run(inputs: Record<string, any>, context?: any): Promise<Record<string, any>> {
    const nodeData = context?.nodeData as LLMAgentNodeData | undefined;
    
    // Ensure defaultData and its properties are accessed safely with fallbacks
    const defaultPromptFromPlugin = this.defaultData?.promptTemplate || '{{fallback_prompt}}'; // Added fallback
    const defaultModelFromPlugin = this.defaultData?.model; // model can be optional

    const promptTemplate = nodeData?.promptTemplate || defaultPromptFromPlugin;
    const model = nodeData?.model || defaultModelFromPlugin;
    
    const inputValuesForPrompt = inputs.input || {};

    console.log(`LLM Agent (${nodeData?.label || this.name}) run:`, { promptTemplate, inputValuesForPrompt, model });

    // Using the executeLLMTest as a stand-in for actual LLM call logic
    // In a real scenario, this would involve:
    // 1. Securely getting API keys
    // 2. Making an HTTP request to the LLM provider
    // 3. Handling the response/errors
    const result = await executeLLMTest(promptTemplate, inputValuesForPrompt, model);

    if (result.success) {
      return { output: result.output || '' }; // Key should match output port id
    } else {
      // How to handle errors in the execution engine is a bigger topic
      // For now, log and return an error structure or throw
      console.error('LLM Agent execution error:', result.error);
      // Potentially return an error object on a specific error port if designed, or rethrow
      // throw new Error(result.error || 'LLM execution failed');
      return { output: `Error: ${result.error || 'LLM execution failed'}` }; // Simplistic error propagation
    }
  },

  configFields: [
    { name: 'label', label: 'Label', type: 'string', placeholder: 'LLM Agent Node', defaultValue: 'LLM Agent' },
    { 
      name: 'promptTemplate', 
      label: 'Prompt Template', 
      type: 'text', 
      placeholder: 'e.g., Summarize this: {{text_input}}', 
      defaultValue: 'Write a short paragraph about {{topic}} in a {{tone}} tone.' 
    },
    // inputVariables is derived from promptTemplate, so not directly a config field for manual editing.
    // testInputValues are edited in a special section (the sandbox UI handles this for now).
    { 
      name: 'model', 
      label: 'Model', 
      type: 'string', 
      placeholder: 'e.g., gpt-4, ollama/mistral', 
      defaultValue: 'gpt-3.5-turbo'
    },
    // Note: The 'inputVariables' and 'testInputValues' are handled specially in the Sidebar
    // for LLM Agents currently. The generic configField rendering won't replicate that complex UI.
    // This highlights a limitation of purely declarative configFields for highly custom UIs.
    // The sandbox button is also handled outside these generic fields.
  ],
};

pluginRegistry.register(llmAgentNodePlugin);

export default llmAgentNodePlugin; 