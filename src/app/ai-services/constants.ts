import { AIService } from '@app/ai-services/interfaces';

export const AI_SERVICES: AIService[] = [
  {
    name: 'ChatGPT',
    url: 'https://chat.openai.com',
    icon: 'assets/ai-services/chatgpt.svg',
    internalDomains: ['chat.openai.com'],
  },
  { name: 'Claude', url: 'https://claude.ai', icon: 'assets/ai-services/claude.svg', internalDomains: ['claude.ai'] },
  {
    name: 'Gemini',
    url: 'https://gemini.google.com',
    icon: 'assets/ai-services/gemini.svg',
    internalDomains: ['gemini.google.com', 'consent.google.com', 'accounts.google.com'],
  },
];
