import React, { useState, useEffect } from 'react';
import { PortConfig, DataType } from '../plugins/sdk';
import { SavableNodePlugin, getPlugins as getAllPluginsFromService, getPluginById } from '../plugins/pluginService'; // getPlugins, getPluginById
import { savePlugin as savePluginToService } from '../plugins/pluginService';
import { v4 as uuidv4 } from 'uuid';
import { FiPlus, FiTrash2, FiSave, FiArrowLeft, FiSettings, FiEdit3, FiRotateCcw } from 'react-icons/fi';
// Import ConfigField types
import { ConfigField, ConfigFieldType } from '../components/plugins_sdk/ConfigFieldsBuilder';

const availableDataTypes: DataType[] = ['string', 'number', 'boolean', 'object', 'array', 'any'];
const availableConfigFieldTypes: ConfigFieldType[] = ['string', 'text', 'number', 'boolean', 'select', 'json'];

const initialPort: PortConfig = { id: '', name: '', dataType: 'string', description: '' };
const initialConfigField: ConfigField = { name: '', label: '', type: 'string', defaultValue: '' };

const getInitialFormState = () => ({
  pluginId: '',
  name: '',
  description: '',
  category: '',
  icon: '',
  color: '',
  inputs: [] as PortConfig[],
  outputs: [] as PortConfig[],
  configFields: [] as ConfigField[],
  defaultDataString: '{ "label": "My New Node" }',
  runFunctionString: 
    '// Inputs are available in the `inputs` object, e.g., inputs.input_port_id\n' +
    '// Access config/defaultData via `this.defaultData.yourKey`\n' +
    '// Return an object where keys are output port IDs, e.g., { output_port_id: result }\n' +
    'return {};'
});

const NodeBuilderPage: React.FC = () => {
  const [formState, setFormState] = useState(getInitialFormState());
  
  const [allPlugins, setAllPlugins] = useState<SavableNodePlugin[]>([]);
  const [editingPluginId, setEditingPluginId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setAllPlugins(getAllPluginsFromService());
  }, []);

  const resetForm = (pluginToLoad?: SavableNodePlugin) => {
    if (pluginToLoad) {
      setFormState({
        pluginId: pluginToLoad.id,
        name: pluginToLoad.name,
        description: pluginToLoad.description || '',
        category: pluginToLoad.category || '',
        icon: pluginToLoad.icon || '',
        color: pluginToLoad.color || '',
        inputs: pluginToLoad.inputs.map(p => ({...p})), // Deep copy
        outputs: pluginToLoad.outputs.map(p => ({...p})),
        configFields: (pluginToLoad.configFields || []).map(cf => ({...cf})),
        defaultDataString: JSON.stringify(pluginToLoad.defaultData || { label: pluginToLoad.name }, null, 2),
        runFunctionString: pluginToLoad.runFunctionString,
      });
      setEditingPluginId(pluginToLoad.id);
      setSuccessMessage(`Editing plugin: ${pluginToLoad.name}`);
      setError(null);
    } else {
      setFormState(getInitialFormState());
      setEditingPluginId(null);
      setSuccessMessage(null);
      setError(null);
    }
  };
  
  const handleLoadPluginToEdit = (selectedPluginId: string) => {
    if (!selectedPluginId) {
      resetForm();
      return;
    }
    const plugin = allPlugins.find(p => p.id === selectedPluginId);
    if (plugin) {
      resetForm(plugin);
    } else {
      setError("Could not find selected plugin to load.");
    }
  };

  const handleAddPort = (type: 'inputs' | 'outputs') => {
    const newPort = { ...initialPort, id: `port_${uuidv4().substring(0, 4)}` };
    setFormState(prev => ({ ...prev, [type]: [...prev[type], newPort] }));
  };

  const handleRemovePort = (type: 'inputs' | 'outputs', index: number) => {
    setFormState(prev => ({ ...prev, [type]: prev[type].filter((_: any, i: number) => i !== index) }));
  };

  const handlePortChange = (type: 'inputs' | 'outputs', index: number, field: keyof PortConfig, value: string) => {
    setFormState(prev => ({
      ...prev,
      [type]: prev[type].map((port: PortConfig, i: number) => 
        i === index ? { ...port, [field]: value } : port
      )
    }));
  };
  
  const handleAddConfigField = () => {
    setFormState(prev => ({ ...prev, configFields: [...prev.configFields, { ...initialConfigField, name: `config_${uuidv4().substring(0,4)}` }]}));
  };

  const handleRemoveConfigField = (index: number) => {
    setFormState(prev => ({ ...prev, configFields: prev.configFields.filter((_: any, i: number) => i !== index) }));
  };

  const handleConfigFieldChange = (index: number, field: keyof ConfigField, value: any) => {
    setFormState(prev => ({
      ...prev,
      configFields: prev.configFields.map((cf: ConfigField, i: number) => 
        i === index ? { ...cf, [field]: value } : cf
      )
    }));
  };

  const handleConfigFieldOptionsChange = (index: number, jsonString: string) => {
    try {
      const options = JSON.parse(jsonString);
      if (Array.isArray(options) && options.every(opt => typeof opt.value === 'string' && typeof opt.label === 'string')) {
        handleConfigFieldChange(index, 'options', options);
      } else {
        handleConfigFieldChange(index, 'options', undefined); 
      }
    } catch (e) {
      handleConfigFieldChange(index, 'options', undefined);
    }
  };
  
  const handleInputChange = (field: keyof ReturnType<typeof getInitialFormState>, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!formState.pluginId.trim() || !formState.name.trim()) {
      setError('Plugin ID and Name are required.');
      return;
    }

    // Uniqueness check for Plugin ID (only if not editing or ID has changed)
    if (!editingPluginId || (editingPluginId && formState.pluginId.trim() !== editingPluginId)) {
      if (allPlugins.some(p => p.id === formState.pluginId.trim())) {
        setError(`Plugin ID "${formState.pluginId.trim()}" already exists. Choose a unique ID.`);
        return;
      }
    }
    
    // Basic Port ID/Name uniqueness (within its own list)
    const checkPortUniqueness = (ports: PortConfig[], type: string): boolean => {
      const ids = new Set();
      const names = new Set();
      for (const port of ports) {
        if (port.id.trim()) {
          if (ids.has(port.id.trim())) { setError(`${type} port ID "${port.id}" is not unique.`); return false; }
          ids.add(port.id.trim());
        }
        if (port.name.trim()) {
          if (names.has(port.name.trim())) { setError(`${type} port Name "${port.name}" is not unique.`); return false; }
          names.add(port.name.trim());
        }
      }
      return true;
    };
    if (!checkPortUniqueness(formState.inputs, 'Input')) return;
    if (!checkPortUniqueness(formState.outputs, 'Output')) return;

    // ConfigField Name uniqueness
    const cfNames = new Set();
    for (const cf of formState.configFields) {
      if (cf.name.trim()) {
        if (cfNames.has(cf.name.trim())) { setError(`ConfigField Name "${cf.name}" is not unique.`); return false; }
        cfNames.add(cf.name.trim());
      }
    }

    let parsedDefaultData: any;
    try {
      parsedDefaultData = JSON.parse(formState.defaultDataString);
    } catch (jsonError) {
      setError('Default Data is not valid JSON.');
      return;
    }

    const pluginToSave: SavableNodePlugin = {
      id: formState.pluginId.trim(),
      name: formState.name.trim(),
      description: formState.description.trim(),
      category: formState.category.trim() || undefined,
      icon: formState.icon.trim() || undefined,
      color: formState.color.trim() || undefined,
      inputs: formState.inputs.filter(p => p.id.trim() && p.name.trim()),
      outputs: formState.outputs.filter(p => p.id.trim() && p.name.trim()),
      defaultData: parsedDefaultData,
      runFunctionString: formState.runFunctionString,
      configFields: formState.configFields.filter(cf => cf.name.trim() && cf.label.trim()),
    };

    try {
      savePluginToService(pluginToSave);
      const message = editingPluginId ? `Plugin "${pluginToSave.name}" updated successfully!` : `Plugin "${pluginToSave.name}" saved successfully!`;
      setSuccessMessage(`${message} You may need to refresh other views to see changes.`);
      setAllPlugins(getAllPluginsFromService()); // Refresh list of plugins
      if (!editingPluginId) {
         resetForm(); // Reset for new entry if it was a new plugin
      } else {
        // If editing, keep form populated with current data, or reload to confirm.
        handleLoadPluginToEdit(pluginToSave.id); // Reload the just saved plugin
      }
    } catch (saveError: any) {
      setError(`Failed to save plugin: ${saveError.message || 'Unknown error'}`);
    }
  };
  
  // Basic styles - can be Tailwind classes
  const inputStyle = "block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";
  const labelStyle = "block text-sm font-medium text-gray-700 mb-1";
  const buttonStyle = "px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50";
  const sectionTitleStyle = "text-xl font-semibold text-gray-800 mb-3 pb-2 border-b";

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white p-8 shadow-xl rounded-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{editingPluginId ? 'Edit Node Plugin' : 'Create New Node Plugin'}</h1>
          <button onClick={() => resetForm()} title="Reset Form / New Plugin" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center">
            <FiRotateCcw className="mr-1"/> {editingPluginId ? 'Clear Form / New' : 'Reset Form'}
          </button>
        </div>

        {/* Load Existing Plugin Section */}
        <section className="mb-8 p-4 border border-dashed border-gray-300 rounded-md bg-gray-50">
            <label htmlFor="loadPlugin" className={`${labelStyle} mb-2 flex items-center`}><FiEdit3 className="mr-2"/>Load Existing Plugin to Edit:</label>
            <select 
                id="loadPlugin" 
                value={editingPluginId || ''} 
                onChange={(e) => handleLoadPluginToEdit(e.target.value)}
                className={`${inputStyle} w-full`}
            >
                <option value="">-- Select a plugin to edit --</option>
                {allPlugins.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
            </select>
        </section>

        {error && <div className="p-3 mb-4 text-red-700 bg-red-100 border border-red-400 rounded-md">{error}</div>}
        {successMessage && <div className="p-3 mb-4 text-green-700 bg-green-100 border border-green-400 rounded-md">{successMessage}</div>}

        <form onSubmit={handleSubmit} className="space-y-8">
          <section>
            <h2 className={sectionTitleStyle}>Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="pluginId" className={labelStyle}>Plugin ID*</label>
                <input type="text" id="pluginId" value={formState.pluginId} onChange={(e) => handleInputChange('pluginId', e.target.value)} className={inputStyle} required disabled={!!editingPluginId} />
                {editingPluginId && <p className="text-xs text-gray-500 mt-1">Plugin ID cannot be changed when editing.</p>}
              </div>
              <div>
                <label htmlFor="name" className={labelStyle}>Name*</label>
                <input type="text" id="name" value={formState.name} onChange={(e) => handleInputChange('name', e.target.value)} className={inputStyle} required />
              </div>
            </div>
            <div className="mt-6">
              <label htmlFor="description" className={labelStyle}>Description</label>
              <textarea id="description" value={formState.description} onChange={(e) => handleInputChange('description', e.target.value)} className={inputStyle} rows={3}></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div>
                <label htmlFor="category" className={labelStyle}>Category</label>
                <input type="text" id="category" value={formState.category} onChange={(e) => handleInputChange('category', e.target.value)} className={inputStyle} />
              </div>
              <div>
                <label htmlFor="icon" className={labelStyle}>Icon (Text/SVG)</label>
                <input type="text" id="icon" value={formState.icon} onChange={(e) => handleInputChange('icon', e.target.value)} className={inputStyle} />
              </div>
              <div>
                <label htmlFor="color" className={labelStyle}>Color</label>
                <input type="text" id="color" value={formState.color} onChange={(e) => handleInputChange('color', e.target.value)} className={inputStyle} />
              </div>
            </div>
          </section>

          {['inputs', 'outputs'].map(portType => (
            <section key={portType}>
              <h2 className={sectionTitleStyle}>{portType === 'inputs' ? 'Input Ports' : 'Output Ports'}</h2>
              {(portType === 'inputs' ? formState.inputs : formState.outputs).map((port, index) => (
                <div key={index} className="p-4 mb-4 border border-gray-200 rounded-md space-y-3 bg-gray-50 relative">
                  <button 
                    type="button" 
                    onClick={() => handleRemovePort(portType as 'inputs' | 'outputs', index)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100"
                    title="Remove Port"
                  >
                    <FiTrash2 size={16}/>
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor={`${portType}-${index}-id`} className={labelStyle}>Port ID*</label>
                      <input type="text" id={`${portType}-${index}-id`} value={port.id} onChange={e => handlePortChange(portType as 'inputs' | 'outputs', index, 'id', e.target.value)} className={inputStyle} placeholder="e.g., input_value" />
                    </div>
                    <div>
                      <label htmlFor={`${portType}-${index}-name`} className={labelStyle}>Port Name*</label>
                      <input type="text" id={`${portType}-${index}-name`} value={port.name} onChange={e => handlePortChange(portType as 'inputs' | 'outputs', index, 'name', e.target.value)} className={inputStyle} placeholder="e.g., Input Value" />
                    </div>
                    <div>
                      <label htmlFor={`${portType}-${index}-dataType`} className={labelStyle}>Data Type</label>
                      <select id={`${portType}-${index}-dataType`} value={port.dataType} onChange={e => handlePortChange(portType as 'inputs' | 'outputs', index, 'dataType', e.target.value)} className={inputStyle}>
                        {availableDataTypes.map(dt => <option key={dt} value={dt}>{dt}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor={`${portType}-${index}-description`} className={labelStyle}>Port Description</label>
                    <input type="text" id={`${portType}-${index}-description`} value={port.description || ''} onChange={e => handlePortChange(portType as 'inputs' | 'outputs', index, 'description', e.target.value)} className={inputStyle} />
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => handleAddPort(portType as 'inputs' | 'outputs')} className="mt-2 px-3 py-1.5 text-sm text-indigo-700 border border-indigo-500 rounded-md hover:bg-indigo-50 flex items-center">
                <FiPlus className="mr-1" /> Add {portType === 'inputs' ? 'Input' : 'Output'} Port
              </button>
            </section>
          ))}
          
          <section>
            <h2 className={sectionTitleStyle}><FiSettings className="inline mr-2 mb-1"/>Configuration Fields</h2>
            {formState.configFields.map((field, index) => (
              <div key={index} className="p-4 mb-4 border border-gray-200 rounded-md space-y-3 bg-gray-50 relative">
                <button 
                  type="button" 
                  onClick={() => handleRemoveConfigField(index)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100"
                  title="Remove Config Field"
                >
                  <FiTrash2 size={16}/>
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={`cf-${index}-name`} className={labelStyle}>Field Name/Key*</label>
                    <input type="text" id={`cf-${index}-name`} value={field.name} onChange={e => handleConfigFieldChange(index, 'name', e.target.value)} className={inputStyle} placeholder="e.g., apiKey" />
                  </div>
                  <div>
                    <label htmlFor={`cf-${index}-label`} className={labelStyle}>Display Label*</label>
                    <input type="text" id={`cf-${index}-label`} value={field.label} onChange={e => handleConfigFieldChange(index, 'label', e.target.value)} className={inputStyle} placeholder="e.g., API Key" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                  <div>
                    <label htmlFor={`cf-${index}-type`} className={labelStyle}>Field Type</label>
                    <select id={`cf-${index}-type`} value={field.type} onChange={e => handleConfigFieldChange(index, 'type', e.target.value as ConfigFieldType)} className={inputStyle}>
                      {availableConfigFieldTypes.map(ft => <option key={ft} value={ft}>{ft}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`cf-${index}-defaultValue`} className={labelStyle}>Default Value</label>
                    <input type="text" id={`cf-${index}-defaultValue`} value={field.defaultValue === undefined ? '' : String(field.defaultValue)} onChange={e => handleConfigFieldChange(index, 'defaultValue', e.target.value)} className={inputStyle} />
                  </div>
                  <div>
                    <label htmlFor={`cf-${index}-placeholder`} className={labelStyle}>Placeholder</label>
                    <input type="text" id={`cf-${index}-placeholder`} value={field.placeholder || ''} onChange={e => handleConfigFieldChange(index, 'placeholder', e.target.value)} className={inputStyle} />
                  </div>
                </div>
                {field.type === 'select' && (
                  <div className="mt-3">
                    <label htmlFor={`cf-${index}-options`} className={`${labelStyle} text-sm`}>Options (JSON Array)</label>
                    <textarea 
                      key={`cf-${index}-options-editor-${field.type}`}
                      id={`cf-${index}-options`} 
                      defaultValue={JSON.stringify(field.options || [], null, 2)}
                      onChange={e => handleConfigFieldOptionsChange(index, e.target.value)} 
                      className={`${inputStyle} font-mono text-xs`} 
                      rows={3}
                      placeholder='[{"value": "option1", "label": "Option 1"}]'
                    />
                  </div>
                )}
              </div>
            ))}
            <button type="button" onClick={handleAddConfigField} className="mt-2 px-3 py-1.5 text-sm text-indigo-700 border border-indigo-500 rounded-md hover:bg-indigo-50 flex items-center">
              <FiPlus className="mr-1" /> Add Configuration Field
            </button>
          </section>
          
          <section>
            <h2 className={sectionTitleStyle}>Default Data (JSON)</h2>
            <div>
              <label htmlFor="defaultDataString" className={labelStyle}>
                Initial data. Must be valid JSON. Include a <code>label</code> for default node label.
              </label>
              <textarea 
                id="defaultDataString" 
                value={formState.defaultDataString} 
                onChange={(e) => handleInputChange('defaultDataString', e.target.value)} 
                className={`${inputStyle} font-mono`} 
                rows={5}
                placeholder='{ "label": "My New Node", "customSetting": "default" }'
              />
            </div>
          </section>

          <section>
            <h2 className={sectionTitleStyle}>Run Function (JavaScript)</h2>
            <div>
              <label htmlFor="runFunctionString" className={labelStyle}>
                Core logic. See comments for guidance.
              </label>
              <textarea 
                id="runFunctionString" 
                value={formState.runFunctionString} 
                onChange={(e) => handleInputChange('runFunctionString', e.target.value)} 
                className={`${inputStyle} font-mono`}
                rows={10}
              />
            </div>
          </section>

          <div className="pt-6 border-t">
            <button type="submit" className={`${buttonStyle} w-full md:w-auto flex items-center justify-center`} disabled={!formState.pluginId.trim() || !formState.name.trim()}>
              <FiSave className="mr-2"/> {editingPluginId ? 'Update Plugin Definition' : 'Save Plugin Definition'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NodeBuilderPage; 