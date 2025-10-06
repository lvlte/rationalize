/** @type {import('ts-jest').JestConfigWithTsJest} */

export default {
  preset: 'ts-jest/presets/default-esm',
  transform: {
    '.ts': [
      'ts-jest',
      {
        // Need to enable isolatedModules to prevent error "ESM syntax is not
        // allowed in a CommonJS module when 'verbatimModuleSyntax' is enabled"
        // @see https://github.com/kulshekhar/ts-jest/issues/4081
        isolatedModules: true
      }
    ]
  }
}
