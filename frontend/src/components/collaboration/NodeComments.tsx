import React, { useEffect, useState, useCallback } from 'react';
import { useCollaborationStore } from '../../store/collaborationStore';
import { FiMessageSquare, FiSend, FiX } from 'react-icons/fi';

interface Comment {
  id: string;
  text: string;
  userId?: string;
  userName?: string;
  timestamp: string;
}

interface NodeCommentsProps {
  nodeId: string;
  onClose?: () => void;
}

const NodeComments: React.FC<NodeCommentsProps> = ({ nodeId, onClose }) => {
  const { doc, addComment, provider } = useCollaborationStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  // Get current user's name for placeholder, fallback to 'User'
  const currentUserName = provider?.awareness.getLocalState()?.['name'] || 'User'; 


  useEffect(() => {
    if (!doc || !nodeId) {
      setComments([]); // Clear comments if no doc or nodeId
      return;
    }

    const commentsMap = doc.getMap('comments');
    
    const loadComments = () => {
      const nodeComments = (commentsMap.get(nodeId) as Comment[] | undefined) || [];
      // Sort comments by timestamp, newest first for typical chat display
      setComments(nodeComments.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    };

    loadComments(); 
    commentsMap.observeDeep(loadComments); 

    return () => {
      commentsMap.unobserveDeep(loadComments);
    };
  }, [doc, nodeId]);

  const handleAddComment = useCallback(() => {
    if (newComment.trim() === '' || !nodeId) return;
    // The addComment function in store should handle adding userId, userName, timestamp
    addComment(nodeId, newComment.trim());
    setNewComment('');
  }, [newComment, nodeId, addComment]);

  return (
    <div className="p-3 bg-white rounded-lg border border-gray-200 flex flex-col h-full max-h-[400px] min-h-[200px] text-sm">
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200">
        <h4 className="font-semibold text-gray-700 flex items-center text-base">
          <FiMessageSquare className="mr-2 text-indigo-500" />Comments
        </h4>
        {onClose && (
          <button 
            onClick={onClose} 
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            aria-label="Close comments"
          >
            <FiX size={18}/>
          </button>
        )}
      </div>
      
      <div className="flex-grow overflow-y-auto mb-2 pr-1 space-y-2.5 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {comments.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4 italic">No comments on this node yet.</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="p-2 bg-gray-50 rounded-md border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-xs font-bold text-indigo-700">{comment.userName || 'Anonymous'}</span>
                <span className="text-xxs text-gray-400">
                  {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} | {new Date(comment.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric'})}
                </span>
              </div>
              <p className="text-xs text-gray-700 whitespace-pre-wrap break-words">{comment.text}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleAddComment(); }} className="mt-auto flex items-center border-t border-gray-200 pt-2.5">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={`Add comment as ${currentUserName}...`}
          className="flex-grow p-1.5 border border-gray-300 rounded-l-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-xs"
          aria-label="New comment input"
        />
        <button
          type="submit"
          disabled={!newComment.trim()}
          className="bg-indigo-600 text-white p-1.5 rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-60 flex items-center justify-center px-3 sm:text-xs"
          aria-label="Send comment"
        >
          <FiSend size={14}/>
        </button>
      </form>
    </div>
  );
};

export default NodeComments; 