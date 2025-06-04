import React, { useState } from 'react';
import { useWorkflowStore } from '../../store/workflowStore';
import { X, Search, Download, Upload, Tag } from 'lucide-react';

interface TemplateGalleryProps {
  onClose: () => void;
}

const TemplateGallery: React.FC<TemplateGalleryProps> = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { workflows } = useWorkflowStore();
  
  const templates = workflows.filter(w => w.template);
  
  const categories = ['all', ...new Set(templates.flatMap(t => t.tags || []))];
  
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.tags?.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });
  
  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-medium">Template Gallery</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X size={20} />
        </button>
      </div>
      
      <div className="p-4 space-y-4 border-b">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
        
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category === 'all' ? 'All' : category}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {filteredTemplates.map(template => (
          <div
            key={template.id}
            className="p-4 border-b hover:bg-gray-50"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">{template.name}</h4>
              <div className="flex space-x-2">
                <button
                  onClick={() => {/* Import template logic */}}
                  className="p-1.5 text-primary-500 hover:bg-primary-50 rounded"
                  title="Use template"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-2">
              {template.description}
            </p>
            
            {template.tags && template.tags.length > 0 && (
              <div className="flex items-center space-x-2">
                <Tag size={14} className="text-gray-400" />
                <div className="flex space-x-1">
                  {template.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t bg-gray-50">
        <button
          onClick={() => {/* Export current workflow as template logic */}}
          className="w-full flex items-center justify-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          <Upload size={18} className="mr-2" />
          Share as Template
        </button>
      </div>
    </div>
  );
};

export default TemplateGallery;