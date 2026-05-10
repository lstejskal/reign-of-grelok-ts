import type { Config } from 'jest';
import { createDefaultPreset } from 'ts-jest';

const tsJestTransformCfg = createDefaultPreset().transform;

const config: Config = {
  testEnvironment: 'node',

  transform: {
    ...tsJestTransformCfg,
  },

  roots: ['<rootDir>/src'],

  testMatch: ['**/*.test.ts'],

  moduleFileExtensions: ['ts', 'js', 'json'],

  clearMocks: true,
};

export default config;