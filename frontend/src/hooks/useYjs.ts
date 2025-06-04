import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { Awareness } from 'y-protocols/awareness';
import { useEffect, useState } from 'react';

// Define a unique room name for this workflow.
// In a real application, this might come from the URL or a database.
const ROOM_NAME = 'visual-workflow-collaboration-room';

interface YjsHookValue {
  doc: Y.Doc | null;
  provider: WebrtcProvider | null;
  awareness: Awareness | null;
  nodesMap: Y.Map<any> | null; // For storing nodes
  edgesArray: Y.Array<any> | null; // For storing edges
}

export const useYjs = (): YjsHookValue => {
  const [yjsValue, setYjsValue] = useState<YjsHookValue>({
    doc: null,
    provider: null,
    awareness: null,
    nodesMap: null,
    edgesArray: null,
  });

  useEffect(() => {
    const yDoc = new Y.Doc();
    // For simplicity, we'll use a hardcoded room name.
    // In a real app, you'd likely want this to be dynamic, perhaps based on the workflow ID.
    const yProvider = new WebrtcProvider(ROOM_NAME, yDoc, {
      // Specify signaling servers if needed, otherwise it uses public defaults
      // signaling: ['ws://localhost:4444']
    });
    const yAwareness = new Awareness(yDoc);

    // Get Yjs shared types for nodes and edges
    // We'll use a Y.Map for nodes for easier keyed access by node ID
    // And a Y.Array for edges
    const yNodesMap = yDoc.getMap('nodes');
    const yEdgesArray = yDoc.getArray('edges');

    setYjsValue({
      doc: yDoc,
      provider: yProvider,
      awareness: yAwareness,
      nodesMap: yNodesMap,
      edgesArray: yEdgesArray,
    });

    // Cleanup on unmount
    return () => {
      yProvider.disconnect();
      yDoc.destroy();
    };
  }, []); // Empty dependency array ensures this runs once on mount

  return yjsValue;
}; 