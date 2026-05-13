import { describe, it, expect } from 'vitest';
import { normalizeRole } from './authService';

describe('authService.normalizeRole', () => {
  it('normalizes known typo alias', () => {
    expect(normalizeRole('accounttant')).toBe('accountant');
  });

  it('trims and lowercases role', () => {
    expect(normalizeRole('  Manager  ')).toBe('manager');
  });

  it('handles empty role', () => {
    expect(normalizeRole('')).toBe('');
  });
});
