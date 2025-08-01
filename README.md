# MERT-Convert

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-green.svg)
![License](https://img.shields.io/badge/license-ISC-yellow.svg)

A super user-friendly CLI tool that converts images to WebP and videos to WebM format with an interactive, menu-driven interface. No command-line knowledge required!

**Version 2.0.0** - Now available on npm with enhanced professional features and improved reliability.

## Features

- 🖼️ **Image Conversion**: JPG, JPEG, PNG, GIF, TIFF, BMP, SVG → WebP
- 🎥 **Video Conversion**: MP4, MOV, AVI, MKV, WMV, etc. → WebM
- 🎯 **Smart Compression**: Automatically adjusts quality to meet your target file size
- 📁 **Batch Processing**: Convert entire folders including subfolders
- 🎨 **Interactive UI**: Simple menu-driven interface with arrow key navigation
- 📊 **Progress Tracking**: Real-time progress bar and status updates
- 🚀 **Drag & Drop**: Support for dragging files/folders into the terminal

## Installation

### Method 1: Using npx (Recommended - No Installation Required)

The fastest way to use MERT-Convert without installing anything:

```bash
npx mertconvert@latest
```

### Method 2: Global Installation

Install once and use anywhere:

```bash
npm install -g mertconvert
```

Then run from any directory:
```bash
mertconvert
```

### Method 3: Local Development

For contributors and developers:

```bash
# Clone the repository
git clone https://github.com/iamthamanic/mertconvert.git
cd mertconvert

# Install dependencies
npm install

# Build the project
npm run build

# Run locally
npm start

# Or run in development mode
npm run dev
```

## Quick Start

After installation, simply run:
```bash
# Using npx (no installation)
npx mertconvert

# Or if globally installed
mertconvert
```

The interactive menu will guide you through the conversion process!

## Requirements

- **Node.js**: Version 14 or higher
- **FFmpeg**: Required for video conversion (optional for image-only conversion)
  
  Install FFmpeg:
  - **macOS**: `brew install ffmpeg`
  - **Ubuntu/Debian**: `sudo apt install ffmpeg`
  - **Windows**: Download from [ffmpeg.org](https://ffmpeg.org/download.html)

## Usage

1. Run `npx mertconvert`
2. Select what you want to convert: Images, Videos, or Both
3. Enter the path to your file or folder (or drag & drop)
4. Set the maximum output file size (default: 100 KB)
5. Choose quality level (0-100, default: 100)
6. Specify output folder (default: ./converted-media)
7. Confirm and start conversion

The tool will:
- Process all media files in the selected folder and subfolders
- Automatically adjust compression to meet your size requirements
- Show progress with a real-time progress bar
- Display a summary when complete

## Example Workflow

```
👋 Welcome to MERT-Convert!

What would you like to convert?
  > [Images]   [Videos]   [Both]

Please enter the path to your folder or file (Tip: You can also drag and drop...):
  > /Users/ben/Pictures

What is the maximum file size for the output? (in KB, default: 100)
  > 100

Which quality do you want to use? (0-100, default: 100)
  > 100

Where should the converted files be saved? (default: ./converted-media)
  > ./my-converted

--- Conversion Summary ---
Media Type: images
Input: /Users/ben/Pictures (folder)
Max Size: 100 KB
Quality: 100
Output: ./my-converted
-------------------------

Start conversion? [Yes/No]
  > Yes

Converting |████████████████████| 100% | 10/10 Files

✓ Done!
Successfully converted: 10 files
Time elapsed: 3.45s

Your files are ready in: ./my-converted
```

## Tips

- **Drag & Drop**: Most modern terminals support dragging files/folders from your file manager
- **File Size**: The tool will automatically reduce quality if needed to meet your size target
- **Quality**: Higher quality (90-100) is best for images, 70-85 often works well for web use
- **Output Folder**: The tool preserves your folder structure in the output directory

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to MERT-Convert.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes and releases.

## Support

- **Issues**: [GitHub Issues](https://github.com/iamthamanic/mertconvert/issues)
- **Discussions**: [GitHub Discussions](https://github.com/iamthamanic/mertconvert/discussions)
- **npm Package**: [npmjs.com/package/mertconvert](https://www.npmjs.com/package/mertconvert)

## License

ISC License - see [LICENSE](LICENSE) file for details.

## Author

Created by [iamthamanic](https://github.com/iamthamanic)

---

**Made with ❤️ for the developer community**