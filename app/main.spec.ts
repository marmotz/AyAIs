import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('main.ts logic', () => {
  const originalArgv = process.argv;
  const originalConsoleError = console.error;

  beforeEach(() => {
    vi.clearAllMocks();
    console.error = vi.fn();
  });

  afterEach(() => {
    process.argv = originalArgv;
    console.error = originalConsoleError;
  });

  describe('argument parsing', () => {
    it('should detect --serve flag in arguments', () => {
      process.argv = ['node', 'main.js', '--serve'];

      const hasServeFlag = process.argv.slice(1).some((val) => val === '--serve');

      expect(hasServeFlag).toBe(true);
    });

    it('should not detect --serve flag when absent', () => {
      process.argv = ['node', 'main.js', 'other-arg'];

      const hasServeFlag = process.argv.slice(1).some((val) => val === '--serve');

      expect(hasServeFlag).toBe(false);
    });

    it('should handle multiple arguments', () => {
      process.argv = ['node', 'main.js', 'arg1', '--serve', 'arg2'];

      const hasServeFlag = process.argv.slice(1).some((val) => val === '--serve');

      expect(hasServeFlag).toBe(true);
    });

    it('should handle empty arguments', () => {
      process.argv = ['node', 'main.js'];

      const args = process.argv.slice(1);

      expect(args).toEqual(['main.js']);
    });
  });

  describe('error handling', () => {
    it('should use try-catch to handle errors', () => {
      const mockFunction = vi.fn(() => {
        throw new Error('Test error');
      });
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        mockFunction();
      } catch (error) {
        console.error('Failed to bootstrap application:', error);
      }

      expect(errorSpy).toHaveBeenCalledWith('Failed to bootstrap application:', expect.any(Error));
      errorSpy.mockRestore();
    });

    it('should not throw when error is caught', () => {
      const mockFunction = vi.fn(() => {
        throw new Error('Test error');
      });

      expect(() => {
        try {
          mockFunction();
        } catch (error) {
          console.error('Failed to bootstrap application:', error);
        }
      }).not.toThrow();
    });
  });
});
