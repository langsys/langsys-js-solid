import { describe, expect, it } from 'vitest';
import { createComputed, createRoot } from 'solid-js';
import { writeEnabled as coreWriteEnabled } from 'langsys-js-typescript';
import { useWriteEnabled } from './primitives.js';

/**
 * GATE-8 / BIND-1 / BIND-2 — the capability surface.
 *
 * The house principle behind all three finished relands (Reviewer,
 * `838-intake-solid`): **the first client render must agree with what the
 * server rendered.** Capability reads `undefined` until the client actually
 * knows, and never seeds a concrete value the server did not render.
 *
 * React pins `getServerSnapshot`, Vue gates on `pastHydration`, Svelte defers
 * past first subscribe. Solid's idiom is `onMount`: it does not run under SSR
 * at all, and on the client it runs *after* the hydration pass — exactly the
 * seam the principle asks for. So `useWriteEnabled()` seeds `undefined`
 * synchronously and only adopts the core's value once mounted.
 *
 * The tri-state is load-bearing and asserted rather than assumed: `undefined`
 * means *undecided*, and GATE-8 forbids collapsing it to `false` — that turns
 * "we have not heard yet" into "you may not write".
 */

/** Mount an accessor inside a root and record every value it produces. */
function mountAndRead<T>(factory: () => () => T) {
    return createRoot((dispose) => {
        const read = factory();
        const seen: T[] = [];
        createComputed(() => seen.push(read()));
        return { seen, dispose };
    });
}

/** Last observed value. (`Array.prototype.at` is ES2022; this repo targets ES2021.) */
const last = <T>(xs: T[]): T | undefined => xs[xs.length - 1];

/** Let Solid's onMount effects flush. */
const flush = async () => {
    await Promise.resolve();
    await Promise.resolve();
};

describe('useWriteEnabled — tri-state capability', () => {
    it('seeds `undefined` on the first synchronous read, even when the core already knows', () => {
        coreWriteEnabled.set(true); // core holds a concrete value...

        createRoot((dispose) => {
            // ...but the first render must not adopt it: the server rendered nothing.
            expect(useWriteEnabled()()).toBeUndefined();
            dispose();
        });
    });

    it('never defaults an unresolved capability to false (GATE-8)', () => {
        coreWriteEnabled.set(undefined);

        createRoot((dispose) => {
            const writeEnabled = useWriteEnabled();
            expect(writeEnabled()).not.toBe(false);
            expect(writeEnabled()).toBeUndefined();
            dispose();
        });
    });

    it('adopts the core value after mount, then tracks later changes', async () => {
        coreWriteEnabled.set(false);

        const { seen, dispose } = mountAndRead(() => useWriteEnabled());
        expect(seen[0]).toBeUndefined(); // pre-mount seed

        await flush();
        expect(last(seen)).toBe(false); // adopted after mount

        coreWriteEnabled.set(true);
        expect(last(seen)).toBe(true); // tracks onward

        dispose();
    });

    it('preserves `false` as distinct from `undefined` once resolved', async () => {
        coreWriteEnabled.set(false);
        const { seen, dispose } = mountAndRead(() => useWriteEnabled());
        await flush();

        // A resolved `false` is a real answer and must be observable as one.
        expect(last(seen)).toBe(false);
        expect(last(seen)).not.toBeUndefined();
        dispose();
    });

    it('stops observing the core once the owning root is disposed', async () => {
        coreWriteEnabled.set(false);
        const { seen, dispose } = mountAndRead(() => useWriteEnabled());
        await flush();

        const settled = seen.length;
        dispose();

        coreWriteEnabled.set(true);
        coreWriteEnabled.set(false);

        expect(seen.length).toBe(settled); // no observation survives disposal
    });
});
