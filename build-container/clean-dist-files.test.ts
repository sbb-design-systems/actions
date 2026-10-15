import { describe, it, mock } from 'node:test';
import { ok } from 'node:assert';
import { existsSync, mkdirSync, mkdtempDisposableSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

describe('clean dist files', () => {
  it('should work', async () => {
    using dir = mkdtempDisposableSync('clean-dir');

    const cwdMock = mock.method(process, 'cwd', () => dir.path);

    using _ = { [Symbol.dispose]: () => cwdMock.mock.restore() };

    let distDir = join(dir.path, 'dist');
    mkdirSync(distDir);

    writeFileSync(join(distDir, 'valid.js'), 'test');
    writeFileSync(join(distDir, 'valid.js.gz'), gzipSync('test'));
    writeFileSync(join(distDir, 'invalid.mock'), 'test');
    writeFileSync(join(distDir, 'invalid.mock.gz'), gzipSync('test'));

    await import('./clean-dist-files.ts');

    ok(existsSync(join(distDir, 'valid.js')));
    ok(existsSync(join(distDir, 'valid.js.gz')));
    ok(!existsSync(join(distDir, 'invalid.mock')));
    ok(!existsSync(join(distDir, 'invalid.mock.gz')));
  });
});
