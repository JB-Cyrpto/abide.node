import React, { useState, useEffect, ChangeEvent } from 'react';
import Editor from '@monaco-editor/react';
import { PortConfig, DataType } from '../../plugins/sdk'; // Adjust path as needed
import PortConfiguration from './PortConfiguration'; // Added import
import ConfigFieldsBuilder, { ConfigField } from './ConfigFieldsBuilder'; // Added import
import { SavableNodePlugin, getPlugins, savePlugin as savePluginToService } from '../../plugins/pluginService';

// AIScaffoldModal Component
interface AIScaffoldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScaffold: (description: string) => void;
  isLoading: boolean; // Added for loading state
}

const AIScaffoldModal: React.FC<AIScaffoldModalProps> = ({ isOpen, onClose, onScaffold, isLoading }) => {
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => { // No async here, parent handles loading state
    if (!description.trim()) {
      alert('Please provide a description for the AI to scaffold your node.');
      return;
    }
    onScaffold(description);
    // Optionally clear description or let parent decide based on isLoading
    // setDescription(''); 
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg transform transition-all">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Scaffold Node with AI</h2>
          <button 
            onClick={onClose} 
            disabled={isLoading} 
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors rounded-full hover:bg-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-5">Describe the node you want to create. The AI will attempt to generate a starting point for its configuration, ports, and code.</p>
        <textarea 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          rows={5} 
          placeholder="e.g., A node that takes a URL, fetches content, and outputs the first 200 chars."
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm mb-6 bg-gray-50"
          disabled={isLoading}
        />
        <div className="flex justify-end space-x-3">
          <button 
            onClick={onClose} 
            disabled={isLoading} 
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-lg shadow-sm hover:bg-gray-200 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={isLoading} 
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:bg-blue-400 transition-colors flex items-center justify-center min-w-[160px] focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
          >
            {isLoading ? (
              <><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Processing...</>
            ) : "Scaffold with AI"}
          </button>
        </div>
      </div>
    </div>
  );
};

const initialPluginScaffold: SavableNodePlugin = {
  id: 'new_plugin_' + Date.now(),
  name: 'My New Custom Node',
  description: 'Does something awesome.',
  category: 'Custom',
  inputs: [{ id: 'input1', name: 'Input 1', dataType: 'string', description: 'Sample input' }],
  outputs: [{ id: 'output1', name: 'Output 1', dataType: 'string', description: 'Sample output' }],
  defaultData: { label: 'Custom Node' },
  configFields: [{ name: 'config1', label: 'Config 1', type: 'string', defaultValue: 'Hello' }], 
  runFunctionString: '// Access inputs.input_id...\n// Access config via this.defaultData.config_name...\n// Return an object mapping output_id to values...\nreturn { output1: inputs.input1 };',
};

const PluginEditor: React.FC = () => {
  const [availablePlugins, setAvailablePlugins] = useState<SavableNodePlugin[]>([]);
  const [pluginId, setPluginId] = useState<string>(initialPluginScaffold.id);
  const [pluginName, setPluginName] = useState<string>(initialPluginScaffold.name);
  const [pluginDescription, setPluginDescription] = useState<string>(initialPluginScaffold.description);
  const [pluginCategory, setPluginCategory] = useState<string>(initialPluginScaffold.category || '');
  const [inputPorts, setInputPorts] = useState<PortConfig[]>(initialPluginScaffold.inputs);
  const [outputPorts, setOutputPorts] = useState<PortConfig[]>(initialPluginScaffold.outputs);
  const [defaultDataString, setDefaultDataString] = useState<string>(JSON.stringify(initialPluginScaffold.defaultData, null, 2));
  const [configFields, setConfigFields] = useState<ConfigField[]>(initialPluginScaffold.configFields || []);
  const [runFunctionCode, setRunFunctionCode] = useState<string>(initialPluginScaffold.runFunctionString);
  const [selectedPluginToLoad, setSelectedPluginToLoad] = useState<string>('');
  
  const [isAIScaffoldModalOpen, setIsAIScaffoldModalOpen] = useState(false);
  const [isAIScaffolding, setIsAIScaffolding] = useState(false); // Loading state for AI scaffolding

  useEffect(() => {
    setAvailablePlugins(getPlugins());
  }, [selectedPluginToLoad]);

  const resetFormToScaffold = (scaffold: SavableNodePlugin = initialPluginScaffold, newIdPrefix: string = 'new_plugin_') => {
    const newId = newIdPrefix + Date.now();
    setPluginId(newId);
    setPluginName(scaffold.name);
    setPluginDescription(scaffold.description);
    setPluginCategory(scaffold.category || '');
    setInputPorts([...scaffold.inputs]);
    setOutputPorts([...scaffold.outputs]);
    setDefaultDataString(JSON.stringify(scaffold.defaultData, null, 2));
    setConfigFields(scaffold.configFields ? [...scaffold.configFields] : []);
    setRunFunctionCode(scaffold.runFunctionString);
    setSelectedPluginToLoad('');
  };

  const handleMetadataChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'name') setPluginName(value);
    else if (name === 'category') setPluginCategory(value);
    else if (name === 'description') setPluginDescription(value);
  };

  const handleSavePlugin = () => {
    let parsedDefaultData: any;
    try {
      parsedDefaultData = JSON.parse(defaultDataString);
    } catch (error) {
      console.error("Error parsing defaultData JSON:", error);
      alert("Invalid JSON in Default Node Data. Please correct it before saving.");
      return;
    }
    const pluginToSave: SavableNodePlugin = {
      id: pluginId || 'plugin_' + Date.now(), // Ensure ID
      name: pluginName,
      description: pluginDescription,
      category: pluginCategory,
      inputs: inputPorts,
      outputs: outputPorts,
      defaultData: parsedDefaultData,
      configFields: configFields,
      runFunctionString: runFunctionCode,
    };
    savePluginToService(pluginToSave);
    alert(`Plugin "${pluginToSave.name}" saved.`);
    setAvailablePlugins(getPlugins());
    setSelectedPluginToLoad(pluginToSave.id);
  };

  const handleLoadPlugin = (selectedId: string) => {
    if (!selectedId) {
      resetFormToScaffold();
      return;
    }
    const pluginToLoad = availablePlugins.find(p => p.id === selectedId);
    if (pluginToLoad) {
      setPluginId(pluginToLoad.id);
      setPluginName(pluginToLoad.name);
      setPluginDescription(pluginToLoad.description);
      setPluginCategory(pluginToLoad.category || '');
      setInputPorts([...pluginToLoad.inputs]);
      setOutputPorts([...pluginToLoad.outputs]);
      setDefaultDataString(JSON.stringify(pluginToLoad.defaultData, null, 2));
      const loadedConfigFields: ConfigField[] = (pluginToLoad.configFields || []).map(cf => ({ ...cf, name: String(cf.name) }));
      setConfigFields(loadedConfigFields);
      setRunFunctionCode(pluginToLoad.runFunctionString || '');
      setSelectedPluginToLoad(selectedId);
    } else {
      alert("Could not find selected plugin to load. It might have been removed.");
      resetFormToScaffold();
    }
  };

  const handleAIScaffoldSubmit = async (description: string) => {
    console.log("AI Scaffolding description received:", description);
    setIsAIScaffolding(true);

    // Simulate LLM API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Example: Basic parsing of description to suggest inputs/outputs
    // This is a very naive example. A real LLM would provide a more structured response.
    let suggestedInputs: PortConfig[] = [];
    let suggestedOutputs: PortConfig[] = [];
    if (description.toLowerCase().includes('url') && description.toLowerCase().includes('input')){
        suggestedInputs.push({ id: 'input_url', name: 'URL', dataType: 'string', description: 'Input URL'});
    }
    if (description.toLowerCase().includes('text') && description.toLowerCase().includes('output')){
        suggestedOutputs.push({ id: 'output_text', name: 'Text Output', dataType: 'string', description: 'Processed text'});
    }
    if (description.toLowerCase().includes('image') && description.toLowerCase().includes('output')){
        suggestedOutputs.push({ id: 'output_image_url', name: 'Image URL', dataType: 'string', description: 'URL of processed image'});
    }
    if (suggestedInputs.length === 0) suggestedInputs.push({ id: 'input1', name: 'Input 1', dataType: 'string', description: 'Sample input' });
    if (suggestedOutputs.length === 0) suggestedOutputs.push({ id: 'output1', name: 'Output 1', dataType: 'string', description: 'Sample output' });


    const mockLLMResponse: Partial<SavableNodePlugin> = {
      name: `AI: ${description.substring(0,20)} Node`,
      description: `AI scaffolded node based on: "${description}"`, // Full description here
      category: "AI Scaffolded",
      inputs: suggestedInputs,
      outputs: suggestedOutputs,
      defaultData: { label: `AI ${description.substring(0,15)}` },
      configFields: [{ name: 'param1', label: 'AI Param 1', type: 'string', defaultValue: 'default value'}],
      runFunctionString: 
`// AI Generated Code Stub for: ${description}
// Inputs: ${suggestedInputs.map(i => i.id).join(', ')}
// Outputs: ${suggestedOutputs.map(o => o.id).join(', ')}
// Config (this.defaultData): param1

console.log('Running AI scaffolded node with inputs:', inputs);
console.log('Config param1:', this.defaultData?.param1);

// TODO: Implement actual logic here based on the description.
// Example: 
// if (inputs.input_url) { 
//   // const response = await fetch(inputs.input_url); 
//   // const data = await response.text(); 
//   // return { output_text: data.substring(0, this.defaultData?.param1 || 100) }; 
// }

return { ${suggestedOutputs[0]?.id || 'output1'}: 'Not yet implemented. Modify this code.' };
`
    };

    // Populate form using a modified resetFormToScaffold logic
    const scaffoldBase: SavableNodePlugin = {
        id: 'ai_scaffold_' + Date.now(),
        name: mockLLMResponse.name || initialPluginScaffold.name,
        description: mockLLMResponse.description || initialPluginScaffold.description,
        category: mockLLMResponse.category || initialPluginScaffold.category || '',
        inputs: mockLLMResponse.inputs || [...initialPluginScaffold.inputs],
        outputs: mockLLMResponse.outputs || [...initialPluginScaffold.outputs],
        defaultData: mockLLMResponse.defaultData || initialPluginScaffold.defaultData,
        configFields: mockLLMResponse.configFields || initialPluginScaffold.configFields || [],
        runFunctionString: mockLLMResponse.runFunctionString || initialPluginScaffold.runFunctionString,
    };
    resetFormToScaffold(scaffoldBase, 'ai_scaffold_'); // Use the new scaffold base
    
    setIsAIScaffolding(false);
    setIsAIScaffoldModalOpen(false); 
    alert("AI scaffolding applied! Please review and refine the generated plugin.");
  };

  const editorSectionClass = "p-6 border border-gray-200 rounded-xl bg-white shadow-lg space-y-4";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
  const inputClass = "block w-full shadow-sm sm:text-sm border-gray-300 rounded-lg p-2.5 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400";
  const textareaClass = `${inputClass} min-h-[60px]`;
  const buttonBaseClass = "px-5 py-2.5 text-sm font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1";
  const primaryButtonClass = `${buttonBaseClass} text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 focus:ring-blue-500`;
  const secondaryButtonClass = `${buttonBaseClass} text-gray-700 bg-gray-100 border border-gray-300 hover:bg-gray-200 disabled:opacity-70 focus:ring-gray-400`;
  const dangerButtonClass = `${buttonBaseClass} text-white bg-red-600 hover:bg-red-700 focus:ring-red-500`;
  const editorOptions = { minimap: { enabled: false }, scrollBeyondLastLine: false, automaticLayout: true, fontSize: 13, tabSize: 2, wordWrap: 'on' as const, renderLineHighlight: 'gutter' as const };

  return (
    <div className="p-6 bg-gray-100 min-h-screen flex flex-col space-y-6 overflow-y-auto">
      <h1 className="text-2xl font-semibold text-gray-800 mb-2">Plugin Editor</h1>
      
      <div className={editorSectionClass}>
        <h2 className="text-lg font-semibold text-gray-700 border-b pb-3 mb-4">Metadata</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <label htmlFor="pluginId" className={labelClass}>Plugin ID</label>
            <input type="text" name="pluginId" id="pluginId" value={pluginId} 
                  onChange={(e) => setPluginId(e.target.value)} 
                  className={inputClass} 
                  placeholder="Unique ID (e.g., my_company.my_node)" 
                  title="Unique ID for the plugin. Convention: company_name.node_name"/>
          </div>
          <div>
            <label htmlFor="name" className={labelClass}>Name</label>
            <input type="text" name="name" id="name" value={pluginName} onChange={handleMetadataChange} className={inputClass} placeholder="Human-readable name" />
          </div>
          <div>
            <label htmlFor="category" className={labelClass}>Category</label>
            <input type="text" name="category" id="category" value={pluginCategory} onChange={handleMetadataChange} className={inputClass} placeholder="e.g., Text, Math, API" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="description" className={labelClass}>Description</label>
            <textarea name="description" id="description" value={pluginDescription} onChange={handleMetadataChange} rows={2} className={textareaClass} placeholder="What this node does..."></textarea>
          </div>
        </div>
      </div>

      <div className={editorSectionClass}>
        <h2 className="text-lg font-semibold text-gray-700 border-b pb-3 mb-4">Ports Configuration</h2>
        <PortConfiguration ports={inputPorts} setPorts={setInputPorts} portTypeLabel="Input" />
        <PortConfiguration ports={outputPorts} setPorts={setOutputPorts} portTypeLabel="Output" />
      </div>
      
      <div className={editorSectionClass}>
        <h2 className="text-lg font-semibold text-gray-700 border-b pb-3 mb-4">Default Node Data</h2>
        <label htmlFor="defaultDataEditor" className={`${labelClass} mb-2`}>Initial values for node data (JSON format)</label>
        <div className="h-48 border border-gray-300 rounded-lg overflow-hidden shadow-sm">
          <Editor
            height="100%"
            language="json"
            value={defaultDataString}
            onChange={(value: string | undefined) => setDefaultDataString(value || '{}')}
            options={{...editorOptions, formatOnType: true, formatOnPaste: true}}
          />
        </div>
      </div>

      <div className={editorSectionClass}>
        <h2 className="text-lg font-semibold text-gray-700 border-b pb-3 mb-4">Configuration Fields for Sidebar</h2>
        <ConfigFieldsBuilder configFields={configFields} setConfigFields={setConfigFields} />
      </div>
      
      <div className={`${editorSectionClass} flex-grow flex flex-col min-h-[250px]`}> 
        <h2 className="text-lg font-semibold text-gray-700 border-b pb-3 mb-4">Node Execution Logic</h2>
        <label htmlFor="runFunctionCode" className={`${labelClass} mb-2`}>JavaScript function body. Access inputs via `inputs.port_id` and config via `this.defaultData.config_key`.</label>
        <div className="flex-grow border border-gray-300 rounded-lg overflow-hidden shadow-sm min-h-[150px]">
          <Editor
            height="100%" 
            defaultLanguage="javascript"
            value={runFunctionCode}
            onChange={(value: string | undefined) => setRunFunctionCode(value || '')} 
            options={editorOptions}
          />
        </div>
      </div>

      <div className="mt-auto flex flex-col sm:flex-row justify-between items-center pt-6 pb-2 border-t border-gray-300 sticky bottom-0 bg-gray-100 z-10 gap-4 sm:gap-0">
        <div className="flex flex-wrap gap-3">
            <button 
                type="button" 
                onClick={() => resetFormToScaffold()} 
                className={secondaryButtonClass}
            >
                New / Reset Form
            </button>
             <button 
                type="button" 
                onClick={() => setIsAIScaffoldModalOpen(true)} 
                className={`${secondaryButtonClass} bg-green-500 text-white hover:bg-green-600 focus:ring-green-400`}
                disabled={isAIScaffolding} 
              >
                {isAIScaffolding ? 'Scaffolding...' : 'Scaffold with AI'}
              </button>
        </div>
        <div className="flex flex-wrap gap-3">
            <select 
              value={selectedPluginToLoad}
              onChange={(e) => handleLoadPlugin(e.target.value)}
              className={`${inputClass} min-w-[200px] py-2.5`}
            >
              <option value="">Load Saved Plugin...</option>
              {availablePlugins.map(plugin => (
                <option key={plugin.id} value={plugin.id}>{plugin.name} (ID: {plugin.id})</option>
              ))}
            </select>
            <button 
              type="button" 
              onClick={handleSavePlugin}
              className={primaryButtonClass}
            >
              Save Plugin
            </button>
        </div>
      </div>
      <AIScaffoldModal 
        isOpen={isAIScaffoldModalOpen}
        onClose={() => setIsAIScaffoldModalOpen(false)}
        onScaffold={handleAIScaffoldSubmit}
        isLoading={isAIScaffolding}
      />
    </div>
  );
};

export default PluginEditor; 