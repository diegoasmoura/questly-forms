import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiError } from '../lib/api';

describe('ApiError', () => {
  it('should create error with correct properties', () => {
    const error = new ApiError('Test error', 400, { details: 'test' });
    expect(error.message).toBe('Test error');
    expect(error.status).toBe(400);
    expect(error.details).toEqual({ details: 'test' });
    expect(error.name).toBe('ApiError');
  });

  it('should be instanceof Error', () => {
    const error = new ApiError('Test', 500);
    expect(error instanceof Error).toBe(true);
  });
});
