module.exports = {
    env: {
        browser: true,
        es2021: true,
        webextensions: true,
        jest: true,
    },
    extends: ['eslint:recommended', 'prettier'],
    parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
    },
    rules: {
        'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        'prefer-const': 'warn',
        'no-var': 'warn',
        'eqeqeq': ['error', 'always', { null: 'ignore' }],
        'semi': ['error', 'always'],
        'quotes': ['error', 'single', { allowTemplateLiterals: true }],
    },
    globals: {
        chrome: 'readonly',
    },
};