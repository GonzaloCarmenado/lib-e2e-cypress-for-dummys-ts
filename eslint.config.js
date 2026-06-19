import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Ficheros a ignorar globalmente
  {
    ignores: ['dist/**', 'node_modules/**', 'ejemplo/**'],
  },

  // Base JS + TypeScript recomendado
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Reglas para el código fuente y los tests
  {
    files: ['src/**/*.ts', 'specs/**/*.ts'],
    rules: {
      // ── TypeScript ────────────────────────────────────────────────────────
      // 'any' permitido con warning: la File System Access API y SweetAlert2
      // no tienen tipos completos, así que algunos 'as any' son inevitables
      '@typescript-eslint/no-explicit-any': 'warn',

      // '!' non-null assertion: usamos con frecuencia en querySelector, warn
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // Fuerza import type para imports que solo se usan como tipos
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      // Variables no usadas: permite el prefijo _ para ignorar intencionalmente
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // ── General ───────────────────────────────────────────────────────────
      // Preferir const cuando la variable no se reasigna
      'prefer-const': 'error',

      // Igualdad estricta; null/undefined se excluyen (pattern habitual en TS)
      'eqeqeq': ['error', 'always', { null: 'ignore' }],

      // console.log no debería quedarse en producción
      'no-console': 'warn',

      // ── Estilo (house style: comillas simples + punto y coma) ─────────────
      // avoidEscape permite comillas dobles cuando la cadena contiene comillas
      // simples (p. ej. selectores "cy.get('[data-cy]')"), y se permiten plantillas.
      'quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
      'semi': ['error', 'always'],
    },
  },

  // Reglas más relajadas en los tests
  {
    files: ['specs/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
);
