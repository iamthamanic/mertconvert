#!/usr/bin/env node

import path from 'path';
import { readFileSync } from 'fs';
import os from 'os';
import chalk from 'chalk';
import cliProgress from 'cli-progress';
import fs from 'fs-extra';
import prompts from 'prompts';
import { convertImageToWebP, convertVideoToWebM } from './converters';
import {
  validateMultiplePaths,
  checkFFmpeg,
  getMediaFiles,
  getFilesFromMultiplePaths,
  IMAGE_EXTENSIONS,
  VIDEO_EXTENSIONS,
} from './utils';

interface ConversionOptions {
  mediaType: 'images' | 'videos' | 'both';
  inputPath: string;
  inputPaths?: string[]; // For multiple files
  isMultipleFiles?: boolean;
  maxSizeKB: number;
  quality: number;
  outputDir: string;
}

interface ConversionResult {
  converted: number;
  failed: number;
  skipped: number;
  startTime: number;
}

// Main conversion function
export async function convertMedia(options: ConversionOptions): Promise<ConversionResult> {
  const result: ConversionResult = {
    converted: 0,
    failed: 0,
    skipped: 0,
    startTime: Date.now(),
  };

  // Get all files to convert
  let imageFiles: string[] = [];
  let videoFiles: string[] = [];

  if (options.isMultipleFiles === true && options.inputPaths) {
    // Handle multiple individual files
    if (options.mediaType !== 'videos') {
      imageFiles = await getFilesFromMultiplePaths(options.inputPaths, IMAGE_EXTENSIONS);
    }
    if (options.mediaType !== 'images') {
      videoFiles = await getFilesFromMultiplePaths(options.inputPaths, VIDEO_EXTENSIONS);
    }
  } else {
    // Handle single file or directory
    if (options.mediaType !== 'videos') {
      imageFiles = await getMediaFiles(options.inputPath, IMAGE_EXTENSIONS);
    }
    if (options.mediaType !== 'images') {
      videoFiles = await getMediaFiles(options.inputPath, VIDEO_EXTENSIONS);
    }
  }

  const totalFiles = imageFiles.length + videoFiles.length;

  if (totalFiles === 0) {
    console.log(chalk.yellow('\nNo media files found to convert.'));
    return result;
  }

  // Create progress bar
  const progressBar = new cliProgress.SingleBar({
    format: 'Converting |' + chalk.cyan('{bar}') + '| {percentage}% | {value}/{total} Files',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
  });

  console.log(chalk.blue(`\nConverting ${totalFiles} files...\n`));
  progressBar.start(totalFiles, 0);

  // Collect warnings to show after progress bar
  const warnings: string[] = [];

  // Convert images with parallel processing
  if (imageFiles.length > 0) {
    await processFilesInParallel(
      imageFiles,
      options,
      'image',
      progressBar,
      warnings,
      result
    );
  }

  // Convert videos with parallel processing
  if (videoFiles.length > 0) {
    await processFilesInParallel(
      videoFiles,
      options,
      'video',
      progressBar,
      warnings,
      result
    );
  }

  progressBar.stop();

  // Show any warnings after progress bar is complete
  if (warnings.length > 0) {
    console.log(chalk.yellow('\n⚠ Warnings:'));
    warnings.forEach(warning => console.log(chalk.yellow(`  ${warning}`)));
  }

  return result;
}

// Process files in parallel with controlled concurrency
async function processFilesInParallel(
  files: string[],
  options: ConversionOptions,
  type: 'image' | 'video',
  progressBar: cliProgress.SingleBar,
  warnings: string[],
  result: ConversionResult
): Promise<void> {
  // Use 75% of available CPU cores for optimal performance
  const maxConcurrency = Math.max(1, Math.floor(os.cpus().length * 0.75));
  
  // Create conversion tasks
  const tasks = files.map((filePath) => async (): Promise<void> => {
    let outputPath: string;
    
    if (options.isMultipleFiles === true) {
      // For multiple files, put them directly in output directory
      const extension = type === 'image' ? '.webp' : '.webm';
      outputPath = path.join(
        options.outputDir,
        path.basename(filePath, path.extname(filePath)) + extension
      );
    } else {
      // For single path (file or directory), preserve structure
      const relativePath = path.relative(options.inputPath, filePath);
      const extension = type === 'image' ? '.webp' : '.webm';
      outputPath = path.join(
        options.outputDir,
        path.dirname(relativePath),
        path.basename(relativePath, path.extname(relativePath)) + extension
      );
    }

    let success: boolean;
    if (type === 'image') {
      success = await convertImageToWebP(
        filePath,
        outputPath,
        options.maxSizeKB,
        options.quality,
        (warning: string) => warnings.push(warning)
      );
    } else {
      success = await convertVideoToWebM(
        filePath,
        outputPath,
        options.maxSizeKB,
        options.quality
      );
    }

    if (success) {
      result.converted++;
    } else {
      result.failed++;
    }

    progressBar.increment();
  });

  // Process tasks with controlled concurrency
  const runningTasks = new Set<Promise<void>>();
  
  for (const task of tasks) {
    // Wait for a free slot if all are occupied
    if (runningTasks.size >= maxConcurrency) {
      await Promise.race(runningTasks);
    }
    
    // Start the task
    const runningTask = task().then(() => {
      runningTasks.delete(runningTask);
    }).catch((error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(chalk.red(`Error in parallel processing: ${errorMessage}`));
      runningTasks.delete(runningTask);
    });
    
    runningTasks.add(runningTask);
  }
  
  // Wait for all remaining tasks to complete
  await Promise.all(runningTasks);
}

// Get version from package.json
function getVersion(): string {
  try {
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8')) as { version: string };
    return packageJson.version;
  } catch {
    return 'unknown';
  }
}

// Main CLI function
export async function main(): Promise<void> {
  console.clear();
  const version = getVersion();
  const cpuCores = os.cpus().length;
  const usedCores = Math.max(1, Math.floor(cpuCores * 0.75));
  
  console.log(chalk.bold.blue(`👋 Welcome to MERT-Convert v${version}!\n`));
  console.log(chalk.gray(`🚀 Performance Mode: Using ${usedCores}/${cpuCores} CPU cores for parallel processing\n`));

  // Check for video conversion capability
  const videoSupport = await checkFFmpeg();
  if (!videoSupport) {
    console.log(chalk.yellow('⚠ FFmpeg not found. Video conversion will not be available.'));
    console.log(
      chalk.gray('Install FFmpeg to enable video conversion: https://ffmpeg.org/download.html\n')
    );
  }

  try {
    // Media type selection
    const mediaTypeResponse = await prompts({
      type: 'select',
      name: 'mediaType',
      message: 'What would you like to convert?',
      choices: videoSupport
        ? [
            { title: 'Images', value: 'images' },
            { title: 'Videos', value: 'videos' },
            { title: 'Both', value: 'both' },
          ]
        : [{ title: 'Images', value: 'images' }],
    });

    if (mediaTypeResponse.mediaType === undefined || mediaTypeResponse.mediaType === null) {
      console.log(chalk.red('\nOperation cancelled.'));
      process.exit(0);
    }

    // Input path
    const inputPathResponse = await prompts({
      type: 'text',
      name: 'inputPath',
      message:
        'Please enter the path to your folder or file (Tip: You can also drag and drop files/folders into the terminal and press Enter):',
      validate: async (value: string) => {
        if (!value) return 'Please enter a path';
        try {
          const pathInfo = await validateMultiplePaths(value);
          
          if (!pathInfo.allExist) {
            if (pathInfo.isMultipleFiles) {
              return `Some files not found: ${pathInfo.invalidPaths.join(', ')}`;
            } else {
              return 'Path does not exist';
            }
          }
          return true;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Invalid path';
          return errorMessage;
        }
      },
    });

    if (
      inputPathResponse.inputPath === undefined ||
      inputPathResponse.inputPath === null ||
      inputPathResponse.inputPath === ''
    ) {
      console.log(chalk.red('\nOperation cancelled.'));
      process.exit(0);
    }

    // Parse the input to determine if it's multiple files or single path
    const pathInfo = await validateMultiplePaths(inputPathResponse.inputPath as string);
    const cleanInputPath = pathInfo.isMultipleFiles ? '' : pathInfo.validPaths[0];

    // Determine input type for display
    let inputDisplayType = '';
    if (pathInfo.isMultipleFiles) {
      inputDisplayType = `${pathInfo.validPaths.length} files`;
    } else {
      const stats = await fs.stat(cleanInputPath);
      inputDisplayType = stats.isFile() ? '(file)' : '(folder)';
    }

    // Max file size
    const maxSizeResponse = await prompts({
      type: 'number',
      name: 'maxSizeKB',
      message: 'What is the maximum file size for the output? (in KB, default: 100)',
      initial: 100,
      min: 1,
      validate: (value: number) => (value > 0 ? true : 'Size must be greater than 0'),
    });

    if (maxSizeResponse.maxSizeKB === undefined) {
      console.log(chalk.red('\nOperation cancelled.'));
      process.exit(0);
    }

    // Quality
    const qualityResponse = await prompts({
      type: 'number',
      name: 'quality',
      message: 'Which quality do you want to use? (0-100, default: 100)',
      initial: 100,
      min: 0,
      max: 100,
      validate: (value: number) =>
        value >= 0 && value <= 100 ? true : 'Quality must be between 0 and 100',
    });

    if (qualityResponse.quality === undefined) {
      console.log(chalk.red('\nOperation cancelled.'));
      process.exit(0);
    }

    // Output directory
    const outputDirResponse = await prompts({
      type: 'text',
      name: 'outputDir',
      message: 'Where should the converted files be saved? (default: ./converted-media)',
      initial: './converted-media',
    });

    if (
      outputDirResponse.outputDir === undefined ||
      outputDirResponse.outputDir === null ||
      outputDirResponse.outputDir === ''
    ) {
      console.log(chalk.red('\nOperation cancelled.'));
      process.exit(0);
    }

    // Summary and confirmation
    console.log(chalk.cyan('\n--- Conversion Summary ---'));
    console.log(`Media Type: ${chalk.bold(mediaTypeResponse.mediaType as string)}`);
    
    if (pathInfo.isMultipleFiles) {
      console.log(`Input: ${chalk.bold(inputDisplayType)}`);
      console.log(chalk.gray(`  Files: ${pathInfo.validPaths.map(p => path.basename(p)).join(', ')}`));
    } else {
      console.log(`Input: ${chalk.bold(cleanInputPath)} ${inputDisplayType}`);
    }
    
    console.log(`Max Size: ${chalk.bold(maxSizeResponse.maxSizeKB + ' KB')}`);
    console.log(`Quality: ${chalk.bold(String(qualityResponse.quality))}`);
    console.log(`Output: ${chalk.bold(outputDirResponse.outputDir as string)}`);
    console.log(chalk.cyan('-------------------------\n'));

    const confirmResponse = await prompts({
      type: 'confirm',
      name: 'confirm',
      message: 'Start conversion?',
    });

    if (confirmResponse.confirm !== true) {
      console.log(chalk.red('\nOperation cancelled.'));
      process.exit(0);
    }

    // Perform conversion
    const options: ConversionOptions = {
      mediaType: mediaTypeResponse.mediaType as 'images' | 'videos' | 'both',
      inputPath: cleanInputPath,
      inputPaths: pathInfo.isMultipleFiles ? pathInfo.validPaths : undefined,
      isMultipleFiles: pathInfo.isMultipleFiles,
      maxSizeKB: maxSizeResponse.maxSizeKB as number,
      quality: qualityResponse.quality as number,
      outputDir: outputDirResponse.outputDir as string,
    };

    const result = await convertMedia(options);

    // Show results
    const elapsedTime = ((Date.now() - result.startTime) / 1000).toFixed(2);
    console.log(chalk.green('\n✓ Done!'));
    console.log(`Successfully converted: ${chalk.bold.green(result.converted)} files`);
    if (result.failed > 0) {
      console.log(`Failed: ${chalk.bold.red(result.failed)}`);
    }
    console.log(`Time elapsed: ${chalk.bold(elapsedTime + 's')}`);
    console.log(
      `\nYour files are ready in: ${chalk.bold.blue(outputDirResponse.outputDir as string)}`
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(chalk.red('\nAn error occurred:'), errorMessage);
    process.exit(1);
  }
}

// Run the CLI
if (require.main === module) {
  main().catch((error) => {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(chalk.red('Fatal error:'), errorMessage);
    process.exit(1);
  });
}
