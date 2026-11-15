import { writeFile } from 'fs/promises';

/**
 * Who may point an email at a report.
 * - `overwrite`: the caller proved they own the email (signed in, verified) —
 *   the index is replaced.
 * - `claim-if-absent`: anyone else — the index is created only when the email
 *   has none yet, so an anonymous request cannot hijack an existing entry.
 */
export type EmailIndexPolicy = 'overwrite' | 'claim-if-absent';

function isErrnoCode(err: unknown, code: string): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code?: unknown }).code === code;
}

/**
 * Write an email-index file under `policy`. Resolves `true` when the index now
 * points at this report, `false` when an existing index was left in place.
 * The create-only write (`wx`) is atomic, so two concurrent claims cannot both win.
 */
export async function writeEmailIndexFile(
  filePath: string,
  index: object,
  policy: EmailIndexPolicy,
): Promise<boolean> {
  try {
    await writeFile(filePath, JSON.stringify(index), {
      encoding: 'utf8',
      flag: policy === 'overwrite' ? 'w' : 'wx',
    });
    return true;
  } catch (err: unknown) {
    if (policy === 'claim-if-absent' && isErrnoCode(err, 'EEXIST')) return false;
    throw err;
  }
}
