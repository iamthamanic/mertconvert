# Contributing to MERT-Convert

Thank you for your interest in contributing to MERT-Convert! This document provides guidelines and information for contributors.

## Development Setup

### Prerequisites

- Node.js 18+ 
- npm 8+
- FFmpeg (for video conversion features)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mertconvert
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install FFmpeg** (for video conversion testing)
   - macOS: `brew install ffmpeg`
   - Ubuntu/Debian: `sudo apt install ffmpeg`
   - Windows: Download from [ffmpeg.org](https://ffmpeg.org/download.html)

4. **Run in development mode**
   ```bash
   npm run dev
   ```

### Available Scripts

- `npm run build` - Build TypeScript to JavaScript
- `npm run dev` - Run in development mode with tsx
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## Code Quality Standards

### Linting and Formatting

This project uses:
- **ESLint** with TypeScript support for code linting
- **Prettier** for code formatting
- **TypeScript** in strict mode

All code must pass linting and formatting checks before being committed.

### Testing

- Minimum 80% code coverage required
- Unit tests for all utility functions
- Integration tests for main workflows
- All tests must pass in CI

### Security

- No known security vulnerabilities allowed
- Path traversal protection implemented
- Input validation on all user inputs
- Regular dependency audits with `npm audit`

## Contribution Workflow

### 1. Fork and Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Write clean, readable code
- Follow existing code style and patterns
- Add tests for new functionality
- Update documentation if needed

### 3. Quality Checks

Before committing, ensure all checks pass:

```bash
npm run lint
npm run format:check
npm test
npm run build
```

### 4. Commit Guidelines

Use conventional commit messages:

```
feat: add video quality presets
fix: resolve path traversal vulnerability
docs: update installation instructions
test: add unit tests for converter functions
```

### 5. Pull Request

- Create a pull request to the `main` branch
- Provide a clear description of changes
- Link any related issues
- Ensure CI passes

## Project Structure

```
src/
├── main.ts           # Main CLI entry point
├── converters.ts     # Image/video conversion logic
└── utils.ts          # Utility functions

tests/
└── simple.test.ts    # Test suite

.github/workflows/
├── ci.yml           # Continuous integration
└── release.yml      # Release automation
```

## Release Process

Releases are automated via GitHub Actions:

1. **Version Bump**: Update version in `package.json`
2. **Tag Creation**: Create git tag (e.g., `v1.2.3`)
3. **Push Tag**: `git push origin v1.2.3`
4. **Automated Release**: GitHub Actions handles the rest

### Release Checklist

- [ ] All tests pass
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Version bumped
- [ ] Security audit clean

## Code Style Guidelines

### TypeScript

- Use strict TypeScript configuration
- Explicit return types for functions
- No `any` types (use proper typing)
- Prefer `const` over `let`

### Error Handling

- Always handle errors gracefully
- Provide meaningful error messages
- Log errors appropriately
- Never expose sensitive information

### Performance

- Optimize for CLI usage patterns
- Handle large file sets efficiently
- Provide progress feedback
- Minimize memory usage

## Getting Help

- Create an issue for bug reports or feature requests
- Use discussions for questions and ideas
- Check existing issues before creating new ones

## License

By contributing to MERT-Convert, you agree that your contributions will be licensed under the ISC License.