import type { NextApiRequest, NextApiResponse } from 'next';

// In-memory store for active webhooks and their workflow associations (conceptual)
// In a real application, this would be a database or a distributed cache.
interface ActiveWebhook {
  workflowId: string; // ID of the workflow this webhook belongs to
  // other relevant details, e.g., expected method, auth tokens, etc.
}
const activeWebhooks = new Map<string, ActiveWebhook>(); // webhookId -> ActiveWebhook

// This is a conceptual workflow dispatcher. 
// In a real app, this would integrate with your Yjs/Zustand setup to trigger
// the actual workflow execution engine.
const dispatchWorkflow = (webhookId: string, payload: any) => {
  console.log(`Webhook received for ID: ${webhookId}`);
  console.log(`Payload:`, payload);
  
  const webhookConfig = activeWebhooks.get(webhookId);
  if (webhookConfig) {
    console.log(`Dispatching workflow: ${webhookConfig.workflowId}`);
    // 1. TODO: Identify the specific workflow (e.g. from Yjs doc based on workflowId)
    // 2. TODO: Find the WebhookTriggerNode within that workflow that matches webhookId.
    // 3. TODO: Initiate the flow from that node, passing the payload.
    
    // For client-side UI updates (e.g., LogPanel, WebhookTriggerNode display):
    // Option A: If using WebSockets, emit an event to connected clients.
    // Option B: Dispatch a CustomEvent on the document (if client and server are same process, not typical for Next.js API routes)
    // This is conceptual for showing immediate feedback on the node in the UI.
    // In a real distributed setup, a WebSocket or server-sent event mechanism would be needed.
    if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') { // Check if in browser context (won't run in API route)
        const event = new CustomEvent('trigger-webhook', {
            detail: { 
                webhookId: webhookId, 
                payload: payload,
                timestamp: new Date().toISOString()
            }
        });
        document.dispatchEvent(event);
    }

    // For logging in the central log store (if accessible from API route, might need dedicated service)
    // import { useLogsStore } from '../../../src/store/logsStore'; // Path will be different
    // useLogsStore.getState().addLog({
    //   nodeId: webhookId, // Or the actual node ID if retrievable
    //   message: `Webhook triggered. Payload: ${JSON.stringify(payload, null, 2).substring(0,100)}...`,
    //   type: 'success'
    // });

  } else {
    console.warn(`No active workflow configured for webhook ID: ${webhookId}`);
  }
};

// Function to simulate registering a webhook when a WebhookTriggerNode is created/loaded in a workflow.
// This would typically happen when the workflow editor saves/updates a flow.
export const registerWebhook = (webhookId: string, workflowId: string) => {
  activeWebhooks.set(webhookId, { workflowId });
  console.log(`Webhook ${webhookId} registered for workflow ${workflowId}`);
};

// Function to simulate deregistering a webhook.
export const deregisterWebhook = (webhookId: string) => {
  activeWebhooks.delete(webhookId);
  console.log(`Webhook ${webhookId} deregistered`);
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query; // This is the webhookId from the URL

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Webhook ID must be a string.' });
  }

  // For demo: Register a webhook on first hit if not exists, simulating it being active.
  // In a real app, registration happens when the node is configured in the editor.
  if (!activeWebhooks.has(id)) {
    console.log(`Dynamically registering webhook ${id} for demo purposes to workflow 'demo_workflow_${id}'.`);
    registerWebhook(id, `demo_workflow_${id}`);
  }

  if (req.method === 'POST') {
    // 1. Authenticate the webhook (highly recommended for production)
    //    e.g., check a secret token in headers/payload

    // 2. Validate payload (optional, based on node configuration)

    // 3. Dispatch the workflow
    dispatchWorkflow(id, req.body);

    // 4. Respond to the webhook sender
    res.status(200).json({ message: 'Webhook received successfully.', webhookId: id, payload: req.body });
  
  } else if (req.method === 'GET') {
    // Optionally handle GET requests, e.g., for webhook verification by some services
    // Or just to confirm the endpoint is alive for a given ID
    if (activeWebhooks.has(id)) {
        res.status(200).json({ message: `Webhook endpoint for ID ${id} is active. Send POST to trigger.`, webhookId: id });
    } else {
        res.status(404).json({ message: `Webhook ID ${id} not found or not active.`, webhookId: id });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 