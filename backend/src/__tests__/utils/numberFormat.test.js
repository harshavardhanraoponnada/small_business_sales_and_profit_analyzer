/**
 * Number Format Utility Tests
 * Tests Indian number formatting 
 */

const { formatNumber } = require('../../utils/numberFormat');

describe('formatNumber', () => {
  it('should format regular numbers in Indian format', () => {
    expect(formatNumber(1000)).toBe('1,000');
    expect(formatNumber(100000)).toBe('1,00,000');
    expect(formatNumber(1000000)).toBe('10,00,000');
  });

  it('should handle decimal numbers', () => {
    const result = formatNumber(1234.56);
    expect(result).toContain('1,234');
  });

  it('should handle zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('should handle negative numbers', () => {
    const result = formatNumber(-1000);
    expect(result).toContain('1,000');
  });

  it('should handle string numbers', () => {
    expect(formatNumber('1000')).toBe('1,000');
    expect(formatNumber('100000')).toBe('1,00,000');
  });

  it('should return "0" for invalid input', () => {
    expect(formatNumber('invalid')).toBe('0');
    expect(formatNumber(null)).toBe('0');
    expect(formatNumber(undefined)).toBe('0');
    expect(formatNumber(NaN)).toBe('0');
  });

  it('should accept formatting options', () => {
    // Test with minimum fraction digits
    const result = formatNumber(1000, { minimumFractionDigits: 2 });
    expect(result).toBe('1,000.00');
  });

  it('should handle very large numbers', () => {
    const result = formatNumber(123456789);
    expect(result).toContain(',');
  });

  it('should handle floating point precision', () => {
    const result = formatNumber(99.99);
    expect(result).toContain('99');
  });
});
