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

// Parse multiple file paths from drag & drop input
export function parseMultipleFiles(input: string): string[] {
  // Handle escaped characters in file paths by temporarily replacing them
  const escapedSpaceMarker = '___ESCAPED_SPACE___';
  const escapedParenMarker = '___ESCAPED_PAREN___';
  
  const preprocessed = input
    .replace(/\\ /g, escapedSpaceMarker)
    .replace(/\\([()])/g, escapedParenMarker + '$1');
  
  // Split by spaces and restore escaped characters
  const paths = preprocessed
    .split(' ')
    .map(p => p
      .replace(new RegExp(escapedSpaceMarker, 'g'), ' ')
      .replace(new RegExp(escapedParenMarker + '([()])', 'g'), '$1')
    )
    .filter(p => p.trim().length > 0);
  
  return paths;
}

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

// Validate multiple paths and return info about them
export async function validateMultiplePaths(input: string): Promise<{
  isMultipleFiles: boolean;
  paths: string[];
  allExist: boolean;
  validPaths: string[];
  invalidPaths: string[];
}> {
  const potentialPaths = parseMultipleFiles(input);
  
  // If only one path, treat as single path
  if (potentialPaths.length <= 1) {
    const singlePath = validatePath(input);
    const exists = await fs.pathExists(singlePath);
    return {
      isMultipleFiles: false,
      paths: [singlePath],
      allExist: exists,
      validPaths: exists ? [singlePath] : [],
      invalidPaths: exists ? [] : [singlePath]
    };
  }
  
  // Multiple paths detected
  const validPaths: string[] = [];
  const invalidPaths: string[] = [];
  
  for (const pathStr of potentialPaths) {
    try {
      const cleanPath = validatePath(pathStr);
      const exists = await fs.pathExists(cleanPath);
      
      if (exists) {
        validPaths.push(cleanPath);
      } else {
        invalidPaths.push(cleanPath);
      }
    } catch (error) {
      invalidPaths.push(pathStr);
    }
  }
  
  return {
    isMultipleFiles: true,
    paths: [...validPaths, ...invalidPaths],
    allExist: invalidPaths.length === 0,
    validPaths,
    invalidPaths
  };
}

// Get files from multiple individual file paths
export async function getFilesFromMultiplePaths(paths: string[], extensions: string[]): Promise<string[]> {
  const allFiles: string[] = [];
  
  for (const filePath of paths) {
    const stats = await fs.stat(filePath);
    
    if (stats.isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      if (extensions.includes(ext)) {
        allFiles.push(filePath);
      }
    } else if (stats.isDirectory()) {
      // If it's a directory, get files recursively
      const dirFiles = await getMediaFiles(filePath, extensions);
      allFiles.push(...dirFiles);
    }
  }
  
  return allFiles;
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
