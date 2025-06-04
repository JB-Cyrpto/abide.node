import { create } from 'zustand';
import { Plugin, PluginNode } from '../types';

interface PluginState {
  plugins: Plugin[];
  nodes: Map<string, PluginNode>;
  
  // Plugin Management
  registerPlugin: (plugin: Plugin) => void;
  unregisterPlugin: (pluginId: string) => void;
  
  // Node Management
  getNodeComponent: (type: string) => React.ComponentType<any> | undefined;
  getAllNodes: () => PluginNode[];
}

export const usePluginStore = create<PluginState>((set, get) => ({
  plugins: [],
  nodes: new Map(),
  
  registerPlugin: (plugin) => {
    set(state => {
      const nodes = new Map(state.nodes);
      plugin.nodes.forEach(node => {
        nodes.set(node.type, node);
      });
      
      return {
        plugins: [...state.plugins, plugin],
        nodes,
      };
    });
  },
  
  unregisterPlugin: (pluginId) => {
    set(state => {
      const plugin = state.plugins.find(p => p.id === pluginId);
      if (!plugin) return state;
      
      const nodes = new Map(state.nodes);
      plugin.nodes.forEach(node => {
        nodes.delete(node.type);
      });
      
      return {
        plugins: state.plugins.filter(p => p.id !== pluginId),
        nodes,
      };
    });
  },
  
  getNodeComponent: (type) => {
    return get().nodes.get(type)?.component;
  },
  
  getAllNodes: () => {
    return Array.from(get().nodes.values());
  },
}));