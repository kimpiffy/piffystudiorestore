#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const sharp = require('sharp');
const { optimize } = require('svgo');

const projectRoot = path.resolve(__dirname, '..');
const manifestPath = path.join(projectRoot, '.media-optimizer-state.json');
const imageDirs = [
  'static/img',
  'static/styles/publication-web-resources/image',
  'static/styles/publication-web-resources/Thumbnails',
];
const videoDirs = ['static/video'];
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function currentManifest() {
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch {
    return { images: {}, videos: {} };
  }
}

function saveManifest(manifest) {
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 1 : 2)} ${units[unitIndex]}`;
}

function getRelativePath(filePath) {
  return path.relative(projectRoot, filePath).split(path.sep).join('/');
}

function discoverFiles(dirs) {
  const found = [];
  for (const dir of dirs) {
    const fullDir = path.join(projectRoot, dir);
    if (!fs.existsSync(fullDir)) continue;
    const stack = [fullDir];
    while (stack.length) {
      const current = stack.pop();
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) {
          stack.push(full);
        } else if (entry.isFile()) {
          found.push(full);
        }
      }
    }
  }
  return found.sort();
}

function isImage(filePath) {
  return /\.(jpe?g|png|webp|avif|gif|svg)$/i.test(filePath);
}

function isVideo(filePath) {
  return /\.(mp4|webm|mov|m4v)$/i.test(filePath);
}

function isGeneratedOutput(filePath) {
  const fileName = path.basename(filePath);
  return /(?:\.optimized\.(?:svg|webp|avif)|-optimized\.(?:mp4|webm|mov|m4v))$/i.test(fileName);
}

function ensureParentDir(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function toWebFriendlySize(width, height, maxDimension = 2000) {
  if (!width || !height) return { width: 0, height: 0 };
  const largest = Math.max(width, height);
  if (largest <= maxDimension) {
    return { width, height };
  }
  const scale = maxDimension / largest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function hasAudioStream(filePath) {
  try {
    const probe = execFileSync(require('ffprobe-static').path, ['-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=codec_type', '-of', 'default=noprint_wrappers=1:nokey=1', filePath], { encoding: 'utf8' });
    return probe.trim().length > 0;
  } catch {
    return false;
  }
}

async function optimizeSvgFile(inputFile, manifest) {
  const rel = getRelativePath(inputFile);
  const originalSize = fs.statSync(inputFile).size;
  const hash = sha256(inputFile);
  const prev = manifest.images[rel];
  if (prev && prev.hash === hash && prev.size === originalSize && prev.optimized && fileExists(path.join(projectRoot, prev.optimized))) {
    return { processed: false, reason: 'unchanged', rel, originalSize, optimizedSize: fs.statSync(path.join(projectRoot, prev.optimized)).size };
  }

  const { dir, name } = path.parse(inputFile);
  const outputFile = path.join(dir, `${name}.optimized.svg`);
  const raw = fs.readFileSync(inputFile, 'utf8');
  const result = optimize(raw, {
    path: inputFile,
    plugins: [
      'removeDoctype',
      'removeComments',
      'removeMetadata',
      'removeXMLProcInst',
      'cleanupNumericValues',
      'convertColors',
      'removeUselessDefs',
      'cleanupIDs',
      'removeHiddenElems',
      'removeRasterImages',
      'mergePaths',
      'minifyStyles',
      'removeTitle',
      'removeDesc',
    ],
  });
  ensureParentDir(outputFile);
  fs.writeFileSync(outputFile, result.data || raw);
  const optimizedSize = fs.statSync(outputFile).size;
  if (optimizedSize >= originalSize) {
    fs.unlinkSync(outputFile);
    return { processed: false, reason: 'not materially smaller', rel, originalSize, optimizedSize: originalSize };
  }

  manifest.images[rel] = { hash, size: originalSize, optimized: getRelativePath(outputFile) };
  return { processed: true, rel, originalSize, optimizedFile: getRelativePath(outputFile), optimizedSize };
}

async function optimizeImageFile(inputFile, manifest) {
  const rel = getRelativePath(inputFile);
  const ext = path.extname(inputFile).toLowerCase();
  const originalSize = fs.statSync(inputFile).size;
  const hash = sha256(inputFile);
  const prev = manifest.images[rel];
  if (prev && prev.hash === hash && prev.size === originalSize && prev.optimized && fileExists(path.join(projectRoot, prev.optimized))) {
    return { processed: false, reason: 'unchanged', rel, originalSize, optimizedSize: fs.statSync(path.join(projectRoot, prev.optimized)).size };
  }

  if (ext === '.svg') {
    return optimizeSvgFile(inputFile, manifest);
  }

  if (!['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'].includes(ext)) {
    return { processed: false, reason: 'unsupported', rel, originalSize };
  }

  const metadata = await sharp(inputFile).metadata();
  const sourceWidth = metadata.width || 0;
  const sourceHeight = metadata.height || 0;
  const target = path.join(path.dirname(inputFile), `${path.basename(inputFile, ext)}.webp`);
  const outputRel = getRelativePath(target);

  if (ext === '.webp' && originalSize < MAX_IMAGE_BYTES && sourceWidth <= 2000 && sourceHeight <= 2000) {
    return { processed: false, reason: 'already web-friendly', rel, originalSize, optimizedSize: originalSize };
  }

  const dims = toWebFriendlySize(sourceWidth, sourceHeight, 2000);
  ensureParentDir(target);

  await sharp(inputFile)
    .rotate()
    .resize({
      width: dims.width || undefined,
      height: dims.height || undefined,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 78, effort: 6 })
    .toFile(target);

  const optimizedSize = fs.statSync(target).size;
  if (optimizedSize >= originalSize * 0.98) {
    fs.unlinkSync(target);
    return { processed: false, reason: 'not materially smaller', rel, originalSize, optimizedSize: originalSize };
  }

  manifest.images[rel] = { hash, size: originalSize, optimized: outputRel };
  return { processed: true, rel, originalSize, optimizedFile: outputRel, optimizedSize };
}

async function optimizeVideoFile(inputFile, manifest) {
  const rel = getRelativePath(inputFile);
  const originalSize = fs.statSync(inputFile).size;
  const hash = sha256(inputFile);
  const prev = manifest.videos[rel];
  if (prev && prev.hash === hash && prev.size === originalSize && prev.optimized && fileExists(path.join(projectRoot, prev.optimized))) {
    return { processed: false, reason: 'unchanged', rel, originalSize, optimizedSize: fs.statSync(path.join(projectRoot, prev.optimized)).size };
  }

  const ffmpegBin = require('ffmpeg-static');
  const output = path.join(path.dirname(inputFile), `${path.basename(inputFile, path.extname(inputFile))}-optimized.mp4`);
  const hasAudio = hasAudioStream(inputFile);
  const ffmpegArgs = [
    '-y',
    '-i', inputFile,
    '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2:flags=lanczos',
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '28',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-profile:v', 'high',
    '-level', '4.0',
  ];

  if (!hasAudio) {
    ffmpegArgs.push('-an');
  }
  ffmpegArgs.push(output);

  execFileSync(ffmpegBin, ffmpegArgs, { stdio: 'inherit' });
  const optimizedSize = fs.statSync(output).size;
  if (optimizedSize >= originalSize * 0.98) {
    fs.unlinkSync(output);
    return { processed: false, reason: 'not materially smaller', rel, originalSize, optimizedSize: originalSize };
  }

  manifest.videos[rel] = { hash, size: originalSize, optimized: getRelativePath(output) };
  return { processed: true, rel, originalSize, optimizedFile: getRelativePath(output), optimizedSize };
}

async function main() {
  const manifest = currentManifest();
  const report = {
    processedImages: [],
    processedVideos: [],
    skipped: [],
    totals: { before: 0, after: 0, saved: 0 },
  };

  const imageFiles = discoverFiles(imageDirs).filter((filePath) => isImage(filePath) && !isGeneratedOutput(filePath));
  const videoFiles = discoverFiles(videoDirs).filter((filePath) => isVideo(filePath) && !isGeneratedOutput(filePath));

  for (const file of imageFiles) {
    try {
      const result = await optimizeImageFile(file, manifest);
      if (result.processed) {
        report.processedImages.push(result);
        report.totals.before += result.originalSize;
        report.totals.after += result.optimizedSize;
      } else if (result.reason === 'unchanged' || result.reason === 'already web-friendly') {
        report.skipped.push(result);
      }
    } catch (error) {
      console.warn(`Image optimization skipped for ${getRelativePath(file)}: ${error.message}`);
    }
  }

  for (const file of videoFiles) {
    try {
      const result = await optimizeVideoFile(file, manifest);
      if (result.processed) {
        report.processedVideos.push(result);
        report.totals.before += result.originalSize;
        report.totals.after += result.optimizedSize;
      } else if (result.reason === 'unchanged') {
        report.skipped.push(result);
      }
    } catch (error) {
      console.warn(`Video optimization skipped for ${getRelativePath(file)}: ${error.message}`);
    }
  }

  report.totals.saved = report.totals.before - report.totals.after;
  saveManifest(manifest);

  console.log('Media optimization report');
  console.log('========================');

  const allProcessed = [...report.processedImages, ...report.processedVideos];
  if (allProcessed.length) {
    for (const item of allProcessed) {
      console.log(`${item.rel} :: ${formatBytes(item.originalSize)} -> ${formatBytes(item.optimizedSize)} (${(item.optimizedSize / item.originalSize * 100).toFixed(1)}% of original)`);
    }
  } else {
    console.log('No newly optimized media files were created.');
  }

  if (report.skipped.length) {
    console.log('\nSkipped/unchanged:');
    for (const item of report.skipped.slice(0, 10)) {
      console.log(`- ${item.rel} (${item.reason})`);
    }
  }

  console.log('\nTotals');
  console.log(`Original: ${formatBytes(report.totals.before)}`);
  console.log(`Optimized: ${formatBytes(report.totals.after)}`);
  console.log(`Saved: ${formatBytes(report.totals.saved)}`);
}

main().catch((error) => {
  console.error('Media optimization failed:', error);
  process.exit(1);
});
