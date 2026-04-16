import { describe, it, expect } from 'vitest';
import { formatCPF, formatPhone, formatCEP, formatDate, formatDateTime, debounce } from '../lib/utils';

describe('formatCPF', () => {
  it('should format CPF correctly', () => {
    expect(formatCPF('12345678900')).toBe('123.456.789-00');
    expect(formatCPF('00000000000')).toBe('000.000.000-00');
  });

  it('should handle empty input', () => {
    expect(formatCPF('')).toBe('');
    expect(formatCPF(null)).toBe('');
    expect(formatCPF(undefined)).toBe('');
  });

  it('should handle partial input', () => {
    expect(formatCPF('123')).toBe('123');
    expect(formatCPF('123456')).toBe('123.456');
  });
});

describe('formatPhone', () => {
  it('should format phone correctly', () => {
    expect(formatPhone('11999999999')).toBe('(11) 99999-9999');
    expect(formatPhone('21999999999')).toBe('(21) 99999-9999');
  });

  it('should handle empty input', () => {
    expect(formatPhone('')).toBe('');
    expect(formatPhone(null)).toBe('');
  });

  it('should handle partial input', () => {
    expect(formatPhone('11')).toBe('11');
    expect(formatPhone('11999')).toBe('(11) 999');
  });
});

describe('formatCEP', () => {
  it('should format CEP correctly', () => {
    expect(formatCEP('12345678')).toBe('12345-678');
    expect(formatCEP('00000000')).toBe('00000-000');
  });

  it('should handle empty input', () => {
    expect(formatCEP('')).toBe('');
    expect(formatCEP(null)).toBe('');
  });
});

describe('formatDate', () => {
  it('should format date correctly', () => {
    expect(formatDate('2024-01-15')).toBe('15/01/2024');
    expect(formatDate('2024-12-31')).toBe('31/12/2024');
  });

  it('should handle empty input', () => {
    expect(formatDate('')).toBe('');
    expect(formatDate(null)).toBe('');
  });
});

describe('formatDateTime', () => {
  it('should format datetime correctly', () => {
    const result = formatDateTime('2024-01-15T14:30:00');
    expect(result).toContain('15/01/2024');
    expect(result).toContain('14:30');
  });

  it('should handle empty input', () => {
    expect(formatDateTime('')).toBe('');
    expect(formatDateTime(null)).toBe('');
  });
});

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should debounce function calls', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
  });
});
