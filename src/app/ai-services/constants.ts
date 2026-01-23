import { AIService } from '@app/ai-services/interfaces';

export const AI_SERVICES: AIService[] = [
  { name: 'ChatGPT', url: 'https://chat.openai.com', icon: 'assets/ai-services/chatgpt.svg' },
  { name: 'Claude', url: 'https://claude.ai', icon: 'assets/ai-services/claude.svg' },
  { name: 'Gemini', url: 'https://gemini.google.com', icon: 'assets/ai-services/gemini.svg' },
];
