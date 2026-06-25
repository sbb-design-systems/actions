import { readdirSync, unlinkSync } from 'node:fs';
import { extname, join } from 'node:path';

const allowedExtensions =
  /^\.(conf|gitkeep|gitignore|html?|ico|json|jpe?g|map|md|m?js|png|s?css|stackblitzrc|svg|ts|txt|webp|woff2)$/;
// Removes all files not matching allowed extensions from given directory.
readdirSync(join(process.cwd(), 'dist'), {
  withFileTypes: true,
  recursive: true,
})
  .filter((d) => d.isFile() && !allowedExtensions.test(extname(d.name) || d.name))
  .forEach((d) => {
    console.log(`Removing ${join(d.parentPath, d.name)}`);
    unlinkSync(join(d.parentPath, d.name));
  });
