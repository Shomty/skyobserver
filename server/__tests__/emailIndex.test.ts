import { mkdtemp, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { writeEmailIndexFile } from '../emailIndex.ts';

describe('writeEmailIndexFile', () => {
  let dir: string;
  let file: string;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'email-index-'));
    file = path.join(dir, 'email-abc.json');
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const read = async () => JSON.parse(await readFile(file, 'utf8')) as { reportId: string };

  it('lets an anonymous save claim an email that has no index yet', async () => {
    await expect(writeEmailIndexFile(file, { reportId: 'first' }, 'claim-if-absent')).resolves.toBe(true);
    expect((await read()).reportId).toBe('first');
  });

  it('does not let an anonymous save overwrite an existing index', async () => {
    await writeEmailIndexFile(file, { reportId: 'owner' }, 'claim-if-absent');
    await expect(writeEmailIndexFile(file, { reportId: 'attacker' }, 'claim-if-absent')).resolves.toBe(false);
    expect((await read()).reportId).toBe('owner');
  });

  it('lets the verified owner replace an existing index', async () => {
    await writeEmailIndexFile(file, { reportId: 'squatter' }, 'claim-if-absent');
    await expect(writeEmailIndexFile(file, { reportId: 'owner' }, 'overwrite')).resolves.toBe(true);
    expect((await read()).reportId).toBe('owner');
  });

  it('lets only one of two concurrent anonymous claims win', async () => {
    const results = await Promise.all([
      writeEmailIndexFile(file, { reportId: 'a' }, 'claim-if-absent'),
      writeEmailIndexFile(file, { reportId: 'b' }, 'claim-if-absent'),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
  });

  it('rethrows errors other than an existing file', async () => {
    const missingDir = path.join(dir, 'missing', 'email.json');
    await expect(writeEmailIndexFile(missingDir, { reportId: 'x' }, 'claim-if-absent')).rejects.toThrow();
  });
});
