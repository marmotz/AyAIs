import { AI_SERVICES } from '@app/ai-services/constants';
import { describe, expect, it } from 'vitest';
import { orderServices } from './order-services';

describe('orderServices', () => {
  it('should return default order when serviceOrder is empty', () => {
    const result = orderServices([]);
    expect(result).toEqual([...AI_SERVICES]);
  });

  it('should return default order when serviceOrder is undefined', () => {
    const result = orderServices(undefined as any);
    expect(result).toEqual([...AI_SERVICES]);
  });

  it('should order services according to serviceOrder', () => {
    const result = orderServices(['Gemini', 'ChatGPT', 'Claude']);
    expect(result[0].name).toBe('Gemini');
    expect(result[1].name).toBe('ChatGPT');
    expect(result[2].name).toBe('Claude');
  });

  it('should append unknown services at the end', () => {
    const result = orderServices(['Claude']);
    expect(result[0].name).toBe('Claude');
    expect(result.length).toBe(AI_SERVICES.length);
  });

  it('should ignore unknown service names in order', () => {
    const result = orderServices(['Unknown', 'ChatGPT']);
    expect(result[0].name).toBe('ChatGPT');
    expect(result.length).toBe(AI_SERVICES.length);
  });

  it('should return a new array, not mutate the original', () => {
    const result = orderServices(['Gemini', 'Claude', 'ChatGPT']);
    expect(result).not.toBe(AI_SERVICES);
  });
});
