import React, { useEffect, useState } from 'react';
import { useCollaborationStore } from '../../store/collaborationStore';

interface CollaboratorAwarenessState {
  id: string;
  name: string;
  color: string;
  position?: { x: number; y: number };
  // Add other awareness state properties if they exist
}

const CollaboratorCursors: React.FC = () => {
  const { provider } = useCollaborationStore();
  const [collaborators, setCollaborators] = useState<Map<number, CollaboratorAwarenessState>>(new Map());
  const localClientId = provider?.awareness.clientID;

  useEffect(() => {
    if (!provider) return;

    const awareness = provider.awareness;

    const updateCollaboratorsState = () => {
      const states = awareness.getStates() as Map<number, CollaboratorAwarenessState>;
      const filteredStates = new Map<number, CollaboratorAwarenessState>();
      states.forEach((state, clientId) => {
        if (clientId !== localClientId && state.position) {
          filteredStates.set(clientId, state);
        }
      });
      setCollaborators(filteredStates);
    };

    awareness.on('change', updateCollaboratorsState);
    // Initial population
    updateCollaboratorsState(); 

    return () => {
      awareness.off('change', updateCollaboratorsState);
    };
  }, [provider, localClientId]);

  if (!provider) {
    return null;
  }

  return (
    <>
      {Array.from(collaborators.entries()).map(([clientId, state]) => {
        if (!state.position) return null;
        
        // Basic cursor style, can be enhanced
        const cursorStyle: React.CSSProperties = {
          position: 'absolute',
          left: state.position.x,
          top: state.position.y,
          zIndex: 9999, // Ensure cursors are on top
          transition: 'left 0.1s linear, top 0.1s linear', // Smooth movement
        };

        const nameStyle: React.CSSProperties = {
          position: 'absolute',
          top: '18px', // Position name below cursor icon
          left: '10px',
          backgroundColor: state.color || '#333',
          color: 'white',
          padding: '2px 6px',
          borderRadius: '3px',
          fontSize: '10px',
          whiteSpace: 'nowrap',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        };
        
        // SVG Cursor, you can replace this with any other representation
        return (
          <div key={clientId} style={cursorStyle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={state.color || '#333'} style={{ transform: 'translate(-2px, -2px)' }}>
              <path d="M6.72893 20.3134L5.66811 4.6859L20.3103 12.5L12.4256 13.545L6.72893 20.3134Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
            <span style={nameStyle}>
              {state.name || 'Guest'}
            </span>
          </div>
        );
      })}
    </>
  );
};

export default CollaboratorCursors; 