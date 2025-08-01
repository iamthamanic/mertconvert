# Changelog

All notable changes to MERT-Convert will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-01

### Added
- 🎉 Initial release of MERT-Convert CLI tool
- Interactive, menu-driven terminal UI for easy media conversion
- Image conversion support: JPG, JPEG, PNG, GIF, TIFF, BMP, SVG → WebP
- Video conversion support: MP4, MOV, AVI, MKV, WMV, etc. → WebM
- Smart file size targeting with automatic quality adjustment
- Batch processing with subfolder support
- Drag & drop file/folder support in terminal
- Progress bar and real-time status updates
- Comprehensive error handling and user-friendly messages
- Path traversal protection and input validation
- FFmpeg detection and graceful fallback for image-only mode

### Features
- **Interactive Menu System**: Arrow key navigation, no CLI arguments needed
- **Flexible Input**: Single files, folders, or drag & drop support
- **Size Control**: Target file size in KB with automatic quality reduction
- **Quality Settings**: 0-100 quality scale for fine control
- **Output Management**: Customizable output directory with preserved folder structure
- **Progress Tracking**: Real-time progress bar and conversion status
- **Summary Reports**: Detailed conversion results with timing information

### Technical
- TypeScript implementation with strict type checking
- Comprehensive test suite with 80%+ coverage
- ESLint and Prettier for code quality
- Security-focused development with path validation
- Modular architecture for maintainability
- CI/CD pipeline with automated testing and releases

### Dependencies
- Node.js 14+ support
- FFmpeg optional for video conversion
- Sharp for high-performance image processing
- Fluent-FFmpeg for video conversion
- Prompts for interactive CLI experience
- Chalk for colorful terminal output

## [2.0.0] - 2025-08-01

### Added
- Enhanced TypeScript implementation with improved type safety
- Professional release workflow and CI/CD integration
- Comprehensive npm package configuration for global distribution
- Improved error handling and user experience
- Enhanced documentation and installation guides
- GitHub repository integration with proper issue tracking
- Professional package metadata and repository links

### Changed
- Upgraded to semantic versioning 2.0.0 for professional release
- Improved build process with enhanced prepublish hooks
- Updated package.json with complete npm registry metadata
- Enhanced README with comprehensive installation and usage instructions
- Streamlined development workflow with better tooling integration

### Technical Improvements
- Added proper Node.js engine requirements (>=14.0.0)
- Enhanced prepublishOnly script with full quality gate validation
- Improved package structure for npm global installation
- Added repository, bugs, and homepage metadata for npm registry
- Enhanced build and test automation for reliable releases

### Documentation
- Updated README with v2.0.0 installation instructions
- Added comprehensive GitHub repository setup guidelines
- Enhanced changelog with detailed release notes
- Improved contributing guidelines and development setup

## [Unreleased]

### Planned
- Configuration file support
- Custom conversion presets
- Parallel processing for better performance
- Additional output formats
- Docker support
- GUI wrapper option