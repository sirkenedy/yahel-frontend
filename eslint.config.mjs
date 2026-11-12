import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', '.nx/**', '**/routeTree.gen.ts', '**/schema.d.ts', 'design-system/**', 'playwright-report/**', 'test-results/**', '.agent/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,mjs}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports', disallowTypeAnnotations: true }],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-restricted-syntax': [
        'error',
        { selector: "Identifier[name=/^(localStorage|sessionStorage)$/]", message: 'Web storage is reached only through @yahel/auth. See docs/rulebook.md §4.' },
        { selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']", message: 'Rendering raw HTML needs a sanitiser and a security review. See docs/rulebook.md §4.' },
      ],
    },
  },
  // The session module owns storage; browser tests read it to prove what is and is not stored.
  { files: ['packages/auth/src/session.ts', 'e2e/**/*.ts'], rules: { 'no-restricted-syntax': 'off' } },
  {
    files: ['apps/**/src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-globals': ['error', { name: 'fetch', message: 'Call the backend through @yahel/api-client. See docs/rulebook.md §2.' }],
      'no-restricted-imports': ['error', { patterns: [{ group: ['react-aria-components'], message: 'Apps use @yahel/ui components. Add the component to the UI package.' }] }],
    },
  },
);
