import { create } from 'zustand';
import { AIAssistanceRequest, AIAssistanceResponse } from '../types';

interface AIAssistantState {
  isProcessing: boolean;
  lastResponse: AIAssistanceResponse | null;
  error: string | null;
  
  generateCompletion: (code: string, context?: string) => Promise<AIAssistanceResponse>;
  generateCode: (prompt: string, context?: string) => Promise<AIAssistanceResponse>;
  explainCode: (code: string) => Promise<AIAssistanceResponse>;
  debugCode: (code: string, error?: string) => Promise<AIAssistanceResponse>;
  resetState: () => void;
}

// This is a mock implementation since we don't have actual OpenAI integration yet
export const useAIAssistantStore = create<AIAssistantState>((set) => ({
  isProcessing: false,
  lastResponse: null,
  error: null,
  
  generateCompletion: async (code, context) => {
    set({ isProcessing: true, error: null });
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response
      const response: AIAssistanceResponse = {
        result: code + '\n// Additional completed code would appear here\nreturn { success: true, data: result };',
        alternatives: [],
      };
      
      set({ lastResponse: response, isProcessing: false });
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isProcessing: false });
      throw error;
    }
  },
  
  generateCode: async (prompt, context) => {
    set({ isProcessing: true, error: null });
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock response
      const response: AIAssistanceResponse = {
        result: `// Generated code based on: ${prompt}\nfunction processData(input) {\n  const result = input.data.map(item => item * 2);\n  return { success: true, data: result };\n}`,
        explanation: 'This code processes the input data by multiplying each item by 2 and returns the result.',
      };
      
      set({ lastResponse: response, isProcessing: false });
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isProcessing: false });
      throw error;
    }
  },
  
  explainCode: async (code) => {
    set({ isProcessing: true, error: null });
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response
      const response: AIAssistanceResponse = {
        result: 'This code takes an input, processes it by applying a transformation to each item, and returns a success response with the processed data.',
      };
      
      set({ lastResponse: response, isProcessing: false });
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isProcessing: false });
      throw error;
    }
  },
  
  debugCode: async (code, error) => {
    set({ isProcessing: true, error: null });
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Mock response
      const response: AIAssistanceResponse = {
        result: code.replace('item * 2', 'item * 2 || 0'), // Simple fix example
        explanation: 'The error occurs because you might be trying to multiply undefined or null values. Added a fallback to 0 to prevent NaN results.',
      };
      
      set({ lastResponse: response, isProcessing: false });
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isProcessing: false });
      throw error;
    }
  },
  
  resetState: () => {
    set({ isProcessing: false, lastResponse: null, error: null });
  },
}));