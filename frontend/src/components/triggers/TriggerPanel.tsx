import React, { useState } from 'react';
import { useTriggerStore } from '../../store/triggerStore';
import { useWorkflowStore } from '../../store/workflowStore';
import { X, Plus, Clock, Webhook, Zap, Play, Pause } from 'lucide-react';

interface TriggerPanelProps {
  onClose: () => void;
}

const TriggerPanel: React.FC<TriggerPanelProps> = ({ onClose }) => {
  const { activeWorkflowId, getActiveWorkflow } = useWorkflowStore();
  const {
    createTrigger,
    deleteTrigger,
    enableTrigger,
    disableTrigger,
  } = useTriggerStore();
  
  const [showNewTrigger, setShowNewTrigger] = useState(false);
  const [newTriggerType, setNewTriggerType] = useState<'schedule' | 'webhook' | 'event'>('schedule');
  const [cronExpression, setCronExpression] = useState('');
  const [webhookEndpoint, setWebhookEndpoint] = useState('');
  const [eventName, setEventName] = useState('');
  
  const workflow = getActiveWorkflow();
  const triggers = workflow?.triggers || [];
  
  const handleCreateTrigger = () => {
    if (!activeWorkflowId) return;
    
    let config: Record<string, any> = {};
    
    switch (newTriggerType) {
      case 'schedule':
        config = { cronExpression };
        break;
      case 'webhook':
        config = { endpoint: webhookEndpoint };
        break;
      case 'event':
        config = { eventName };
        break;
    }
    
    createTrigger(activeWorkflowId, newTriggerType, config);
    setShowNewTrigger(false);
  };
  
  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-medium">Triggers</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X size={20} />
        </button>
      </div>
      
      <div className="p-4">
        <button
          onClick={() => setShowNewTrigger(true)}
          className="w-full flex items-center justify-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          <Plus size={18} className="mr-2" />
          Add Trigger
        </button>
      </div>
      
      {showNewTrigger && (
        <div className="p-4 border-t bg-gray-50">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trigger Type
              </label>
              <select
                value={newTriggerType}
                onChange={(e) => setNewTriggerType(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="schedule">Schedule</option>
                <option value="webhook">Webhook</option>
                <option value="event">Event</option>
              </select>
            </div>
            
            {newTriggerType === 'schedule' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cron Expression
                </label>
                <input
                  type="text"
                  value={cronExpression}
                  onChange={(e) => setCronExpression(e.target.value)}
                  placeholder="*/5 * * * *"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            )}
            
            {newTriggerType === 'webhook' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endpoint
                </label>
                <input
                  type="text"
                  value={webhookEndpoint}
                  onChange={(e) => setWebhookEndpoint(e.target.value)}
                  placeholder="/webhook/my-trigger"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            )}
            
            {newTriggerType === 'event' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Name
                </label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="my-custom-event"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            )}
            
            <div className="flex space-x-2">
              <button
                onClick={() => setShowNewTrigger(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTrigger}
                className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto">
        {triggers.map(trigger => (
          <div
            key={trigger.id}
            className="p-4 border-b hover:bg-gray-50"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                {trigger.type === 'schedule' ? (
                  <Clock size={18} className="text-blue-500 mr-2" />
                ) : trigger.type === 'webhook' ? (
                  <Webhook size={18} className="text-purple-500 mr-2" />
                ) : (
                  <Zap size={18} className="text-yellow-500 mr-2" />
                )}
                <span className="font-medium capitalize">{trigger.type}</span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => trigger.enabled
                    ? disableTrigger(activeWorkflowId!, trigger.id)
                    : enableTrigger(activeWorkflowId!, trigger.id)
                  }
                  className={`p-1 rounded ${
                    trigger.enabled
                      ? 'text-green-500 hover:bg-green-50'
                      : 'text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  {trigger.enabled ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button
                  onClick={() => deleteTrigger(activeWorkflowId!, trigger.id)}
                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              {trigger.type === 'schedule' && (
                <div>Cron: {trigger.configuration.cronExpression}</div>
              )}
              {trigger.type === 'webhook' && (
                <div>Endpoint: {trigger.configuration.endpoint}</div>
              )}
              {trigger.type === 'event' && (
                <div>Event: {trigger.configuration.eventName}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TriggerPanel;