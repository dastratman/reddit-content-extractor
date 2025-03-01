# Contributing to Reddit Content Extractor

Thank you for considering contributing to the Reddit Content Extractor! This document outlines the process for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How Can I Contribute?

### Reporting Bugs

- Check if the bug has already been reported in the Issues section
- Use the bug report template to create a detailed report
- Include steps to reproduce, expected behavior, and screenshots if applicable

### Suggesting Features

- Check if the feature has already been suggested in the Issues section
- Use the feature request template to create a detailed suggestion
- Explain why this feature would be useful to most users

### Code Contributions

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`npm test && npm run lint`)
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm start`
4. Load unpacked extension from the `dist/` directory in Chrome

## Building for Production

```
npm run build
```

This will create a production-ready build in the `dist/` directory.

## Project Structure

- `src/popup/` - Extension popup UI
- `src/content/` - Content scripts for Reddit pages
- `src/background/` - Background scripts
- `src/utils/` - Utility functions
- `tests/` - Test files

## Coding Standards

- Follow the ESLint configuration
- Format code with Prettier
- Write tests for new features
- Update documentation as needed

## Pull Request Process

1. Update the README.md with details of changes if needed
2. Update the CHANGELOG.md with details of changes
3. The PR should work in Chrome (primary target)
4. PRs require review by at least one maintainer

Thank you for your contributions!