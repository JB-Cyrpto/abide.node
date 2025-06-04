import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';

interface CreateWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateWorkflowModal: React.FC<CreateWorkflowModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  const { createWorkflow, setActiveWorkflow } = useWorkflowStore();
  
  if (!isOpen) return null;
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;
    
    const id = createWorkflow(name, description);
    setActiveWorkflow(id);
    
    // Reset form and close modal
    setName('');
    setDescription('');
    onClose();
  };
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-fade-in">
        <div className="border-b px-4 py-3 flex items-center justify-between">
          <h3 className="font-medium">Create New Workflow</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Workflow Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter workflow name"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              placeholder="Enter workflow description"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className={`px-4 py-2 rounded-md ${
                !name.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateWorkflowModal;