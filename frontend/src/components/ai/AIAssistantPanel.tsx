import React, { useState, useRef } from 'react';
import { Send, X, Maximize2, Minimize2 } from 'lucide-react';
import { useAIAssistantStore } from '../../store/aiAssistantStore';

interface AIAssistantPanelProps {
  onClose: () => void;
}

const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({ onClose }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [prompt, setPrompt] = useState('');
  const { isProcessing, generateCompletion } = useAIAssistantStore();
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isProcessing) return;

    const newMessages = [...messages, { role: 'user', content: prompt }];
    setMessages(newMessages);
    setPrompt('');

    try {
      const response = await generateCompletion(prompt);
      setMessages([...newMessages, { role: 'assistant', content: response.result }]);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div 
      className={`border-t border-gray-800 bg-gray-900 flex flex-col ${
        isExpanded ? 'h-1/2' : 'h-64'
      }`}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
        <span className="text-sm text-gray-400">AI Assistant</span>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-white"
          >
            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-3/4 rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-800 text-gray-300'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800">
        <div className="flex space-x-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask the AI assistant..."
            className="flex-1 bg-gray-800 text-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary-500"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={isProcessing || !prompt.trim()}
            className={`px-4 rounded ${
              isProcessing || !prompt.trim()
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default AIAssistantPanel;