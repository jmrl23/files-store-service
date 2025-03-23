import crypto from 'node:crypto';
import fs from 'node:fs';

export function generateEtag(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5'); // or 'sha1', 'sha256', etc.
    const stream = fs.createReadStream(filePath);

    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(`"${hash.digest('hex')}"`));
    stream.on('error', reject);
  });
}
