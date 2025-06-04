import React from 'react';
import { PortConfig, DataType } from '../../plugins/sdk'; // Adjust path as needed
import { FiPlusCircle, FiTrash2, FiEdit3 } from 'react-icons/fi';

interface PortConfigurationProps {
  ports: PortConfig[];
  setPorts: (ports: PortConfig[]) => void;
  portTypeLabel: 'Input' | 'Output';
}

const dataTypes: DataType[] = ['string', 'number', 'boolean', 'object', 'array', 'any'];

const PortConfiguration: React.FC<PortConfigurationProps> = ({ ports, setPorts, portTypeLabel }) => {
  const handleAddPort = () => {
    const newPortId = `${portTypeLabel.toLowerCase()}${ports.length + 1}`;
    setPorts([...ports, { id: newPortId, name: `New ${portTypeLabel}`, dataType: 'string', description: '' }]);
  };

  const handleRemovePort = (index: number) => {
    setPorts(ports.filter((_, i) => i !== index));
  };

  const handlePortChange = (index: number, field: keyof PortConfig, value: string) => {
    const updatedPorts = ports.map((port, i) => 
      i === index ? { ...port, [field]: value } : port
    );
    setPorts(updatedPorts);
  };

  return (
    <div className="p-3 border border-gray-200 rounded-md bg-white shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-md font-medium text-gray-700">{portTypeLabel} Ports</h3>
        <button 
          type="button" 
          onClick={handleAddPort} 
          className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center p-1 rounded-md hover:bg-indigo-50"
        >
          <FiPlusCircle className="mr-1" /> Add {portTypeLabel} Port
        </button>
      </div>
      {ports.length === 0 && <p className="text-xs text-gray-500 italic">No {portTypeLabel.toLowerCase()} ports defined.</p>}
      <div className="space-y-3">
        {ports.map((port, index) => (
          <div key={index} className="p-2.5 border border-gray-200 rounded-md bg-gray-50/50 relative group">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2">
              <div>
                <label htmlFor={`${portTypeLabel}-id-${index}`} className="block text-xs font-medium text-gray-600">ID</label>
                <input 
                  type="text" 
                  id={`${portTypeLabel}-id-${index}`}
                  value={port.id}
                  onChange={(e) => handlePortChange(index, 'id', e.target.value)}
                  className="mt-0.5 block w-full shadow-sm sm:text-xs border-gray-300 rounded-md p-1.5"
                  placeholder={`e.g., ${portTypeLabel.toLowerCase()}_data`}
                />
              </div>
              <div>
                <label htmlFor={`${portTypeLabel}-name-${index}`} className="block text-xs font-medium text-gray-600">Name</label>
                <input 
                  type="text" 
                  id={`${portTypeLabel}-name-${index}`}
                  value={port.name}
                  onChange={(e) => handlePortChange(index, 'name', e.target.value)}
                  className="mt-0.5 block w-full shadow-sm sm:text-xs border-gray-300 rounded-md p-1.5"
                  placeholder={`e.g., User Data`}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor={`${portTypeLabel}-dataType-${index}`} className="block text-xs font-medium text-gray-600">Data Type</label>
                <select 
                  id={`${portTypeLabel}-dataType-${index}`}
                  value={port.dataType}
                  onChange={(e) => handlePortChange(index, 'dataType', e.target.value as DataType)}
                  className="mt-0.5 block w-full shadow-sm sm:text-xs border-gray-300 rounded-md p-1.5 bg-white"
                >
                  {dataTypes.map(dt => <option key={dt} value={dt}>{dt}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor={`${portTypeLabel}-description-${index}`} className="block text-xs font-medium text-gray-600">Description (Optional)</label>
                <input 
                  type="text" 
                  id={`${portTypeLabel}-description-${index}`}
                  value={port.description || ''}
                  onChange={(e) => handlePortChange(index, 'description', e.target.value)}
                  className="mt-0.5 block w-full shadow-sm sm:text-xs border-gray-300 rounded-md p-1.5"
                  placeholder="Describe what this port does or expects"
                />
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => handleRemovePort(index)} 
              className="absolute top-1 right-1 p-1 text-red-500 hover:text-red-700 opacity-50 group-hover:opacity-100 transition-opacity rounded-full hover:bg-red-100"
              title="Remove Port"
            >
              <FiTrash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PortConfiguration; 