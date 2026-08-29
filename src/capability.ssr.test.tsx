import { describe, expect, it } from 'vitest';
import { isServer, renderToString } from 'solid-js/web';
import { writeEnabled } from 'langsys-js-typescript';
import { useWriteEnabled } from './primitives.js';

/**
 * SSR-1..3 / GATE-1 — capability must not appear in server-rendered markup.
 *
 * Runs against Solid's SERVER build (see `vitest.ssr.config.mts`); the main
 * test project forces the browser build, where `renderToString` is a stub and
 * this could not be asserted at all.
 *
 * Why it matters concretely: `writeEnabled` is a process-wide singleton, while
 * capability is per-session — it varies by requester address and by write grant
 * (GATE-1). In a long-lived SSR server, serializing one request's answer into
 * markup applies it to every later visitor. `undefined` is the honest answer,
 * and `useWriteEnabled`'s `onMount` subscription is what guarantees it: onMount
 * never runs during server rendering.
 */
describe('useWriteEnabled under server rendering', () => {
    it('has a positive control: this project really is the server build', () => {
        // If this fails, the assertions below would be testing the browser build
        // and proving nothing about SSR.
        expect(isServer).toBe(true);
        // renderToString must really render here — in the browser build it is a
        // stub returning undefined, which would make the assertions below vacuous.
        expect(renderToString(() => 'control' as never)).toContain('control');
    });

    it('renders the undecided branch even when the core already holds a value', () => {
        writeEnabled.set(true); // a previous request authorized

        const html = renderToString(() => {
            const enabled = useWriteEnabled();
            return <span>{enabled() === undefined ? 'undecided' : String(enabled())}</span>;
        });

        expect(html).toContain('undecided');
        expect(html).not.toContain('true');
    });

    it('does not leak a `false` either — the tri-state survives SSR', () => {
        writeEnabled.set(false);

        const html = renderToString(() => {
            const enabled = useWriteEnabled();
            return <span>{enabled() === undefined ? 'undecided' : String(enabled())}</span>;
        });

        expect(html).toContain('undecided');
        expect(html).not.toContain('false');
    });
});
