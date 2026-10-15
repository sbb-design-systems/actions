import { Dirent, existsSync, readdirSync, readFileSync, unlinkSync } from 'node:fs';
import { extname, join } from 'node:path';
import { gunzipSync } from 'node:zlib';

const allowedExtensions =
  /^\.(cjs|conf|cts|gitkeep|gitignore|html?|ico|json|jpe?g|map|md|m?js|npmignore|png|s?css|stackblitzrc|svg|ts|txt|webp|woff2)$/;
// Removes all files not matching allowed extensions from given directory.
readdirSync(join(process.cwd(), 'dist'), {
  withFileTypes: true,
  recursive: true,
})
  .filter((d) => d.isFile() && !isValidFile(d))
  .forEach((d) => {
    console.log(`Removing ${join(d.parentPath, d.name)}`);
    unlinkSync(join(d.parentPath, d.name));
  });

function isValidFile(d: Dirent): boolean {
  if (extname(d.name) === '.gz') {
    const originalPath = join(d.parentPath, d.name.substring(0, d.name.length - 3));

    return (
      allowedExtensions.test(extname(originalPath)) &&
      existsSync(originalPath) &&
      hasCompressedContent(originalPath, d)
    );
  } else {
    return allowedExtensions.test(extname(d.name) || d.name);
  }
}

function hasCompressedContent(originalPath: string, d: Dirent): boolean {
  const originalContent = readFileSync(originalPath);
  const unpackedContent = gunzipSync(readFileSync(join(d.parentPath, d.name)));
  return originalContent.equals(unpackedContent);
}
