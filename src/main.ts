#!/usr/bin/env node

import path from 'path';
import chalk from 'chalk';
import cliProgress from 'cli-progress';
import fs from 'fs-extra';
import prompts from 'prompts';
import { convertImageToWebP, convertVideoToWebM } from './converters';
import {
  validatePath,
  checkFFmpeg,
  getMediaFiles,
  IMAGE_EXTENSIONS,
  VIDEO_EXTENSIONS,
} from './utils';

interface ConversionOptions {
  mediaType: 'images' | 'videos' | 'both';
  inputPath: string;
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
  const imageFiles =
    options.mediaType !== 'videos' ? await getMediaFiles(options.inputPath, IMAGE_EXTENSIONS) : [];
  const videoFiles =
    options.mediaType !== 'images' ? await getMediaFiles(options.inputPath, VIDEO_EXTENSIONS) : [];

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

  // Convert images
  for (const imagePath of imageFiles) {
    const relativePath = path.relative(options.inputPath, imagePath);
    const outputPath = path.join(
      options.outputDir,
      path.dirname(relativePath),
      path.basename(relativePath, path.extname(relativePath)) + '.webp'
    );

    const success = await convertImageToWebP(
      imagePath,
      outputPath,
      options.maxSizeKB,
      options.quality
    );

    if (success) {
      result.converted++;
    } else {
      result.failed++;
    }

    progressBar.increment();
  }

  // Convert videos
  for (const videoPath of videoFiles) {
    const relativePath = path.relative(options.inputPath, videoPath);
    const outputPath = path.join(
      options.outputDir,
      path.dirname(relativePath),
      path.basename(relativePath, path.extname(relativePath)) + '.webm'
    );

    const success = await convertVideoToWebM(
      videoPath,
      outputPath,
      options.maxSizeKB,
      options.quality
    );

    if (success) {
      result.converted++;
    } else {
      result.failed++;
    }

    progressBar.increment();
  }

  progressBar.stop();

  return result;
}

// Main CLI function
export async function main(): Promise<void> {
  console.clear();
  console.log(chalk.bold.blue('👋 Welcome to MERT-Convert!\n'));

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
        'Please enter the path to your folder or file (Tip: You can also drag and drop a folder or file into the terminal and press Enter):',
      validate: async (value: string) => {
        if (!value) return 'Please enter a path';
        try {
          const cleanPath = validatePath(value);
          const exists = await fs.pathExists(cleanPath);
          if (!exists) return 'Path does not exist';
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

    const cleanInputPath = validatePath(inputPathResponse.inputPath as string);

    // Check if it's a file or directory
    const stats = await fs.stat(cleanInputPath);
    const isFile = stats.isFile();

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
    console.log(`Input: ${chalk.bold(cleanInputPath)} ${isFile ? '(file)' : '(folder)'}`);
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
