import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

const currenWorkingDirectory = process.cwd();

const { positionals } = parseArgs({
  allowPositionals: true,
});
const changelogPath = join(currenWorkingDirectory, 'CHANGELOG.md');
const extractPath = `/tmp/changelog-extract.json`;
const changelog = readFileSync(changelogPath, 'utf8');
const versionRegex = /## \[(\d+\.\d+\.\d+.*?)\]\(/g;

if (positionals[0] === 'extract') {
  const latestMatch = versionRegex.exec(changelog);
  const previousMatch = versionRegex.exec(changelog);
  console.log(`Extracting changelog for version ${latestMatch![1]}...`);
  writeFileSync(
    extractPath,
    JSON.stringify({
      [latestMatch![1]]: changelog.substring(latestMatch!.index, previousMatch!.index),
    }),
    'utf8',
  );
} else if (positionals[0] === 'insert') {
  if (!existsSync(extractPath)) {
    throw new Error(
      `Extracted changelog not found at ${extractPath}. Please run "extract" command first.`,
    );
  }

  const extractedChangelog = JSON.parse(readFileSync(extractPath, 'utf8'));
  const extractedVersion = Object.keys(extractedChangelog)[0];
  const extractedContent = extractedChangelog[extractedVersion];
  const latestMatch = versionRegex.exec(changelog);

  if (changelog.includes(`## [${extractedVersion}]`)) {
    console.log(
      `Changelog for version ${extractedVersion} already exists in ${changelogPath}. Skipping insertion.`,
    );
  } else {
    console.log(`Inserting changelog for version ${extractedVersion}...`);
    const updatedChangelog =
      changelog.substring(0, latestMatch!.index) +
      extractedContent +
      changelog.substring(latestMatch!.index);
    writeFileSync(changelogPath, updatedChangelog, 'utf8');
  }
} else {
  throw new Error(`Unknown command ${positionals[0]}`);
}
