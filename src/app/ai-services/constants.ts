import { AIService } from '@app/ai-services/interfaces';

export const AI_SERVICES: AIService[] = [
  {
    name: 'ChatGPT',
    url: 'https://chat.openai.com',
    icon: 'assets/ai-services/chatgpt.svg',
    internalDomains: ['chat.openai.com', 'chatgpt.com'],
  },
  {
    name: 'Claude',
    url: 'https://claude.ai',
    icon: 'assets/ai-services/claude.svg',
    internalDomains: ['claude.ai'],
  },
  {
    name: 'Copilot',
    url: 'https://copilot.microsoft.com',
    icon: 'assets/ai-services/microsoft-copilot.png',
    internalDomains: ['copilot.microsoft.com', 'www.bing.com'],
  },
  {
    name: 'DeepSeek',
    url: 'https://chat.deepseek.com',
    icon: 'assets/ai-services/deepseek.png',
    internalDomains: ['chat.deepseek.com', 'deepseek.com'],
  },
  {
    name: 'Gemini',
    url: 'https://gemini.google.com',
    icon: 'assets/ai-services/gemini.svg',
    internalDomains: ['gemini.google.com', 'consent.google.com', 'accounts.google.com'],
  },
  {
    name: 'Grok',
    url: 'https://grok.com',
    icon: 'assets/ai-services/grok.webp',
    internalDomains: ['grok.com', 'x.ai', 'accounts.x.ai', 'x.com', 'api.x.com'],
  },
  {
    name: 'HuggingChat',
    url: 'https://huggingface.co/chat',
    icon: 'assets/ai-services/huggingface.svg',
    internalDomains: ['huggingface.co'],
  },
  {
    name: 'Kimi',
    url: 'https://kimi.moonshot.cn',
    icon: 'assets/ai-services/kimi.png',
    internalDomains: ['kimi.moonshot.cn', 'moonshot.cn'],
  },
  {
    name: 'Mistral',
    url: 'https://chat.mistral.ai',
    icon: 'assets/ai-services/mistral.png',
    internalDomains: ['chat.mistral.ai', 'mistral.ai'],
  },
  {
    name: 'NotebookLM',
    url: 'https://notebooklm.google.com',
    icon: 'assets/ai-services/notebooklm.webp',
    internalDomains: ['notebooklm.google.com', 'accounts.google.com'],
  },
  {
    name: 'OpenRouter',
    url: 'https://openrouter.ai/chat',
    icon: 'assets/ai-services/openrouter.webp',
    internalDomains: ['openrouter.ai'],
  },
  {
    name: 'Perplexity',
    url: 'https://www.perplexity.ai',
    icon: 'assets/ai-services/perplexity.png',
    internalDomains: ['www.perplexity.ai', 'perplexity.ai'],
  },
  {
    name: 'Z.ai',
    url: 'https://chat.z.ai',
    icon: 'assets/ai-services/z.png',
    internalDomains: ['z.ai', 'chat.z.ai'],
  },
];
