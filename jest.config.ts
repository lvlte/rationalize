import { createDefaultEsmPreset, type JestConfigWithTsJest } from 'ts-jest';

export default {
  ...createDefaultEsmPreset({
    tsconfig: 'tsconfig-jest.json',
  }),
  moduleNameMapper: {
    '(.+)\\.js': '$1'
  }
} satisfies JestConfigWithTsJest;
