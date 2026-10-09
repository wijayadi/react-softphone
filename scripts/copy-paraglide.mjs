// Copies the Paraglide-generated output into `dist/` so the emitted type
// declarations (e.g. `dist/i18n.d.ts`) can resolve their `./paraglide/*`
// imports for consumers.
import { cpSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'src', 'paraglide');
const destination = path.join(root, 'dist', 'paraglide');

if (existsSync(source)) {
  cpSync(source, destination, { recursive: true });
  console.log('[build] copied generated paraglide output to dist/paraglide');
} else {
  console.warn('[build] src/paraglide not found; skipping copy');
}
