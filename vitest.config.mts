import { defineConfig } from 'vitest/config';

export default defineConfig({
    // Resolve solid-js's browser build — Node's default export condition maps
    // to solid's server build, whose reactive graph is inert (computations run
    // once and never track), which would make every reactivity test pass
    // vacuously or fail. Standard setup for testing Solid code under vitest.
    resolve: {
        conditions: ['browser', 'development'],
    },
    // Vitest resolves inlined deps through vite's SSR pipeline, which has its
    // own condition set — without these, solid still resolves to the server
    // build even with the resolve.conditions above.
    ssr: {
        resolve: {
            conditions: ['browser', 'development'],
            externalConditions: ['browser', 'development'],
        },
    },
    test: {
        environment: 'node',
        include: ['src/**/*.test.ts'],
        server: {
            deps: {
                // Without inlining, node_modules are resolved by Node itself,
                // which picks solid's server build regardless of the
                // conditions above.
                inline: [/solid-js/],
            },
        },
    },
});
