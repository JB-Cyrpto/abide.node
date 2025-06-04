import { Node as ReactFlowNode, Edge as ReactFlowEdge } from 'reactflow';
import pluginRegistry from '../../plugins/registry';
import { NodePlugin } from '../../plugins/sdk';
import { WorkflowDefinition, WorkflowRun, StepExecutionResult, ExecutionJob } from '../types';
import { v4 as uuidv4 } from 'uuid';

class WorkflowExecutor {
  private activeRuns: Map<string, WorkflowRun> = new Map(); // In-memory store for active runs

  public async startWorkflow(definition: WorkflowDefinition): Promise<WorkflowRun> {
    const runId = uuidv4();
    const workflowRun: WorkflowRun = {
      id: runId,
      workflowDefinitionId: definition.id,
      status: 'pending',
      startedAt: new Date().toISOString(),
      contextData: {},
    };
    this.activeRuns.set(runId, workflowRun);

    console.log(`Starting workflow run: ${runId} for definition: ${definition.name}`);
    workflowRun.status = 'running';

    // Find trigger node(s)
    const triggerNodes = definition.nodes.filter(node => {
      const plugin = pluginRegistry.getPlugin(node.type || '');
      // Assuming trigger nodes have no workflow inputs defined in their plugin spec
      return plugin && plugin.inputs.length === 0;
    });

    if (triggerNodes.length === 0) {
      console.error('No trigger node found in workflow definition.');
      workflowRun.status = 'failed';
      workflowRun.error = { message: 'No trigger node found.' };
      workflowRun.completedAt = new Date().toISOString();
      return workflowRun;
    }
    if (triggerNodes.length > 1) {
      // For now, we'll simplify and just pick the first one. 
      // Real engine might support multiple triggers or require a single one explicitly marked.
      console.warn('Multiple trigger nodes found. Executing the first one only for now.');
    }
    const firstTriggerNode = triggerNodes[0];
    
    // Simulate adding the first job (trigger node execution) to a conceptual queue (directly execute for now)
    await this.executeNode(workflowRun, firstTriggerNode, definition.nodes, definition.edges);
    
    // Note: The rest of the workflow execution (following nodes) will be driven by executeNode finding next steps.
    // If all paths complete successfully, status should be updated.
    // If executeNode throws an unhandled error or a node fails, status should be updated.

    // For this simplified in-memory runner, we might need a check here or after executeNode
    // to see if the workflow is truly finished or if there were errors.
    if (workflowRun.status === 'running') { // If not already set to failed or completed by executeNode chain
        // This is a simplification. A real engine would track path completions.
        // If all reachable paths from the trigger have been executed without terminal failure:
        const allNodesExecuted = Object.keys(workflowRun.contextData).length >= definition.nodes.length; // Very naive check
        if(true) { // Placeholder for a more robust completion check
            workflowRun.status = 'completed';
            console.log(`Workflow run ${runId} potentially completed.`);
        }
    }
    workflowRun.completedAt = new Date().toISOString();
    this.activeRuns.delete(runId); // Clean up after completion/failure for this simple model
    return workflowRun;
  }

  private async executeNode(run: WorkflowRun, node: ReactFlowNode, allNodes: ReactFlowNode[], allEdges: ReactFlowEdge[]): Promise<void> {
    run.currentStepId = node.id;
    console.log(`Executing node: ${node.data.label || node.id} (Type: ${node.type}) for run: ${run.id}`);

    const plugin = pluginRegistry.getPlugin(node.type || '');
    if (!plugin) {
      run.status = 'failed';
      run.error = { nodeId: node.id, message: `Plugin not found for node type: ${node.type}` };
      console.error(run.error.message);
      return;
    }

    // 1. Gather inputs for the current node
    const nodeInputs: Record<string, any> = {};
    const incomingEdges = allEdges.filter(edge => edge.target === node.id);

    for (const edge of incomingEdges) {
      const sourceNodeOutputKey = `${edge.source}.${edge.sourceHandle || 'output'}`;
      // console.log(`Looking for key: ${sourceNodeOutputKey} in context:`, run.contextData);
      if (run.contextData[sourceNodeOutputKey] !== undefined) {
        // The target handle on the current node determines which input of the plugin gets this data
        const targetInputId = edge.targetHandle || 'input'; // Assume default 'input' if no specific handle
        nodeInputs[targetInputId] = run.contextData[sourceNodeOutputKey];
      } else {
        // This could be an issue if an input is expected but not found.
        // For triggers or nodes with optional inputs, this might be fine.
        console.warn(`Input data for ${node.id} from ${edge.source} (handle: ${edge.sourceHandle}) not found in contextData.`);
      }
    }
    console.log(`Inputs for node ${node.id}:`, nodeInputs);

    // 2. Execute the node via its plugin
    let stepResult: StepExecutionResult = {
        nodeId: node.id,
        status: 'error', // Default to error
        startedAt: new Date().toISOString(),
        completedAt: '',
        inputs: nodeInputs,
    };

    try {
      const outputData = await plugin.run(nodeInputs, { nodeData: node.data /*, other context */ });
      stepResult.outputs = outputData;
      stepResult.status = 'success';
      console.log(`Node ${node.id} executed successfully. Output:`, outputData);

      // Store outputs in the run's contextData, keyed by `nodeId.outputPortId`
      if (outputData) {
        for (const outputPortId in outputData) {
          const contextKey = `${node.id}.${outputPortId}`;
          run.contextData[contextKey] = outputData[outputPortId];
          // console.log(`Stored ${contextKey} in context:`, outputData[outputPortId]);
        }
      }
    } catch (error: any) {
      stepResult.status = 'error';
      stepResult.error = error.message || 'Unknown execution error';
      run.status = 'failed';
      run.error = { nodeId: node.id, message: stepResult.error, details: error };
      console.error(`Error executing node ${node.id}:`, error);
      stepResult.completedAt = new Date().toISOString();
      // TODO: Store stepResult (log it)
      return; // Stop further execution on this path on error
    }
    stepResult.completedAt = new Date().toISOString();
    // TODO: Store stepResult (log it)

    // 3. Find and execute next node(s)
    if (stepResult.status === 'success') {
      const outgoingEdges = allEdges.filter(edge => edge.source === node.id);
      if (outgoingEdges.length === 0 && run.status !== 'failed') {
        // This might be an end node of a path. 
        // The overall workflow completion is checked in startWorkflow for now.
        console.log(`Node ${node.id} is an end node or has no outgoing connections.`);
      }
      for (const edge of outgoingEdges) {
        const nextNode = allNodes.find(n => n.id === edge.target);
        if (nextNode) {
          // For now, execute sequentially and await. A real queue would handle this.
          await this.executeNode(run, nextNode, allNodes, allEdges);
          if (run.status === 'failed') break; // If a downstream node failed, stop this path
        }
      }
    }
  }

  // Placeholder for fetching run status (would be from DB/Redis in reality)
  public getWorkflowRunStatus(runId: string): WorkflowRun | undefined {
    return this.activeRuns.get(runId);
  }
}

const workflowExecutor = new WorkflowExecutor();
export default workflowExecutor; 