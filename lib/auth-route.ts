export type AppRouteState = 'loading' | 'auth' | 'onboarding' | 'app' | 'error';

export function resolveAppRoute(options: {
  isConfigured: boolean;
  hasSession: boolean;
  hasProfileError: boolean;
  bodyweightKg: number | null | undefined;
}): AppRouteState {
  if (!options.isConfigured) return 'auth';
  if (!options.hasSession) return 'auth';
  if (options.hasProfileError) return 'error';
  return options.bodyweightKg != null ? 'app' : 'onboarding';
}
