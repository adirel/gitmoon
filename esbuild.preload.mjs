import esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

esbuild.build({
  entryPoints: [path.join(__dirname, 'src/preload/index.ts')],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: path.join(__dirname, 'dist/preload/index.js'),
  external: ['electron'],
  format: 'cjs',
  sourcemap: true,
}).then(() => {
  console.log('✓ Preload script bundled');
}).catch((error) => {
  console.error('✗ Preload bundling failed:', error);
  process.exit(1);
});
