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
  initialQuality: number,
  onWarning?: (message: string) => void
): Promise<boolean> {
  await fs.ensureDir(path.dirname(outputPath));

  // Optimized approach: fewer attempts, better quality preservation
  const targetSizeTolerance = targetSizeKB * 1.05; // Allow 5% tolerance to preserve quality
  let quality = initialQuality;

  try {
    // Attempt 1: Try with original quality
    await sharp(inputPath, {
      limitInputPixels: false,
      sequentialRead: true
    })
    .webp({ 
      quality,
      effort: 4, // Balanced effort for speed/quality
      smartSubsample: true,
      nearLossless: quality >= 90
    })
    .toFile(outputPath);

    let stats = await fs.stat(outputPath);
    let sizeKB = stats.size / 1024;

    if (sizeKB <= targetSizeTolerance) {
      return true; // Success with good quality
    }

    // Attempt 2: Moderate quality reduction if needed
    if (sizeKB > targetSizeKB) {
      quality = Math.max(60, quality - 25); // More gentle quality reduction
      
      await sharp(inputPath, {
        limitInputPixels: false,
        sequentialRead: true
      })
      .webp({ 
        quality,
        effort: 5,
        smartSubsample: true
      })
      .toFile(outputPath);

      stats = await fs.stat(outputPath);
      sizeKB = stats.size / 1024;

      if (sizeKB <= targetSizeKB) {
        return true;
      }
    }

    // Attempt 3: Final attempt with smart resizing if still too large
    if (sizeKB > targetSizeKB) {
      const metadata = await sharp(inputPath).metadata();
      
      // Calculate optimal scale factor based on current vs target size
      const reductionFactor = Math.sqrt(targetSizeKB / sizeKB * 0.9); // 90% of target for safety
      const newWidth = Math.max(400, Math.floor((metadata.width || 1920) * reductionFactor));
      const newHeight = Math.max(300, Math.floor((metadata.height || 1080) * reductionFactor));
      
      await sharp(inputPath, {
        limitInputPixels: false,
        sequentialRead: true
      })
      .resize(newWidth, newHeight, {
        kernel: sharp.kernel.lanczos3,
        withoutEnlargement: true
      })
      .webp({ 
        quality: Math.max(50, quality), // Maintain reasonable quality
        effort: 5,
        smartSubsample: true
      })
      .toFile(outputPath);

      stats = await fs.stat(outputPath);
      sizeKB = stats.size / 1024;

      if (sizeKB <= targetSizeKB) {
        return true;
      }

      // If still too large, warn but keep the file (better than 2KB quality disaster)
      if (sizeKB > targetSizeKB && onWarning) {
        onWarning(`Cannot achieve ${targetSizeKB}KB target for ${path.basename(inputPath)} (final: ${Math.round(sizeKB)}KB) while maintaining reasonable quality`);
      }
    }

    return true;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(chalk.red(`  ✗ Error converting ${path.basename(inputPath)}: ${errorMessage}`));
    return false;
  }
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
