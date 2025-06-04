import React, { memo, useEffect, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FiLink, FiCopy, FiCheck } from 'react-icons/fi';
import { PortConfig } from '../plugins/sdk'; // Import PortConfig

export interface WebhookTriggerNodeData {
  label?: string;
  webhookId: string; // This will be the unique part of the URL
  lastPayload?: any; // To store the last received payload (optional)
  lastTriggered?: string; // Timestamp of the last trigger
  error?: string | null;
  outputs?: PortConfig[]; // Added for dynamic outputs
  // Add any other specific data you need, e.g., method (POST, GET), authentication details
}

const WebhookTriggerNode: React.FC<NodeProps<WebhookTriggerNodeData>> = ({ id, data, selected, isConnectable }) => {
  const [baseUrl, setBaseUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const outputs = data.outputs || []; // Fallback to empty array

  useEffect(() => {
    // Fetch base URL from environment variable on client-side
    // NEXT_PUBLIC_BASE_URL should be set in your .env.local or environment configuration
    setBaseUrl(process.env.NEXT_PUBLIC_BASE_URL || window.location.origin);
  }, []);

  const webhookUrl = `${baseUrl}/api/webhooks/${data.webhookId || id}`; // Use data.webhookId if available, else node id

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset copied state after 2 seconds
    }).catch(err => {
      console.error('Failed to copy webhook URL: ', err);
      // Optionally, set an error message in node data or show an alert
      data.error = "Failed to copy URL to clipboard.";
    });
  };

  // Effect to listen for webhook triggers specific to this node
  // This is a conceptual example. Actual implementation might involve a global event bus
  // or a WebSocket connection if immediate UI updates are needed from server-side triggers.
  useEffect(() => {
    const handleWebhookEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.webhookId === (data.webhookId || id)) {
        if (data.lastPayload !== customEvent.detail.payload) {
            data.lastPayload = customEvent.detail.payload;
        }
        const triggerTime = new Date().toISOString();
        if (data.lastTriggered !== triggerTime) {
            data.lastTriggered = triggerTime;
        }
        // Here, you might want to trigger a re-render if using local state for display
        // or rely on React Flow to re-render if data object is updated via a store and prop change.
        console.log(`Webhook node ${id} received data:`, customEvent.detail.payload);
        // Forcing a shallow copy to help React Flow detect change if data object is mutated directly
        // This is generally not the recommended way; prefer updating through a store or callback prop.
        // Example: onUpdateNodeData(id, { ...data, lastPayload: customEvent.detail.payload, lastTriggered: new Date().toISOString() });
      }
    };

    document.addEventListener('trigger-webhook', handleWebhookEvent);
    return () => {
      document.removeEventListener('trigger-webhook', handleWebhookEvent);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, data.webhookId]); // data object itself isn't stable if mutated directly

  return (
    <div 
      className={`p-4 rounded-lg shadow-xl border-2 ${selected ? 'border-indigo-600' : 'border-gray-300'} bg-gradient-to-br from-purple-500 to-indigo-600 text-white w-72 min-h-[180px]`}
    >
      <div className="font-bold text-md mb-2 text-center capitalize truncate" title={data.label || 'Webhook Trigger'}>{data.label || 'Webhook Trigger'}</div>
      <div className="text-sm space-y-2">
        <p className="font-semibold">Webhook URL:</p>
        <div className="flex items-center bg-black bg-opacity-25 p-2 rounded-md text-xs font-mono break-all">
          <FiLink className="mr-2 flex-shrink-0" />
          <span className="flex-grow" title={webhookUrl}>{webhookUrl}</span>
          <button 
            onClick={handleCopy} 
            title="Copy URL" 
            className="ml-2 p-1.5 hover:bg-white hover:text-indigo-600 rounded focus:outline-none transition-colors flex-shrink-0"
          >
            {copied ? <FiCheck className="text-green-400" /> : <FiCopy />}
          </button>
        </div>
        {data.error && <p className="text-red-300 bg-black bg-opacity-40 p-1.5 rounded text-xs">Error: {data.error}</p>}
        {data.lastTriggered && 
          <p className="text-xs text-gray-200 mt-1">
            Last triggered: {new Date(data.lastTriggered).toLocaleString()}
          </p>
        }
        {data.lastPayload && (
          <details className="mt-1 text-xs">
            <summary className="cursor-pointer text-gray-300 hover:text-white">Show last payload</summary>
            <pre className="mt-1 p-2 bg-black bg-opacity-20 rounded max-h-24 overflow-auto text-gray-200 scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-700">
              {JSON.stringify(data.lastPayload, null, 2)}
            </pre>
          </details>
        )}
      </div>

      {/* Dynamically render output Handles */}
      {outputs.map((port, index) => (
        <Handle
          key={port.id}
          type="source"
          position={Position.Right}
          id={port.id}
          data-testid={`output-${port.id}`}
          data-type={port.dataType}
          isConnectable={isConnectable} // Use isConnectable prop
          className="!bg-emerald-400 w-3 h-3 border-2 !border-white shadow-md transform translate-y-[-50%]"
          style={{ top: outputs.length > 1 ? `${(index + 1) * (100 / (outputs.length + 1))}%` : '50%' }}
        >
          <span className="absolute right-full mr-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-600 bg-white px-1 rounded shadow">
            {port.name}
          </span>
        </Handle>
      ))}
    </div>
  );
};

export default memo(WebhookTriggerNode); 