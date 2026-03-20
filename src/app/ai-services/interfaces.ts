export interface AIService {
  name: string;
  url: string;
  icon: string;
  internalDomains: string[];
}

export interface ConfiguredService {
  id: string;
  serviceName: string;
}
