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

  // Source files use Node-ESM-style relative imports with an explicit
  // `.js` extension (e.g. `./Thing.js`) even though the file on disk is
  // `.ts` — correct for how `tsc`/Node resolve it at runtime, but ts-jest
  // resolves modules as CommonJS and can't find a same-named `.js` file.
  // Strip the extension so Jest resolves back to the `.ts` source.
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  clearMocks: true,
};

export default config;
