import { AI_SERVICES } from '@app/ai-services/constants';
import { AIService } from '@app/ai-services/interfaces';

export function orderServices(serviceOrder: string[]): AIService[] {
  if (!serviceOrder?.length) {
    return [...AI_SERVICES];
  }

  const orderedServices: AIService[] = [];
  const serviceMap = new Map(AI_SERVICES.map((s) => [s.name, s]));

  for (const name of serviceOrder) {
    const service = serviceMap.get(name);
    if (service) {
      orderedServices.push(service);
      serviceMap.delete(name);
    }
  }

  for (const service of serviceMap.values()) {
    orderedServices.push(service);
  }

  return orderedServices;
}
