import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts', 'src/start.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    target: 'es2021',
    treeshake: true,
    splitting: false,
    minify: false,
    // Solid is provided by the consuming app — never bundle it.
    external: ['solid-js', 'node:async_hooks'],
});
