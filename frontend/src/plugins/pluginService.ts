import { NodePlugin, PortConfig, DataType } from './sdk';
import { ConfigField } from '../components/plugins_sdk/ConfigFieldsBuilder'; // Adjust path as needed

// Define a type for the savable plugin structure, used by PluginEditor and this service
export interface SavableNodePlugin extends Omit<NodePlugin<any, any>, 'run'> {
  id: string;
  runFunctionString: string;
  // Ensure configFields here uses the ConfigField type consistent with PluginEditor and ConfigFieldsBuilder
  // NodePlugin<any,any> has configFields with name: string | number | symbol.
  // The editor internally uses name: string. This service should store them as such.
  configFields?: ConfigField[]; 
  // Making other fields non-optional for a well-defined savable plugin
  name: string;
  description: string;
  category?: string;
  inputs: PortConfig[];
  outputs: PortConfig[];
  defaultData: Partial<any & { label?: string }>;
}

// Mock storage for saved plugins - this will be managed by PluginEditor for now
// In a real app, this would be fetched from a backend or localStorage
export const mockSavedPlugins: SavableNodePlugin[] = [
  {
    id: 'greeting_node',
    name: 'Greeting Node',
    description: 'Generates a greeting string.',
    category: 'Text',
    inputs: [{ id: 'name_input', name: 'Name', dataType: 'string', description: 'Name to greet' }],
    outputs: [{ id: 'greeting_output', name: 'Greeting', dataType: 'string', description: 'The generated greeting' }],
    defaultData: { label: 'Greeter', prefix: 'Hello' }, // prefix is now part of defaultData
    configFields: [{ name: 'prefix', label: 'Greeting Prefix', type: 'string', defaultValue: 'Hello' }],
    runFunctionString: '// Access config via this.defaultData.yourConfigKey\n// Access inputs via inputs.your_input_id\nreturn { greeting_output: `${this.defaultData.prefix || \'Hi\'}, ${inputs.name_input}!` };'
  },
  {
    id: 'adder_node',
    name: 'Adder Node',
    description: 'Adds two numbers.',
    category: 'Math',
    inputs: [
      { id: 'num1', name: 'Number 1', dataType: 'number', description: 'First number' },
      { id: 'num2', name: 'Number 2', dataType: 'number', description: 'Second number' }
    ],
    outputs: [{ id: 'sum_output', name: 'Sum', dataType: 'number', description: 'The sum of the two numbers' }],
    defaultData: { label: 'Adder' },
    configFields: [],
    runFunctionString: 'const sum = (inputs.num1 || 0) + (inputs.num2 || 0);\nreturn { sum_output: sum };'
  }
];

// Function to get all plugins
export const getPlugins = (): SavableNodePlugin[] => {
  return [...mockSavedPlugins]; // Return a copy to prevent direct modification
};

// Function to save (add or update) a plugin
// PluginEditor will call this.
export const savePlugin = (pluginToSave: SavableNodePlugin): void => {
  const existingIndex = mockSavedPlugins.findIndex(p => p.id === pluginToSave.id);
  if (existingIndex > -1) {
    mockSavedPlugins[existingIndex] = pluginToSave;
  } else {
    mockSavedPlugins.push(pluginToSave);
  }
  console.log('Plugin saved via pluginService:', pluginToSave);
  // In a real app, this might trigger an event or save to persistent storage
};

// Function to get a single plugin by ID (if needed later)
export const getPluginById = (id: string): SavableNodePlugin | undefined => {
  return mockSavedPlugins.find(p => p.id === id);
}; 