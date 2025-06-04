export type DataType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'any';

export interface PortConfig {
  id: string;          // Unique identifier for the port within the node (e.g., 'input_value', 'output_result')
  name: string;        // User-friendly name for the port (e.g., 'Value', 'Result')
  dataType: DataType;  // Expected data type for this port
  description?: string; // Optional description of what this port does or expects
}

export interface NodePlugin<InputData = any, OutputData = any> {
  id: string;                     // Unique identifier for this node type (e.g., 'core/trigger', 'llm/agent')
  name: string;                   // User-friendly name of the node (e.g., 'Trigger', 'LLM Agent')
  description: string;            // A brief description of what the node does
  category?: string;               // Optional category for organization (e.g., 'Core', 'AI', 'Data')
  icon?: string;                   // Optional icon identifier (e.g., a name from an icon library or an SVG string)
  color?: string;                  // Optional color for the node (e.g. for display in the palette)

  inputs: PortConfig[];           // Configuration for input ports
  outputs: PortConfig[];          // Configuration for output ports

  // Default data to populate when a new node of this type is created
  defaultData: Partial<InputData & { label?: string }>; 

  // The core execution logic for the node.
  // 'inputs' will be an object where keys are PortConfig.id of input ports,
  // and values are the data received on those ports.
  run(inputs: Record<string, any>, context?: any): Promise<Record<string, any>>;

  // Optional: Configuration fields for the node's settings panel in the sidebar
  // This could be a more structured schema later, or a function returning React elements.
  configFields?: Array<{
    name: keyof InputData; // Corresponds to a key in the node's data object
    label: string;
    type: 'string' | 'text' | 'number' | 'boolean' | 'select' | 'json'; // Type of input field
    options?: Array<{ value: string; label: string }>; // For select type
    placeholder?: string;
    defaultValue?: any;
  }>;

  // Optional: Custom React component for rendering the node body on the canvas
  // If not provided, a generic node component could be used based on inputs/outputs.
  // For now, we will likely still map to our existing custom node components.
  // CustomNodeComponent?: React.FC<NodeProps<InputData & { label?: string }>>;
} 