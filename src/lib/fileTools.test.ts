import { afterAll, describe, expect, it, vi } from 'vitest';
import { createHash, webcrypto } from 'node:crypto';
import { findDuplicateFiles, sha256File } from './fileTools';

vi.stubGlobal('crypto', webcrypto);

function makeFile(content: string, name: string): File {
  const file = new File([content], name);
  Object.defineProperty(file, 'arrayBuffer', {
    value: async () => new TextEncoder().encode(content).buffer
  });
  return file;
}

describe('local file fingerprints', () => {
  afterAll(() => vi.unstubAllGlobals());

  it('matches the standard SHA-256 digest for selected file contents', async () => {
    const file = makeFile('recoverx', 'notes.txt');
    const fingerprint = await sha256File(file);

    expect(fingerprint).toBe(createHash('sha256').update('recoverx').digest('hex'));
  });

  it('groups only byte-for-byte identical files', async () => {
    const first = makeFile('same bytes', 'first.txt');
    const duplicate = makeFile('same bytes', 'copy.txt');
    const different = makeFile('different bytes', 'other.txt');

    const groups = await findDuplicateFiles([first, duplicate, different]);

    expect(groups).toHaveLength(1);
    expect(groups[0].files).toEqual([first, duplicate]);
  });
});
