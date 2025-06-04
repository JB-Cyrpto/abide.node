import React, { useState, useEffect } from 'react';
import { useCollaborationStore } from '../../store/collaborationStore';
import { X, MessageSquare, GitBranch, Users } from 'lucide-react';

interface CollaborationPanelProps {
  onClose: () => void;
}

const CollaborationPanel: React.FC<CollaborationPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'branches' | 'users'>('chat');
  const [message, setMessage] = useState('');
  const { users, sendChatMessage, createBranch } = useCollaborationStore();
  
  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-medium">Collaboration</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X size={20} />
        </button>
      </div>
      
      <div className="flex border-b">
        <button
          className={`flex-1 p-2 text-sm font-medium ${
            activeTab === 'chat' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('chat')}
        >
          <MessageSquare size={16} className="inline mr-1" />
          Chat
        </button>
        <button
          className={`flex-1 p-2 text-sm font-medium ${
            activeTab === 'branches' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('branches')}
        >
          <GitBranch size={16} className="inline mr-1" />
          Branches
        </button>
        <button
          className={`flex-1 p-2 text-sm font-medium ${
            activeTab === 'users' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} className="inline mr-1" />
          Users
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 space-y-4">
              {/* Chat messages would go here */}
            </div>
            <div className="mt-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (message.trim()) {
                    sendChatMessage(message);
                    setMessage('');
                  }
                }}
                className="flex space-x-2"
              >
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        )}
        
        {activeTab === 'branches' && (
          <div className="space-y-4">
            <button
              onClick={() => {
                const name = prompt('Enter branch name:');
                if (name) createBranch(name);
              }}
              className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg"
            >
              Create Branch
            </button>
            {/* Branch list would go here */}
          </div>
        )}
        
        {activeTab === 'users' && (
          <div className="space-y-2">
            {Array.from(users.values()).map(user => (
              <div
                key={user.id}
                className="flex items-center space-x-2 p-2 rounded-lg bg-gray-50"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: user.color }}
                />
                <span>{user.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollaborationPanel;