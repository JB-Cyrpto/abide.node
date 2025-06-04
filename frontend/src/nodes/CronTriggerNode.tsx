import React, { memo, useEffect, useState, ChangeEvent } from 'react';
import { Handle, Position, NodeProps, Node } from 'reactflow';
import * as cronParser from 'cron-parser';
import * as cron from 'node-cron';
import { PortConfig } from '../plugins/sdk'; // Import PortConfig

export interface CronTriggerNodeData {
  label?: string;
  cronString: string;
  timezone?: string; // Optional: e.g., 'America/New_York'
  lastRun?: string;
  nextRun?: string;
  error?: string | null;
  isRunning?: boolean;
  outputs?: PortConfig[]; // Added for dynamic outputs
}

const CronTriggerNode: React.FC<NodeProps<CronTriggerNodeData>> = ({ id, data, selected, isConnectable }) => {
  const [task, setTask] = useState<cron.ScheduledTask | null>(null);
  const [nextRunTime, setNextRunTime] = useState<string | null>(data.nextRun || null);
  const [errorMessage, setErrorMessage] = useState<string | null>(data.error || null);

  const outputs = data.outputs || []; // Fallback to empty array

  useEffect(() => {
    const updateNextRun = (cronStr: string) => {
      try {
        const interval = cronParser.parseExpression(cronStr, { tz: data.timezone });
        const next = interval.next().toISOString();
        setNextRunTime(next);
        if (data.nextRun !== next) data.nextRun = next;
        setErrorMessage(null);
        if (data.error !== null) data.error = null;
      } catch (err: any) {
        const errMsg = err instanceof Error ? err.message : 'Invalid cron string';
        setNextRunTime('Invalid cron string');
        setErrorMessage(errMsg);
        if (data.error !== errMsg) data.error = errMsg;
        if (data.nextRun !== undefined) data.nextRun = undefined;
      }
    };

    if (task) {
      task.stop();
      setTask(null);
    }

    if (data.cronString && cron.validate(data.cronString)) {
      updateNextRun(data.cronString);

      const newTask = cron.schedule(data.cronString, () => {
        console.log(`Cron job triggered for node ${id} with cron: ${data.cronString}`);
        const event = new CustomEvent('trigger-cron', { detail: { nodeId: id, timestamp: new Date().toISOString() } });
        document.dispatchEvent(event);
        const nowISO = new Date().toISOString();
        if(data.lastRun !== nowISO) data.lastRun = nowISO;
        updateNextRun(data.cronString); 
      }, {
        timezone: data.timezone
      });
      setTask(newTask);
      
      if (data.isRunning !== false) {
        newTask.start();
      } else {
      }

    } else if (data.cronString) {
      updateNextRun(data.cronString);
    } else {
      setNextRunTime(null);
      setErrorMessage(null);
      if (data.error !== null) data.error = null;
      if (data.nextRun !== undefined) data.nextRun = undefined;
    }

    return () => {
      if (task) {
        task.stop();
        console.log(`Cron job stopped for node ${id}`);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, data.cronString, data.timezone]);

  // Effect to solely manage starting/stopping the task based on data.isRunning changes
  useEffect(() => {
    if (!task) {
        if(data.isRunning && data.cronString && !cron.validate(data.cronString)){
        }
        return;
    }

    const handleStatusAndToggle = async () => {
      try {
        const status = await Promise.resolve(task.getStatus()); 
        if (data.isRunning && !status.toLocaleLowerCase().includes('running')) {
          task.start();
        } else if (data.isRunning === false && status.toLocaleLowerCase().includes('running')) {
          task.stop();
        }
      } catch (e) {
        console.error("Error getting or setting task status", e);
      }
    };

    handleStatusAndToggle();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.isRunning, task]);


  return (
    <div 
      className={`p-3 rounded-md shadow-lg border-2 ${selected ? 'border-blue-500' : 'border-gray-300'} bg-gradient-to-br from-teal-500 to-cyan-600 text-white w-64 min-h-[150px]`}
    >
      <div className="font-bold text-sm mb-2 text-center capitalize truncate" title={data.label || 'Cron Trigger'}>{data.label || 'Cron Trigger'}</div>
      <div className="text-xs space-y-1.5">
        {/* <p><strong>ID:</strong> {id}</p> */} {/* ID is often internal, can be hidden */}
        <p><strong>Status:</strong> {data.isRunning && !errorMessage ? 
            <span className="text-green-300 font-semibold">Running</span> : 
            <span className="text-yellow-300 font-semibold">{errorMessage ? 'Error' : 'Stopped'}</span>}
        </p>
        <p className="truncate" title={data.cronString}><strong>Cron:</strong> <span className="font-mono bg-black bg-opacity-20 px-1 rounded">{data.cronString || 'Not set'}</span></p>
        {errorMessage && <p className="text-red-300 bg-black bg-opacity-30 p-1 rounded text-xs max-h-16 overflow-y-auto"><strong>Error:</strong> {errorMessage}</p>}
        {nextRunTime && !errorMessage && data.cronString && <p><strong>Next:</strong> {new Date(nextRunTime).toLocaleString()}</p>}
        {data.lastRun && <p><strong>Last:</strong> {new Date(data.lastRun).toLocaleString()}</p>}
        {!data.cronString && <p className="text-gray-300 italic">Set cron string in config.</p>}
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
          className="!bg-green-400 w-3 h-3 border-2 !border-white shadow-md transform translate-y-[-50%]"
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

export default memo(CronTriggerNode); 