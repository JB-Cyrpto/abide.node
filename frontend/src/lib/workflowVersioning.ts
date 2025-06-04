import { Node, Edge, Viewport } from 'reactflow';
import { v4 as uuidv4 } from 'uuid';

const WORKFLOW_VERSIONS_STORAGE_KEY = 'workflowVersionsHistory';

export interface RFState {
  nodes: Node<any>[];
  edges: Edge<any>[];
  viewport: Viewport;
}

export interface WorkflowVersion extends RFState {
  versionId: string;
  name: string;
  createdAt: string;
}

/**
 * Retrieves all saved workflow versions from local storage.
 */
export const getWorkflowVersions = (): WorkflowVersion[] => {
  try {
    const storedVersions = localStorage.getItem(WORKFLOW_VERSIONS_STORAGE_KEY);
    return storedVersions ? JSON.parse(storedVersions) : [];
  } catch (error) {
    console.error("Error reading workflow versions from local storage:", error);
    return [];
  }
};

/**
 * Saves the current workflow state as a new version.
 * @param currentState The current React Flow state (nodes, edges, viewport).
 * @param versionName Optional name for this version.
 * @returns The created WorkflowVersion object.
 */
export const saveWorkflowVersion = (
  currentState: RFState,
  versionName?: string
): WorkflowVersion | null => {
  try {
    const versions = getWorkflowVersions();
    const newVersion: WorkflowVersion = {
      ...currentState,
      versionId: uuidv4(),
      name: versionName || `Saved at ${new Date().toLocaleString()}`,
      createdAt: new Date().toISOString(),
    };
    versions.unshift(newVersion); // Add to the beginning of the array
    localStorage.setItem(WORKFLOW_VERSIONS_STORAGE_KEY, JSON.stringify(versions));
    return newVersion;
  } catch (error) {
    console.error("Error saving workflow version to local storage:", error);
    return null;
  }
};

/**
 * Loads a specific workflow version by its ID.
 * @param versionId The ID of the version to load.
 * @returns The WorkflowVersion object or null if not found or error.
 */
export const loadWorkflowVersion = (versionId: string): WorkflowVersion | null => {
  try {
    const versions = getWorkflowVersions();
    const versionToLoad = versions.find(v => v.versionId === versionId);
    return versionToLoad || null;
  } catch (error) {
    console.error("Error loading workflow version from local storage:", error);
    return null;
  }
};

/**
 * Deletes a specific workflow version by its ID.
 * @param versionId The ID of the version to delete.
 * @returns True if deletion was successful, false otherwise.
 */
export const deleteWorkflowVersion = (versionId: string): boolean => {
  try {
    let versions = getWorkflowVersions();
    const initialLength = versions.length;
    versions = versions.filter(v => v.versionId !== versionId);
    if (versions.length < initialLength) {
      localStorage.setItem(WORKFLOW_VERSIONS_STORAGE_KEY, JSON.stringify(versions));
      return true;
    }
    return false; // Version not found
  } catch (error) {
    console.error("Error deleting workflow version from local storage:", error);
    return false;
  }
};

/**
 * Clears all saved workflow versions from local storage.
 */
export const clearAllWorkflowVersions = (): void => {
  try {
    localStorage.removeItem(WORKFLOW_VERSIONS_STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing all workflow versions from local storage:", error);
  }
}; 