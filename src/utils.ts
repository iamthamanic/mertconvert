import { exec } from 'child_process';
import path from 'path';
import { promisify } from 'util';
import fs from 'fs-extra';

export const execAsync = promisify(exec);

// Supported formats
export const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.tiff', '.bmp', '.svg'];
export const VIDEO_EXTENSIONS = [
  '.mp4',
  '.mov',
  '.avi',
  '.mkv',
  '.wmv',
  '.flv',
  '.webm',
  '.m4v',
  '.mpg',
  '.mpeg',
];

// Validate and sanitize file paths
export function validatePath(inputPath: string): string {
  // Remove quotes and trim
  const cleanPath = inputPath.trim().replace(/^['"]|['"]$/g, '');

  // Check for suspicious patterns before resolution
  if (cleanPath.includes('..') || cleanPath.includes('~')) {
    throw new Error('Invalid path: Path traversal detected');
  }

  // Resolve to absolute path
  const absolutePath = path.resolve(cleanPath);

  return absolutePath;
}

// Check if ffmpeg is installed
export async function checkFFmpeg(): Promise<boolean> {
  try {
    await execAsync('ffmpeg -version');
    return true;
  } catch {
    return false;
  }
}

// Get all media files recursively
export async function getMediaFiles(dir: string, extensions: string[]): Promise<string[]> {
  const files: string[] = [];

  async function traverse(currentPath: string): Promise<void> {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        await traverse(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }

  await traverse(dir);
  return files;
}
