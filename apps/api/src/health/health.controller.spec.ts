import { describe, expect, it } from 'vitest';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  it('returns a healthy response', () => {
    const controller = new HealthController();

    expect(controller.live()).toEqual({
      status: 'ok',
      service: 'api',
      timestamp: expect.any(String),
    });
  });
});