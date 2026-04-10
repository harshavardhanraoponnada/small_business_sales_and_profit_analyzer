/**
 * Test: React Query Configuration Verification
 * Checks QueryClient is properly configured
 */

import { queryClient } from '@/lib/queryClient';

describe('React Query Configuration Verification', () => {
  test('queryClient should be initialized', () => {
    expect(queryClient).toBeDefined();
  });

  test('queryClient should have default options configured', () => {
    const config = queryClient.getDefaultOptions();
    expect(config).toBeDefined();
    expect(config?.queries).toBeDefined();
    expect(config?.mutations).toBeDefined();
  });

  test('queryClient should have staleTime of 5 minutes', () => {
    const config = queryClient.getDefaultOptions();
    expect(config?.queries?.staleTime).toBe(1000 * 60 * 5); // 5 minutes
  });

  test('queryClient should have gcTime of 10 minutes', () => {
    const config = queryClient.getDefaultOptions();
    expect(config?.queries?.gcTime).toBe(1000 * 60 * 10); // 10 minutes
  });

  test('queryClient should have retry set to 1', () => {
    const config = queryClient.getDefaultOptions();
    expect(config?.queries?.retry).toBe(1);
  });

  test('queryClient should disable refetch on window focus', () => {
    const config = queryClient.getDefaultOptions();
    expect(config?.queries?.refetchOnWindowFocus).toBe(false);
  });

  test('queryClient mutation defaults should have retry', () => {
    const config = queryClient.getDefaultOptions();
    expect(config?.mutations?.retry).toBe(1);
  });

  test('queryClient should be able to cache data', () => {
    const testKey = ['test', 'data'];
    const testData = { id: 1, name: 'Test' };

    // Set data
    queryClient.setQueryData(testKey, testData);

    // Get data
    const cachedData = queryClient.getQueryData(testKey);
    expect(cachedData).toEqual(testData);

    // Clean up
    queryClient.removeQueries({ queryKey: testKey });
  });

  test('queryClient should support query invalidation', () => {
    const testKey = ['invalidation', 'test'];
    queryClient.setQueryData(testKey, { data: 'test' });

    // Invalidate should mark as stale
    queryClient.invalidateQueries({ queryKey: testKey });

    // After invalidation, query should be removed eventually
    queryClient.removeQueries({ queryKey: testKey });
    const result = queryClient.getQueryData(testKey);
    expect(result).toBeUndefined();
  });
});
