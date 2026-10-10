module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: ['neverthrow'],
  rules: {
    'neverthrow/must-use-result': 'error',
  },
  overrides: [
    {
      files: ['test/**/*.{ts,tsx}'],
      rules: {
        'neverthrow/must-use-result': 'off',
      },
    },
  ],
}
