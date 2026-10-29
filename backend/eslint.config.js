const js = require('@eslint/js');
const globals = require('globals');
const security = require('eslint-plugin-security');

module.exports = [
  { ignores: ['node_modules/**', 'coverage/**'] },
  // Standard JavaScript rules
  js.configs.recommended,
  // Security rules, such as unsafe regular expressions, eval and object injection
  security.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      'no-unused-vars': ['error', {
        // Catch blocks deliberately return a generic message instead of the error,
        // so the caught error is often not used
        caughtErrors: 'none',
        // Allows { field, ...rest } in tests to remove a field from an object
        ignoreRestSiblings: true,
        // Express error handlers need four parameters even if the last is unused
        argsIgnorePattern: '^_',
      }],
    },
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: { ...globals.jest },
    },
  },
];