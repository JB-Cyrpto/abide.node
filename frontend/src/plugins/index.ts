// This file can be used to explicitly import and register all core plugins
// or plugins from other categories if not dynamically loaded.

import './core/TriggerNodePlugin';
import './llm/LLMAgentNodePlugin'; // Added LLM Agent Plugin
// Future core plugins can be imported here:
// import './core/ActionNodePlugin';
// import './core/LogicNodePlugin';
// import './llm/LLMAgentNodePlugin'; // Example for other categories

console.log('Plugins initialized and registered.'); 