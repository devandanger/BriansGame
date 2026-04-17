import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf8')
);

export default defineConfig({
  server: { port: 5173, open: true },
  build: { target: 'es2020' },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version)
  }
});
