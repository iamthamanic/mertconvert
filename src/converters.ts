import path from 'path';
import chalk from 'chalk';
import fs from 'fs-extra';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';

// Convert image to WebP with size constraint
export async function convertImageToWebP(
  inputPath: string,
  outputPath: string,
  targetSizeKB: number,
  initialQuality: number
): Promise<boolean> {
  let quality = initialQuality;
  let attempts = 0;
  const maxAttempts = 10;

  await fs.ensureDir(path.dirname(outputPath));

  while (attempts < maxAttempts && quality > 0) {
    try {
      await sharp(inputPath).webp({ quality }).toFile(outputPath);

      const stats = await fs.stat(outputPath);
      const sizeKB = stats.size / 1024;

      if (sizeKB <= targetSizeKB) {
        return true;
      }

      // Reduce quality for next attempt
      quality = Math.max(0, quality - 10);
      attempts++;

      if (quality === 0) {
        console.log(
          chalk.yellow(
            `  ⚠ Warning: Cannot achieve target size for ${path.basename(
              inputPath
            )}, saved at minimum quality`
          )
        );
        return true;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`  ✗ Error converting ${path.basename(inputPath)}: ${errorMessage}`));
      return false;
    }
  }

  return true;
}

// Convert video to WebM with size constraint
export async function convertVideoToWebM(
  inputPath: string,
  outputPath: string,
  targetSizeKB: number,
  initialQuality: number
): Promise<boolean> {
  await fs.ensureDir(path.dirname(outputPath));

  // For videos, we'll use a bitrate calculation approach
  return new Promise((resolve) => {
    // Get video duration first
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err !== null && err !== undefined) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(
          chalk.red(`  ✗ Error analyzing ${path.basename(inputPath)}: ${errorMessage}`)
        );
        resolve(false);
        return;
      }

      const duration = metadata.format.duration ?? 60; // Default to 60 seconds if unknown
      // Calculate target bitrate to achieve desired file size
      const targetBitrate = Math.floor((targetSizeKB * 8) / duration); // Convert KB to kilobits

      ffmpeg(inputPath)
        .outputOptions([
          '-c:v libvpx-vp9',
          `-b:v ${targetBitrate}k`,
          `-crf ${Math.floor((100 - initialQuality) * 0.63)}`, // VP9 CRF scale is 0-63
          '-c:a libopus',
          '-b:a 128k',
        ])
        .output(outputPath)
        .on('end', () => {
          resolve(true);
        })
        .on('error', (error: Error) => {
          console.error(
            chalk.red(`  ✗ Error converting ${path.basename(inputPath)}: ${error.message}`)
          );
          resolve(false);
        })
        .run();
    });
  });
}
