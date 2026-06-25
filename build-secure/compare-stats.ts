import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const hostPrefix = process.env
  .GITHUB_REPOSITORY!.split('/')[1]
  .replace('lyne-components', 'lyne-elements');

interface SizeStats {
  js: number;
  jsBrotli: number;
  jsGzip: number;
  jsCss: number;
  css: number;
  cssBrotli: number;
  cssGzip: number;
  cssFiles: Record<string, { size: number; gzipSize: number; brotliSize: number }>;
  jsFiles: Record<string, { size: number; cssSize?: number; gzipSize: number; brotliSize: number }>;
}

interface Stats {
  sizes: SizeStats;
}

let previousStats: SizeStats | null = null;
let summary: string;
let text: string;
let title = 'Size Check';
try {
  const previousStatsURL = `https://${hostPrefix}-dev.app.sbb.ch/stats.json`;
  previousStats = (await fetch(previousStatsURL).then((r) => r.json() as Promise<Stats>))!.sizes;
} catch {
  /* empty */
}

const stats: SizeStats = JSON.parse(
  readFileSync(join(process.cwd(), 'dist/docs/stats.json'), 'utf8'),
).sizes;
if (previousStats) {
  const withSign = (value: number): string => `${value <= 0 ? '' : '+'}${value}`;
  const jsDiff = withSign(stats.js - previousStats.js);
  const cssDiff = withSign(stats.css - previousStats.css);
  const jsCssDiff = withSign(stats.jsCss - previousStats.jsCss);
  title += `: JS ${jsDiff}, CSS ${cssDiff}, CSS in JS ${jsCssDiff}`;
  const jsBrotliDiff = stats.jsBrotli - previousStats.jsBrotli;
  const jsGzipDiff = stats.jsGzip - previousStats.jsGzip;
  const cssBrotliDiff = stats.cssBrotli - previousStats.cssBrotli;
  const cssGzipDiff = stats.cssGzip - previousStats.cssGzip;
  summary = `
| Category | Size | Brotli | Gzip |
|----------|------|--------|------|
| JS | ${stats.js} (${jsDiff}) | ${stats.jsBrotli} (${jsBrotliDiff}) | ${stats.jsGzip} (${jsGzipDiff}) |
| CSS | ${stats.css} (${cssDiff}) | ${stats.cssBrotli} (${cssBrotliDiff}) | ${stats.cssGzip} (${cssGzipDiff}) |
| CSS in JS | ${stats.jsCss} (${jsCssDiff}) | | |
`;
  text = `
| File | Size | Brotli | Gzip |
|------|------|--------|------|
`;
  const cssFiles = Object.keys(stats.cssFiles)
    .concat(Object.keys(previousStats.cssFiles))
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort();
  for (const file of cssFiles) {
    const size = stats.cssFiles[file]?.size ?? 0;
    const sizeDiff = withSign(size - (previousStats.cssFiles[file]?.size ?? 0));
    const brotliSize = stats.cssFiles[file]?.brotliSize ?? 0;
    const brotliSizeDiff = withSign(brotliSize - (previousStats.cssFiles[file]?.brotliSize ?? 0));
    const gzipSize = stats.cssFiles[file]?.gzipSize ?? 0;
    const gzipSizeDiff = withSign(gzipSize - (previousStats.cssFiles[file]?.gzipSize ?? 0));
    if (sizeDiff !== '0') {
      text += `| ${file} | ${size} (${sizeDiff}) | ${brotliSize} (${brotliSizeDiff}) | ${gzipSize} (${gzipSizeDiff}) |\n`;
    }
  }
  text += `

| File | Size | Brotli | Gzip | CSS Size |
|------|------|--------|------|----------|
`;
  const jsFiles = Object.keys(stats.jsFiles)
    .concat(Object.keys(previousStats.jsFiles))
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort();
  for (const file of jsFiles) {
    const size = stats.jsFiles[file]?.size ?? 0;
    const sizeDiff = withSign(size - (previousStats.jsFiles[file]?.size ?? 0));
    const brotliSize = stats.jsFiles[file]?.brotliSize ?? 0;
    const brotliSizeDiff = withSign(brotliSize - (previousStats.jsFiles[file]?.brotliSize ?? 0));
    const gzipSize = stats.jsFiles[file]?.gzipSize ?? 0;
    const gzipSizeDiff = withSign(gzipSize - (previousStats.jsFiles[file]?.gzipSize ?? 0));
    const cssSize = stats.jsFiles[file]?.cssSize ?? 0;
    const cssSizeDiff = withSign(cssSize - (previousStats.jsFiles[file]?.cssSize ?? 0));
    if (sizeDiff !== '0') {
      text += `| ${file} | ${size} (${sizeDiff}) | ${brotliSize} (${brotliSizeDiff}) | ${gzipSize} (${gzipSizeDiff}) | ${cssSize} (${cssSizeDiff}) |\n`;
    }
  }
} else {
  summary = `
| Category | Size | Brotli | Gzip |
|----------|------|--------|------|
| JS | ${stats.js} | ${stats.jsBrotli} | ${stats.jsGzip} |
| CSS | ${stats.css} | ${stats.cssBrotli} | ${stats.cssGzip} |
| CSS in JS | ${stats.jsCss} | | |
`;
  text = `
| File | Size | Brotli | Gzip |
|------|------|--------|------|
`;
  const cssFiles = Object.keys(stats.cssFiles)
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort();
  for (const file of cssFiles) {
    const size = stats.cssFiles[file]?.size ?? 0;
    const brotliSize = stats.cssFiles[file]?.brotliSize ?? 0;
    const gzipSize = stats.cssFiles[file]?.gzipSize ?? 0;
    text += `| ${file} | ${size} | ${brotliSize} | ${gzipSize} |\n`;
  }
  text += `

| File | Size | Brotli | Gzip | CSS Size |
|------|------|--------|------|----------|
`;
  for (const file of Object.keys(stats.jsFiles)) {
    const size = stats.jsFiles[file]?.size ?? 0;
    const brotliSize = stats.jsFiles[file]?.brotliSize ?? 0;
    const gzipSize = stats.jsFiles[file]?.gzipSize ?? 0;
    const cssSize = stats.jsFiles[file]?.cssSize ?? 0;
    text += `| ${file} | ${size} | ${brotliSize} | ${gzipSize} | ${cssSize} |\n`;
  }
}

export { summary, text, title };
