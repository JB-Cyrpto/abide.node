import { OpenAI } from 'openai';

// Placeholder for actual LLM execution logic
export interface LLMTestResult {
  success: boolean;
  output?: string;
  error?: string;
  filledPrompt?: string; // For debugging or display
}

// Fills a prompt template with given values
export const fillPromptTemplate = (template: string, values: Record<string, string>): string => {
  let filled = template;
  for (const key in values) {
    const regex = new RegExp(`{{\s*${key}\s*}}`, 'g');
    filled = filled.replace(regex, values[key] || ''); // Replace with value or empty string if not found
  }
  return filled;
};

// Initialize OpenAI client
// IMPORTANT: In a real application, manage your API key securely. 
// Do not hardcode it directly in the source code.
// Consider using environment variables or a secure secrets management solution.
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY || "YOUR_OPENAI_API_KEY_PLACEHOLDER", // Replace with your actual key or env var
  dangerouslyAllowBrowser: true, // Required for client-side usage, ensure you understand the security implications
});

export const executeLLMTest = async (
  promptTemplate: string,
  testInputValues: Record<string, string>,
  model: string = 'gpt-3.5-turbo',
  temperature?: number,
  chatHistory?: Array<{role: 'user' | 'assistant', content: string}>,
  memoryEnabled?: boolean,
  top_p?: number,
  presence_penalty?: number,
  frequency_penalty?: number
): Promise<LLMTestResult> => {
  console.log(`Executing LLM Test with:`, { promptTemplate, testInputValues, model, temperature, memoryEnabled, chatHistory, top_p, presence_penalty, frequency_penalty });

  const filledPrompt = fillPromptTemplate(promptTemplate, testInputValues);

  if (!promptTemplate || Object.keys(testInputValues).length === 0) {
    if (!memoryEnabled || !chatHistory || chatHistory.length === 0) {
        return { success: false, error: "Prompt template or test inputs are empty (and no memory context).", filledPrompt };
    }
  }

  if (!openai.apiKey || openai.apiKey === "YOUR_OPENAI_API_KEY_PLACEHOLDER") {
    console.warn("OpenAI API key is not configured. Returning a simulated response.");
    await new Promise(resolve => setTimeout(resolve, 500)); 
    let simulatedOutput = `(SIMULATED) LLM (${model}, temp: ${temperature === undefined ? 'default' : temperature}, top_p: ${top_p === undefined ? 'default' : top_p}): `;
    if (memoryEnabled && chatHistory && chatHistory.length > 0) {
        simulatedOutput += `With memory context (${chatHistory.length} messages). `;
    }
    simulatedOutput += `Filled prompt: "${filledPrompt.substring(0, 100)}${filledPrompt.length > 100 ? '...' : ''}"`;
    return {
      success: true,
      output: simulatedOutput,
      filledPrompt,
    };
  }

  try {
    const messages: Array<{role: 'user' | 'assistant' | 'system', content: string}> = [];

    if (memoryEnabled && chatHistory) {
      messages.push(...chatHistory.map(turn => ({ role: turn.role, content: turn.content })));
    }
    messages.push({ role: 'user', content: filledPrompt });

    const completion = await openai.chat.completions.create({
      messages: messages,
      model: model,
      temperature: temperature,
      top_p: top_p,
      presence_penalty: presence_penalty,
      frequency_penalty: frequency_penalty,
    });

    const output = completion.choices[0]?.message?.content;

    if (output) {
      return {
        success: true,
        output: output,
        filledPrompt,
      };
    } else {
      return {
        success: false,
        error: "LLM API returned an empty response.",
        filledPrompt,
      };
    }

  } catch (error: any) {
    console.error("Error calling OpenAI API:", error);
    return {
      success: false,
      error: error.message || "An unknown error occurred while contacting the LLM API.",
      filledPrompt,
    };
  }
}; 