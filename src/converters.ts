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
  const maxAttempts = 10;

  await fs.ensureDir(path.dirname(outputPath));

  while (attempts < maxAttempts && quality > 0) {
    try {
      // Optimized Sharp settings for better performance
      await sharp(inputPath, {
        limitInputPixels: false, // Remove pixel limit for large images
        sequentialRead: true     // Better performance for JPEG inputs
      })
      .webp({ 
        quality,
        effort: attempts < 2 ? 3 : 6, // Use lower effort for initial attempts, max effort for final attempts
        smartSubsample: true,          // Better compression efficiency
        nearLossless: quality >= 90    // Use near-lossless for high quality
      })
      .toFile(outputPath);

      const stats = await fs.stat(outputPath);
      const sizeKB = stats.size / 1024;

      if (sizeKB <= targetSizeKB) {
        return true;
      }

      // Reduce quality for next attempt
      quality = Math.max(10, quality - 15); // Keep minimum quality at 10
      attempts++;

      // If we can't achieve target size, try more aggressive compression
      if (attempts >= maxAttempts - 1) {
        // Final attempt with very low quality and maximum effort
        await sharp(inputPath, {
          limitInputPixels: false,
          sequentialRead: true
        })
        .webp({ quality: 10, effort: 6, smartSubsample: true })
        .toFile(outputPath);
        
        const finalStats = await fs.stat(outputPath);
        const finalSizeKB = finalStats.size / 1024;
        
        if (finalSizeKB > targetSizeKB) {
          // Still too large - try resizing the image
          const metadata = await sharp(inputPath).metadata();
          const reduction = Math.sqrt(targetSizeKB / finalSizeKB);
          const newWidth = Math.floor((metadata.width || 1920) * reduction);
          const newHeight = Math.floor((metadata.height || 1080) * reduction);
          
          await sharp(inputPath, {
            limitInputPixels: false,
            sequentialRead: true
          })
          .resize(newWidth, newHeight, {
            kernel: sharp.kernel.lanczos3, // High quality resizing
            withoutEnlargement: true
          })
          .webp({ quality: 25, effort: 6, smartSubsample: true })
          .toFile(outputPath);
            
          // Check final size after resize
          const resizedStats = await fs.stat(outputPath);
          const resizedSizeKB = resizedStats.size / 1024;
          
          if (resizedSizeKB > targetSizeKB && onWarning) {
            onWarning(`Cannot achieve ${targetSizeKB}KB target for ${path.basename(inputPath)} (final: ${Math.round(resizedSizeKB)}KB)`);
          }
        }
        
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
