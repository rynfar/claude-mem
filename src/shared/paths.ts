import { join, dirname, basename, sep } from 'path';
import { homedir } from 'os';
import { existsSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { SettingsDefaultsManager } from './SettingsDefaultsManager.js';
import { getAdapter } from '../adapters/index.js';
import type { AgentPaths } from '../adapters/types.js';

// Get __dirname that works in both ESM (hooks) and CJS (worker) contexts
function getDirname(): string {
  // CJS context - __dirname exists
  if (typeof __dirname !== 'undefined') {
    return __dirname;
  }
  // ESM context - use import.meta.url
  return dirname(fileURLToPath(import.meta.url));
}

const _dirname = getDirname();

/**
 * Path configuration for claude-mem.
 *
 * Data directory resolution (in order):
 * 1. Adapter-specific env var (e.g., OPENCODE_MEM_DATA_DIR)
 * 2. Universal env var (CLAUDE_MEM_DATA_DIR - works for all agents)
 * 3. Adapter's default path
 *
 * This allows shared data across agents while supporting per-agent overrides.
 */

let _resolvedDataDir: string | null = null;

function resolveDataDir(): string {
  if (_resolvedDataDir !== null) {
    return _resolvedDataDir;
  }

  try {
    const adapter = getAdapter();
    const prefix = adapter.getSettingsPrefix();

    // 1. Adapter-specific override (e.g., OPENCODE_MEM_DATA_DIR)
    const adapterEnvVar = `${prefix}DATA_DIR`;
    if (process.env[adapterEnvVar]) {
      _resolvedDataDir = process.env[adapterEnvVar]!;
      return _resolvedDataDir;
    }

    // 2. Universal override (CLAUDE_MEM_DATA_DIR works for all agents)
    if (process.env.CLAUDE_MEM_DATA_DIR) {
      _resolvedDataDir = process.env.CLAUDE_MEM_DATA_DIR;
      return _resolvedDataDir;
    }

    // 3. Adapter's default
    _resolvedDataDir = adapter.config.paths.dataDir;
    return _resolvedDataDir;
  } catch {
    // Adapter not available yet - use Claude default
    _resolvedDataDir = SettingsDefaultsManager.get('CLAUDE_MEM_DATA_DIR');
    return _resolvedDataDir;
  }
}

// Base directories - lazy evaluation via getter
export const DATA_DIR = new Proxy({} as { toString(): string; valueOf(): string }, {
  get(_target, prop) {
    const dir = resolveDataDir();
    if (prop === 'toString' || prop === 'valueOf') return () => dir;
    if (prop === Symbol.toPrimitive) return () => dir;
    return (dir as Record<string | symbol, unknown>)[prop];
  },
}) as unknown as string;

export const CLAUDE_CONFIG_DIR = process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude');

// Data subdirectories - computed from DATA_DIR
export const getArchivesDir = () => join(resolveDataDir(), 'archives');
export const getLogsDir = () => join(resolveDataDir(), 'logs');
export const getTrashDir = () => join(resolveDataDir(), 'trash');
export const getBackupsDir = () => join(resolveDataDir(), 'backups');
export const getModesDir = () => join(resolveDataDir(), 'modes');
export const getUserSettingsPath = () => join(resolveDataDir(), 'settings.json');
export const getDbPath = () => join(resolveDataDir(), 'claude-mem.db');
export const getVectorDbDir = () => join(resolveDataDir(), 'vector-db');

// Legacy constants for backward compatibility (evaluate lazily on first use)
export const ARCHIVES_DIR = join(SettingsDefaultsManager.get('CLAUDE_MEM_DATA_DIR'), 'archives');
export const LOGS_DIR = join(SettingsDefaultsManager.get('CLAUDE_MEM_DATA_DIR'), 'logs');
export const TRASH_DIR = join(SettingsDefaultsManager.get('CLAUDE_MEM_DATA_DIR'), 'trash');
export const BACKUPS_DIR = join(SettingsDefaultsManager.get('CLAUDE_MEM_DATA_DIR'), 'backups');
export const MODES_DIR = join(SettingsDefaultsManager.get('CLAUDE_MEM_DATA_DIR'), 'modes');
export const USER_SETTINGS_PATH = join(SettingsDefaultsManager.get('CLAUDE_MEM_DATA_DIR'), 'settings.json');
export const DB_PATH = join(SettingsDefaultsManager.get('CLAUDE_MEM_DATA_DIR'), 'claude-mem.db');
export const VECTOR_DB_DIR = join(SettingsDefaultsManager.get('CLAUDE_MEM_DATA_DIR'), 'vector-db');

// Claude integration paths
export const CLAUDE_SETTINGS_PATH = join(CLAUDE_CONFIG_DIR, 'settings.json');
export const CLAUDE_COMMANDS_DIR = join(CLAUDE_CONFIG_DIR, 'commands');
export const CLAUDE_MD_PATH = join(CLAUDE_CONFIG_DIR, 'CLAUDE.md');

/**
 * Get project-specific archive directory
 */
export function getProjectArchiveDir(projectName: string): string {
  return join(ARCHIVES_DIR, projectName);
}

/**
 * Get worker socket path for a session
 */
export function getWorkerSocketPath(sessionId: number): string {
  return join(DATA_DIR, `worker-${sessionId}.sock`);
}

/**
 * Ensure a directory exists
 */
export function ensureDir(dirPath: string): void {
  mkdirSync(dirPath, { recursive: true });
}

/**
 * Ensure all data directories exist
 */
export function ensureAllDataDirs(): void {
  const dataDir = resolveDataDir();
  ensureDir(dataDir);
  ensureDir(getArchivesDir());
  ensureDir(getLogsDir());
  ensureDir(getTrashDir());
  ensureDir(getBackupsDir());
  ensureDir(getModesDir());
}

/**
 * Ensure modes directory exists
 */
export function ensureModesDir(): void {
  ensureDir(getModesDir());
}

/**
 * Ensure all Claude integration directories exist
 */
export function ensureAllClaudeDirs(): void {
  ensureDir(CLAUDE_CONFIG_DIR);
  ensureDir(CLAUDE_COMMANDS_DIR);
}

/**
 * Get current project name from git root or cwd
 */
export function getCurrentProjectName(): string {
  try {
    const gitRoot = execSync('git rev-parse --show-toplevel', {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
      windowsHide: true
    }).trim();
    return basename(gitRoot);
  } catch {
    return basename(process.cwd());
  }
}

/**
 * Find package root directory
 *
 * Works because bundled hooks are in plugin/scripts/,
 * so package root is always one level up (the plugin directory)
 */
export function getPackageRoot(): string {
  return join(_dirname, '..');
}

/**
 * Find commands directory in the installed package
 */
export function getPackageCommandsDir(): string {
  const packageRoot = getPackageRoot();
  return join(packageRoot, 'commands');
}

/**
 * Create a timestamped backup filename
 */
export function createBackupFilename(originalPath: string): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .slice(0, 19);

  return `${originalPath}.backup.${timestamp}`;
}

/**
 * Get paths from the current agent adapter.
 * This is the adapter-aware way to get paths that works with any agent.
 */
export function getAgentPaths(): AgentPaths {
  return getAdapter().getPaths();
}

/**
 * Get the data directory with adapter-aware resolution.
 * This is the preferred way to get the data directory.
 */
export function getDataDir(): string {
  return resolveDataDir();
}

/**
 * Get the config directory from the current agent adapter.
 */
export function getConfigDir(): string {
  return getAgentPaths().configDir;
}

/**
 * Get project name using the current agent adapter.
 */
export function getProjectName(workingDir?: string): string {
  return getAdapter().getProjectName(workingDir || process.cwd());
}
