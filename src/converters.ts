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
  let quality = initialQuality;
  let attempts = 0;

  await fs.ensureDir(path.dirname(outputPath));

  // First, try with different quality levels
  while (attempts < 8 && quality > 5) {
    try {
      await sharp(inputPath, {
        limitInputPixels: false,
        sequentialRead: true
      })
      .webp({ 
        quality,
        effort: attempts < 3 ? 3 : 6,
        smartSubsample: true,
        nearLossless: quality >= 90
      })
      .toFile(outputPath);

      const stats = await fs.stat(outputPath);
      const sizeKB = stats.size / 1024;

      if (sizeKB <= targetSizeKB) {
        return true;
      }

      // More aggressive quality reduction
      quality = Math.max(5, quality - 12);
      attempts++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`  ✗ Error converting ${path.basename(inputPath)}: ${errorMessage}`));
      return false;
    }
  }

  // If quality reduction failed, try progressive resizing with iterative approach
  const metadata = await sharp(inputPath).metadata();
  let scaleFactor = 0.95; // Start with 95% of original size
  let resizeAttempts = 0;
  const maxResizeAttempts = 10;

  while (resizeAttempts < maxResizeAttempts && scaleFactor > 0.3) {
    try {
      const newWidth = Math.floor((metadata.width || 1920) * scaleFactor);
      const newHeight = Math.floor((metadata.height || 1080) * scaleFactor);
      
      await sharp(inputPath, {
        limitInputPixels: false,
        sequentialRead: true
      })
      .resize(newWidth, newHeight, {
        kernel: sharp.kernel.lanczos3,
        withoutEnlargement: true
      })
      .webp({ 
        quality: 15, // Very low quality but acceptable
        effort: 6, 
        smartSubsample: true
      })
      .toFile(outputPath);

      const stats = await fs.stat(outputPath);
      const sizeKB = stats.size / 1024;

      if (sizeKB <= targetSizeKB) {
        return true; // Success! Size target achieved
      }

      // Reduce size more aggressively
      scaleFactor -= 0.08; // Reduce by 8% each iteration
      resizeAttempts++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`  ✗ Error converting ${path.basename(inputPath)}: ${errorMessage}`));
      return false;
    }
  }

  // Final desperate attempt - very small size with minimum quality
  try {
    await sharp(inputPath, {
      limitInputPixels: false,
      sequentialRead: true
    })
    .resize(200, 200, { // Very small fallback size
      fit: 'inside',
      withoutEnlargement: true,
      kernel: sharp.kernel.nearest // Fastest, but lower quality
    })
    .webp({ 
      quality: 5, // Minimum quality
      effort: 6
    })
    .toFile(outputPath);

    const finalStats = await fs.stat(outputPath);
    const finalSizeKB = finalStats.size / 1024;
    
    if (finalSizeKB <= targetSizeKB) {
      if (onWarning) {
        onWarning(`Achieved ${targetSizeKB}KB target for ${path.basename(inputPath)} but with significant quality reduction (${Math.round(finalSizeKB)}KB)`);
      }
      return true;
    }

    // This should never happen, but if it does, report failure
    if (onWarning) {
      onWarning(`FAILED to achieve ${targetSizeKB}KB target for ${path.basename(inputPath)} (final: ${Math.round(finalSizeKB)}KB) - file may be extremely complex`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(chalk.red(`  ✗ Error in final conversion attempt for ${path.basename(inputPath)}: ${errorMessage}`));
  }

  return true; // Return true to continue processing other files
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
