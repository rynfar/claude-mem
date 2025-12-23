import { getAdapter } from '../adapters/index.js';

export const HOOK_TIMEOUTS = {
  DEFAULT: 5000,
  HEALTH_CHECK: 1000,
  WORKER_STARTUP_WAIT: 1000,
  WORKER_STARTUP_RETRIES: 15,
  PRE_RESTART_SETTLE_DELAY: 2000,
  WINDOWS_MULTIPLIER: 1.5
} as const;

export const HOOK_EXIT_CODES = {
  SUCCESS: 0,
  FAILURE: 1,
  USER_MESSAGE_ONLY: 3,
} as const;

export function getTimeout(baseTimeout: number): number {
  return process.platform === 'win32'
    ? Math.round(baseTimeout * HOOK_TIMEOUTS.WINDOWS_MULTIPLIER)
    : baseTimeout;
}

export function getExitCode(status: 'success' | 'failure' | 'info'): number {
  return getAdapter().getExitCode(status);
}
