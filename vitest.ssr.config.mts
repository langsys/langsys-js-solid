import solid from 'vite-plugin-solid';
import { defineConfig } from 'vitest/config';

/**
 * SSR test project — the counterpart to `vitest.config.mts`.
 *
 * The main config forces Solid's BROWSER build, because Node's default export
 * condition maps to the server build whose reactive graph is inert (see the
 * comment there). That is right for reactivity tests and makes `renderToString`
 * a non-functional stub, so server rendering cannot be asserted there at all.
 *
 * This project is the inverse: `vite-plugin-solid` in SSR mode and the `node`
 * condition, so `renderToString` really renders. It exists to assert one thing
 * the browser project structurally cannot — that capability is `undefined` in
 * server-rendered markup (GATE-1: browser-authoritative; SSR-1..3).
 */
export default defineConfig({
    plugins: [solid({ ssr: true })],
    test: {
        environment: 'node',
        include: ['src/**/*.ssr.test.tsx'],
        server: { deps: { inline: [/solid-js/] } },
    },
    resolve: { conditions: ['node', 'development'] },
});
