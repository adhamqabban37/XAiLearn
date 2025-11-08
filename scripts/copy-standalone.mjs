import { cpSync } from 'fs';
import { join } from 'path';

const log = (msg) => console.log(`[copy-standalone] ${msg}`);

try {
  const standaloneDir = join(process.cwd(), '.next/standalone');
  const staticDir = join(process.cwd(), '.next/static');
  const publicDir = join(process.cwd(), 'public');

  const staticDest = join(standaloneDir, '.next/static');
  const publicDest = join(standaloneDir, 'public');

  log(`Copying '.next/static' to '${staticDest}'...`);
  cpSync(staticDir, staticDest, { recursive: true });

  log(`Copying 'public' to '${publicDest}'...`);
  cpSync(publicDir, publicDest, { recursive: true });

  log('Successfully copied static assets for standalone build.');
  process.exit(0);
} catch (error) {
  log('Error copying static assets:');
  console.error(error);
  process.exit(1);
}
