import { NodePlugin } from './sdk';

class PluginRegistry {
  private plugins: Map<string, NodePlugin<any, any>> = new Map();

  register<InputData, OutputData>(plugin: NodePlugin<InputData, OutputData>): void {
    if (this.plugins.has(plugin.id)) {
      console.warn(`Plugin with id '${plugin.id}' is already registered. Overwriting.`);
    }
    this.plugins.set(plugin.id, plugin as NodePlugin<any, any>);
    console.log(`Plugin '${plugin.name}' (id: ${plugin.id}) registered.`);
  }

  getPlugin(id: string): NodePlugin<any, any> | undefined {
    return this.plugins.get(id);
  }

  getAllPlugins(): NodePlugin<any, any>[] {
    return Array.from(this.plugins.values());
  }

  getPluginsByCategory(category: string): NodePlugin<any, any>[] {
    return Array.from(this.plugins.values()).filter(p => p.category === category);
  }
}

// Singleton instance of the registry
const pluginRegistry = new PluginRegistry();

export default pluginRegistry; 