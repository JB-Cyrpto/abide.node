import React, { useState } from 'react';
import { NodePlugin } from '../../plugins/sdk'; // Assuming ConfigField is part of NodePlugin or a similar type
import { FiPlusCircle, FiTrash2, FiSettings } from 'react-icons/fi';

// Define ConfigFieldType more explicitly if not directly available from sdk
// This should align with the 'type' property in NodePlugin.configFields items
export type ConfigFieldType = 'string' | 'text' | 'number' | 'boolean' | 'select' | 'json';

export interface ConfigField {
    name: string; 
    label: string;
    type: ConfigFieldType;
    options?: Array<{ value: string; label: string }>;
    placeholder?: string;
    defaultValue?: any;
}

interface ConfigFieldsBuilderProps {
  configFields: ConfigField[];
  setConfigFields: (fields: ConfigField[]) => void;
}

const fieldTypes: ConfigFieldType[] = ['string', 'text', 'number', 'boolean', 'select', 'json'];

const ConfigFieldsBuilder: React.FC<ConfigFieldsBuilderProps> = ({ configFields, setConfigFields }) => {
  
  const handleAddField = () => {
    setConfigFields([
      ...configFields,
      { name: `field${configFields.length + 1}`, label: 'New Field', type: 'string' }
    ]);
  };

  const handleRemoveField = (index: number) => {
    setConfigFields(configFields.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, fieldName: keyof ConfigField, value: any) => {
    const updatedFields = configFields.map((field, i) => 
      i === index ? { ...field, [fieldName]: value } : field
    );
    setConfigFields(updatedFields);
  };

  const handleOptionChange = (fieldIndex: number, optionIndex: number, optionField: keyof {value: string, label: string}, value: string) => {
    const updatedFields = configFields.map((field, i) => {
      if (i === fieldIndex && field.options) {
        const updatedOptions = field.options.map((opt, oi) => 
          oi === optionIndex ? { ...opt, [optionField]: value } : opt
        );
        return { ...field, options: updatedOptions };
      }
      return field;
    });
    setConfigFields(updatedFields);
  };

  const handleAddOption = (fieldIndex: number) => {
    const updatedFields = configFields.map((field, i) => {
      if (i === fieldIndex) {
        const newOptions = [...(field.options || []), { value: 'newValue', label: 'New Label' }];
        return { ...field, options: newOptions };
      }
      return field;
    });
    setConfigFields(updatedFields);
  };

  const handleRemoveOption = (fieldIndex: number, optionIndex: number) => {
    const updatedFields = configFields.map((field, i) => {
      if (i === fieldIndex && field.options) {
        const filteredOptions = field.options.filter((_, oi) => oi !== optionIndex);
        return { ...field, options: filteredOptions };
      }
      return field;
    });
    setConfigFields(updatedFields);
  };

  return (
    <div className="p-3 border border-gray-200 rounded-md bg-white shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-md font-medium text-gray-700 flex items-center"><FiSettings className="mr-2"/>Configuration Fields (for Sidebar)</h3>
        <button 
          type="button" 
          onClick={handleAddField} 
          className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center p-1 rounded-md hover:bg-indigo-50"
        >
          <FiPlusCircle className="mr-1" /> Add Field
        </button>
      </div>
      {configFields.length === 0 && <p className="text-xs text-gray-500 italic">No configuration fields defined.</p>}
      <div className="space-y-4">
        {configFields.map((field, index) => (
          <div key={index} className="p-3 border border-gray-200 rounded-lg bg-gray-50/70 relative group">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
              {/* Field Name, Label, Type */}
              <div>
                <label className="block text-xs font-medium text-gray-600">Field Name (Key)</label>
                <input type="text" value={field.name} onChange={(e) => handleFieldChange(index, 'name', e.target.value)} className="mt-0.5 w-full p-1.5 sm:text-xs border-gray-300 rounded-md" placeholder="e.g., apiKey"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">Display Label</label>
                <input type="text" value={field.label} onChange={(e) => handleFieldChange(index, 'label', e.target.value)} className="mt-0.5 w-full p-1.5 sm:text-xs border-gray-300 rounded-md" placeholder="e.g., API Key"/>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600">Field Type</label>
                <select value={field.type} onChange={(e) => handleFieldChange(index, 'type', e.target.value as ConfigFieldType)} className="mt-0.5 w-full p-1.5 sm:text-xs border-gray-300 rounded-md bg-white">
                  {fieldTypes.map(ft => <option key={ft} value={ft}>{ft}</option>)}
                </select>
              </div>

              {/* Conditional: Options for Select Type */}
              {field.type === 'select' && (
                <div className="sm:col-span-2 p-2.5 border border-dashed border-indigo-300 rounded-md bg-indigo-50/50">
                  <h4 className="text-xs font-semibold text-indigo-700 mb-1.5">Select Options</h4>
                  {field.options?.map((opt, optIndex) => (
                    <div key={optIndex} className="flex items-center space-x-2 mb-1.5">
                      <input type="text" value={opt.value} onChange={e => handleOptionChange(index, optIndex, 'value', e.target.value)} placeholder="Value" className="flex-1 p-1 sm:text-xs border-gray-300 rounded-md"/>
                      <input type="text" value={opt.label} onChange={e => handleOptionChange(index, optIndex, 'label', e.target.value)} placeholder="Label" className="flex-1 p-1 sm:text-xs border-gray-300 rounded-md"/>
                      <button type="button" onClick={() => handleRemoveOption(index, optIndex)} className="p-1 text-red-500 hover:text-red-700"><FiTrash2 size={13}/></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => handleAddOption(index)} className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"><FiPlusCircle size={13} className="mr-0.5"/>Add Option</button>
                </div>
              )}

              {/* Placeholder & Default Value */}
              <div>
                <label className="block text-xs font-medium text-gray-600">Placeholder (Optional)</label>
                <input type="text" value={field.placeholder || ''} onChange={(e) => handleFieldChange(index, 'placeholder', e.target.value)} className="mt-0.5 w-full p-1.5 sm:text-xs border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">Default Value (Optional)</label>
                <input type="text" value={field.defaultValue === undefined ? '' : String(field.defaultValue)} onChange={(e) => handleFieldChange(index, 'defaultValue', e.target.value)} className="mt-0.5 w-full p-1.5 sm:text-xs border-gray-300 rounded-md" />
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => handleRemoveField(index)} 
              className="absolute top-1.5 right-1.5 p-1 text-red-500 hover:text-red-700 opacity-50 group-hover:opacity-100 transition-opacity rounded-full hover:bg-red-100"
              title="Remove Field"
            >
              <FiTrash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConfigFieldsBuilder; 