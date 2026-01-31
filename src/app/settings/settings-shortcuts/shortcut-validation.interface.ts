export interface ShortcutValidationResult {
  isValid: boolean;
  error?: 'INVALID_FORMAT' | 'INTERNAL_CONFLICT' | 'EXTERNAL_CONFLICT';
  conflictedShortcut?: string;
}

export interface ShortcutWithValidation {
  id: string;
  label: string;
  value: string;
  validation?: ShortcutValidationResult;
}
