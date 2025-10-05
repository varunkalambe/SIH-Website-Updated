import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

// Your exact file paths from the logs
const jobId = '68d910b2c1edf9689e31b264';
const videoPath = "C:/Users/varun/OneDrive/Desktop/SIH prototype/SIH-Website/backend/uploads/originals/1758956043034.mp4";
const audioPath = "C:/Users/varun/OneDrive/Desktop/SIH prototype/SIH-Website/backend/uploads/translated_audio/68d910b2c1edf9689e31b264_translated_realtime_sync_neural_corrected.wav";
const captionPath = "C:/Users/varun/OneDrive/Desktop/SIH prototype/SIH-Website/backend/uploads/captions/68d910b2c1edf9689e31b264_captions.vtt";
const outputPath = "C:/Users/varun/OneDrive/Desktop/SIH prototype/SIH-Website/backend/uploads/processed/68d910b2c1edf9689e31b264_final.mp4";

// Your fixed escape function
const escapeSubtitlePath = (windowsPath) => {
  return windowsPath
    .replace(/\\/g, '/')
    .replace(/:/g, '\\:')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/'/g, "'\\\\''")
    .replace(/ /g, '\\ ');
};

console.log(`[${jobId}] 🚀 Starting final video assembly with fixed subtitle path...`);

// Check if files exist
console.log(`[${jobId}] 📋 File Check:`);
console.log(`[${jobId}]   Video: ${fs.existsSync(videoPath) ? '✅' : '❌'} ${videoPath}`);
console.log(`[${jobId}]   Audio: ${fs.existsSync(audioPath) ? '✅' : '❌'} ${audioPath}`);
console.log(`[${jobId}]   Captions: ${fs.existsSync(captionPath) ? '✅' : '❌'} ${captionPath}`);

const escapedCaptionPath = escapeSubtitlePath(captionPath);
console.log(`[${jobId}] 🔧 Escaped caption path: ${escapedCaptionPath}`);

// Build the corrected FFmpeg command
const command = [
  'ffmpeg',
  '-i', `"${videoPath}"`,
  '-i', `"${audioPath}"`,
  '-vf', `"scale=-2:720,fps=50,subtitles='${escapedCaptionPath}':force_style='Fontsize=16,PrimaryColour=&Hffffff&,OutlineColour=&H000000&,Outline=2'"`,
  '-af', '"aresample=44100,afade=in:st=0:d=0.005,afade=out:st=31.275:d=0.005"',
  '-c:v', 'libx264',
  '-c:a', 'aac',
  '-b:v', '2000k',
  '-b:a', '192k',
  '-preset', 'medium',
  '-crf', '23',
  '-t', '31.28',
  '-y',
  `"${outputPath}"`
].join(' ');

console.log(`[${jobId}] 🎬 Running FFmpeg with fixed subtitle embedding...`);
console.log(`[${jobId}] Command: ${command.substring(0, 150)}...`);

const startTime = Date.now();

exec(command, { maxBuffer: 1024 * 1024 * 50 }, (error, stdout, stderr) => {
  const processingTime = Date.now() - startTime;
  
  if (error) {
    console.error(`[${jobId}] ❌ Video assembly FAILED:`, error.message);
    console.error(`[${jobId}] stderr:`, stderr);
  } else {
    console.log(`[${jobId}] ✅ SUCCESS: Video processed successfully!`);
    console.log(`[${jobId}] 📊 Processing time: ${Math.round(processingTime / 1000)}s`);
    console.log(`[${jobId}] 📁 Output: ${outputPath}`);
    
    // Check output file
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      console.log(`[${jobId}] 📏 File size: ${Math.round(stats.size / 1024 / 1024)}MB`);
    }
  }
});
