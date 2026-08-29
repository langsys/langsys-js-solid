import solid from 'vite-plugin-solid';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    // `vite-plugin-solid` is what makes solid resolve to its browser build here.
    // Node's default export condition maps to solid's SERVER build, whose
    // reactive graph is inert — computations run once and never track — so
    // reactivity tests fail (or, worse, pass vacuously). Setting
    // `resolve.conditions` by hand is not enough: vitest resolves through
    // vite's SSR pipeline, which the plugin configures for us alongside the
    // JSX transform.
    plugins: [solid()],
    test: {
        // Solid's browser build expects DOM globals at import time.
        environment: 'happy-dom',
        include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
        // The SSR project owns these; run against the browser build they are vacuous.
        exclude: ['src/**/*.ssr.test.tsx'],
        server: {
            deps: {
                // Keep solid on vite's pipeline; left to Node's own resolver it
                // reverts to the server build regardless of the plugin.
                inline: [/solid-js/],
            },
        },
    },
    resolve: {
        conditions: ['browser', 'development'],
    },
});
