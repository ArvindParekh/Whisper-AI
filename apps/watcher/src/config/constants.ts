export const WATCHER_CONFIG = {
  BATCH_SIZE: 10,
  STABILITY_THRESHOLD: 100,
  POLL_INTERVAL: 100,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
} as const;

export const IGNORED_PATTERNS = [
  "**/node_modules/**",
  "**/dist/**",
  "**/build/**",
  "**/.next/**",
  "**/.git/**",
  "!**/.env*",
  "!**/.gitignore",
] as string[];

export const IGNORED_DIRECTORIES = [
  "node_modules",
  "dist",
  "build",
  ".next",
  ".git",
] as const;
