import { describe, expect, it } from 'vitest';

import { resolveAppRoute } from './auth-route';

describe('resolveAppRoute', () => {
  it('sends users with profile read failures to the error state', () => {
    expect(
      resolveAppRoute({
        isConfigured: true,
        hasSession: true,
        hasProfileError: true,
        bodyweightKg: null,
      }),
    ).toBe('error');
  });

  it('requires onboarding until bodyweight is present', () => {
    expect(
      resolveAppRoute({
        isConfigured: true,
        hasSession: true,
        hasProfileError: false,
        bodyweightKg: null,
      }),
    ).toBe('onboarding');
    expect(
      resolveAppRoute({
        isConfigured: true,
        hasSession: true,
        hasProfileError: false,
        bodyweightKg: 75,
      }),
    ).toBe('app');
  });
});
