import React, { useState, useRef } from 'react';
import { X, Zap, Send } from 'lucide-react';
import { useAIAssistantStore } from '../../store/aiAssistantStore';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
  onApplyChanges: (code: string) => void;
}

const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  initialCode = '',
  onApplyChanges,
}) => {
  const [prompt, setPrompt] = useState('');
  const [code, setCode] = useState(initialCode);
  const [conversation, setConversation] = useState<Array<{ role: 'system' | 'user' | 'assistant', content: string }>>([]);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { isProcessing, generateCode, generateCompletion } = useAIAssistantStore();
  
  if (!isOpen) return null;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim() || isProcessing) return;
    
    // Add user message to conversation
    setConversation([...conversation, { role: 'user', content: prompt }]);
    
    try {
      // Determine if this is code completion or generation
      let response;
      if (code) {
        // Code completion
        response = await generateCompletion(code, prompt);
      } else {
        // Code generation
        response = await generateCode(prompt);
      }
      
      // Add AI response to conversation
      setConversation(prev => [
        ...prev, 
        { role: 'assistant', content: response.result }
      ]);
      
      // Update code
      setCode(response.result);
      
      // Clear prompt
      setPrompt('');
      
      // Focus input again
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } catch (error) {
      console.error('Error with AI assistant:', error);
      setConversation(prev => [
        ...prev, 
        { role: 'system', content: 'An error occurred. Please try again.' }
      ]);
    }
  };
  
  const handleApply = () => {
    onApplyChanges(code);
    onClose();
  };
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full h-[32rem] flex flex-col overflow-hidden animate-fade-in">
        <div className="border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <Zap size={18} className="text-secondary-500 mr-2" />
            <h3 className="font-medium">AI Assistant</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 flex overflow-hidden">
          {/* Conversation Panel */}
          <div className="w-1/2 border-r overflow-y-auto p-4 flex flex-col space-y-4">
            {conversation.length === 0 ? (
              <div className="text-center text-gray-500 italic my-8">
                Start a conversation with the AI assistant
              </div>
            ) : (
              conversation.map((message, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-primary-50 ml-8'
                      : message.role === 'system'
                        ? 'bg-warning-50 text-warning-800'
                        : 'bg-gray-100 mr-8'
                  }`}
                >
                  <div className="text-xs font-medium mb-1 text-gray-500">
                    {message.role === 'user' ? 'You' : message.role === 'assistant' ? 'AI Assistant' : 'System'}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                </div>
              ))
            )}
          </div>
          
          {/* Code Panel */}
          <div className="w-1/2 flex flex-col">
            <div className="bg-gray-100 px-3 py-2 border-b">
              <h4 className="text-sm font-medium">Generated Code</h4>
            </div>
            <div className="flex-1 overflow-auto bg-gray-50 p-4">
              <pre className="text-sm font-mono whitespace-pre-wrap">{code || 'No code generated yet'}</pre>
            </div>
          </div>
        </div>
        
        {/* Input Area */}
        <div className="border-t p-4">
          <div className="flex space-x-2">
            <form onSubmit={handleSubmit} className="flex-1 flex space-x-2">
              <textarea
                ref={inputRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask the AI to generate or modify code..."
                className="flex-1 border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                rows={2}
                disabled={isProcessing}
              />
              <button
                type="submit"
                disabled={isProcessing || !prompt.trim()}
                className={`px-4 rounded-md ${
                  isProcessing || !prompt.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                } flex items-center justify-center`}
              >
                <Send size={18} />
              </button>
            </form>
            <button
              onClick={handleApply}
              disabled={!code}
              className={`px-4 py-2 rounded-md ${
                !code
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-secondary-600 text-white hover:bg-secondary-700'
              }`}
            >
              Apply
            </button>
          </div>
          {isProcessing && (
            <div className="mt-2 text-sm text-gray-600 animate-pulse-slow">
              AI is processing your request...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAssistantModal;