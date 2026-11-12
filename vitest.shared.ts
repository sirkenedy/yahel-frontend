import { defineConfig } from 'vitest/config';

export const nodeProject = () => defineConfig({ test: { environment: 'node', include: ['src/**/*.test.ts'] } });

export const domProject = (setupFile: string) =>
  defineConfig({
    test: { environment: 'jsdom', include: ['src/**/*.test.{ts,tsx}'], setupFiles: [setupFile], css: false },
  });
