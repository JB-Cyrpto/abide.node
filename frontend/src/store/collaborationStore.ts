import { create } from 'zustand';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { nanoid } from 'nanoid';
import { encryptMessage, decryptMessage } from '../utils/encryption';

interface CollaborationState {
  doc: Y.Doc | null;
  provider: WebsocketProvider | null;
  users: Map<string, {
    id: string;
    name: string;
    color: string;
    position?: { x: number; y: number };
  }>;
  
  // Connection Management
  connect: (roomId: string, userId: string, userName: string) => void;
  disconnect: () => void;
  
  // Cursor Management
  updateCursor: (position: { x: number; y: number }) => void;
  
  // Comments and Chat
  addComment: (nodeId: string, text: string) => void;
  sendChatMessage: (message: string) => void;
  
  // Version Control
  createBranch: (name: string) => void;
  switchBranch: (name: string) => void;
  mergeBranch: (sourceBranch: string, targetBranch: string) => void;
}

export const useCollaborationStore = create<CollaborationState>((set, get) => ({
  doc: null,
  provider: null,
  users: new Map(),
  
  connect: (roomId, userId, userName) => {
    const doc = new Y.Doc();
    const provider = new WebsocketProvider(
      import.meta.env.VITE_COLLABORATION_WS_URL,
      roomId,
      doc,
      { params: { userId, userName } }
    );
    
    provider.awareness.setLocalState({
      id: userId,
      name: userName,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
    });
    
    set({ doc, provider });
    
    // Set up collaboration features
    const workflowMap = doc.getMap('workflow');
    const chatArray = doc.getArray('chat');
    const commentsMap = doc.getMap('comments');
    
    // Sync with local state
    workflowMap.observe(() => {
      const workflow = workflowMap.toJSON();
      if (workflow) {
        const decryptedWorkflow = decryptMessage(
          workflow,
          import.meta.env.VITE_ENCRYPTION_KEY
        );
        useWorkflowStore.getState().loadWorkflow(decryptedWorkflow);
      }
    });
  },
  
  disconnect: () => {
    const { provider } = get();
    if (provider) {
      provider.disconnect();
      set({ doc: null, provider: null });
    }
  },
  
  updateCursor: (position) => {
    const { provider } = get();
    if (provider) {
      const awareness = provider.awareness;
      const currentState = awareness.getLocalState();
      awareness.setLocalState({
        ...currentState,
        position,
      });
    }
  },
  
  addComment: (nodeId, text) => {
    const { doc } = get();
    if (!doc) return;
    
    const commentsMap = doc.getMap('comments');
    const nodeComments = commentsMap.get(nodeId) || [];
    commentsMap.set(nodeId, [
      ...nodeComments,
      {
        id: nanoid(),
        text,
        userId: provider?.awareness.getLocalState().id,
        userName: provider?.awareness.getLocalState().name,
        timestamp: new Date().toISOString(),
      },
    ]);
  },
  
  sendChatMessage: (message) => {
    const { doc, provider } = get();
    if (!doc || !provider) return;
    
    const chatArray = doc.getArray('chat');
    chatArray.push([{
      id: nanoid(),
      text: message,
      userId: provider.awareness.getLocalState().id,
      userName: provider.awareness.getLocalState().name,
      timestamp: new Date().toISOString(),
    }]);
  },
  
  createBranch: (name) => {
    // Implementation for branch creation
  },
  
  switchBranch: (name) => {
    // Implementation for branch switching
  },
  
  mergeBranch: (sourceBranch, targetBranch) => {
    // Implementation for branch merging
  },
}));