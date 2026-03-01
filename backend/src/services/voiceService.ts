import { Llm, LlmProvider } from '@uptiqai/integrations-sdk';

export const processVoiceCommand = async (userId: string, voiceText: string) => {
  const llm = new Llm({ provider: process.env.LLM_PROVIDER as LlmProvider });
  
  const prompt = `User said: "${voiceText}"
  Convert this into a structured project management action.
  Possible actions: CREATE_TASK, SHOW_TASKS, ASSIGN_TASK
  
  Respond ONLY with a JSON object: { action: string, data: any, message: string }`;

  const result = await llm.generateText({
    messages: [{ role: 'user', content: prompt }],
    model: process.env.LLM_MODEL
  });

  try {
    const data = JSON.parse(result.text.replace(/```json|```/g, '').trim());
    return data;
  } catch (error) {
    return { action: 'UNKNOWN', data: {}, message: "I couldn't understand that command." };
  }
};
