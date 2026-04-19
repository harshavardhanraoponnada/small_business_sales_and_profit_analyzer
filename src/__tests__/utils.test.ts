/**
 * Test: Utility Functions Verification
 * Checks helper functions work correctly
 */

import { cn } from '@/lib/utils';

describe('Utility Functions Verification', () => {
  test('cn() should merge class names', () => {
    const result = cn('px-4', 'py-2');
    expect(result).toContain('px-4');
    expect(result).toContain('py-2');
  });

  test('cn() should handle conditional classes', () => {
    const isActive = true;
    const result = cn(
      'px-4 py-2',
      isActive ? 'bg-blue-500' : 'bg-gray-500'
    );
    expect(result).toContain('px-4');
    expect(result).toContain('bg-blue-500');
    expect(result).not.toContain('bg-gray-500');
  });

  test('cn() should resolve Tailwind conflicts', () => {
    // When merging conflicting Tailwind classes, twMerge should resolve correctly
    const result = cn('px-4', 'px-8'); // px-8 should override px-4
    expect(result).toContain('px-8');
  });

  test('cn() should handle false and undefined values', () => {
    const result = cn(
      'px-4',
      false && 'hidden',
      undefined,
      'py-2'
    );
    expect(result).toContain('px-4');
    expect(result).toContain('py-2');
    expect(result).not.toContain('hidden');
  });

  test('cn() should return empty string for no valid classes', () => {
    const result = cn('', false, undefined);
    expect(result.trim()).toBe('');
  });

  test('cn() should work with objects', () => {
    const result = cn({
      'px-4': true,
      'py-2': true,
      'hidden': false,
    });
    expect(result).toContain('px-4');
    expect(result).toContain('py-2');
  });
});
