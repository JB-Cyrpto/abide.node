import React from 'react';
import { Item, Menu, Separator, Submenu, useContextMenu } from 'react-contexify';
import 'react-contexify/ReactContexify.css';
import { // Importing icons - you might need to install a library like react-icons
    FiEdit3, FiCopy, FiTrash2, FiChevronsRight 
} from 'react-icons/fi'; // Example using Feather Icons

export const NODE_CONTEXT_MENU_ID = 'node-context-menu';

interface NodeContextMenuProps {
  // Callbacks for menu actions
  onEdit: (nodeId: string) => void;
  onDuplicate: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  // You can add more actions like 'Bring to front', 'Send to back', etc.
}

// A simple, clean, Apple-like style for menu items
const menuItemStyle = "flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-indigo-500 hover:text-white rounded-md transition-colors duration-150 cursor-pointer";
const disabledMenuItemStyle = "flex items-center px-3 py-2 text-sm text-gray-400 cursor-not-allowed";
const iconStyle = "mr-3 h-4 w-4";

const NodeContextMenu: React.FC<NodeContextMenuProps> = ({ onEdit, onDuplicate, onDelete }) => {
  // The `props` here would be passed from the `show` function when triggering the menu
  // Typically, this would include the ID of the node that was right-clicked.
  const handleItemClick = ({ id, props }: { id?: string, props?: { nodeId?: string } }) => {
    const nodeId = props?.nodeId;
    if (!nodeId) return;

    switch (id) {
      case 'edit':
        onEdit(nodeId);
        break;
      case 'duplicate':
        onDuplicate(nodeId);
        break;
      case 'delete':
        onDelete(nodeId);
        break;
      // Add more cases for other actions
    }
  };

  return (
    <Menu id={NODE_CONTEXT_MENU_ID} animation="fade" theme="light" className="rounded-lg shadow-xl border border-gray-200 p-1.5 min-w-[180px]">
      <Item id="edit" onClick={handleItemClick} data={{ test: 'test'}}>
        <div className={menuItemStyle}>
          <FiEdit3 className={iconStyle} /> Edit Node
        </div>
      </Item>
      <Item id="duplicate" onClick={handleItemClick}>
        <div className={menuItemStyle}>
          <FiCopy className={iconStyle} /> Duplicate
        </div>
      </Item>
      <Separator />
      {/* Example of a submenu - not implemented fully yet */}
      {/* <Submenu 
        label={<div className={menuItemStyle}><FiChevronsRight className={iconStyle} /> More Options</div>}
        arrow={<FiChevronsRight className="ml-auto h-4 w-4 text-gray-500" />}
      >
        <Item onClick={handleItemClick} id="bring-to-front">
            <div className={menuItemStyle}>Bring to Front</div>
        </Item>
        <Item onClick={handleItemClick} id="send-to-back">
            <div className={menuItemStyle}>Send to Back</div>
        </Item>
      </Submenu> */}
      <Separator />
      <Item id="delete" onClick={handleItemClick}>
        <div className={`${menuItemStyle} text-red-600 hover:bg-red-500 hover:text-white`}>
          <FiTrash2 className={iconStyle} /> Delete Node
        </div>
      </Item>
    </Menu>
  );
};

export default NodeContextMenu; 