import { describe, expect, it } from 'vitest';
import { createComputed, createRoot, createSignal as createSolidSignal } from 'solid-js';
import { adaptWriteGrant } from './adapters.js';

/**
 * GRANT-1 / GRANT-2 / BIND-1 — the grant adapter.
 *
 * BIND-1 names this exact adapter as the trap: *"shape-adaptation that quietly
 * narrows a guarantee is reimplementation wearing a costume. Converting a store
 * into a grant provider function must resolve the store per call — snapshotting
 * it at init looks like a pure adapter and silently produces a grant that can
 * never refresh."*
 *
 * Grants live ~5 minutes; an app inits once and runs for hours (GRANT-1). So
 * the assertion that matters is not "the adapter returns a function" — it is
 * that the function it returns reads the source **again on every call**. A
 * snapshotting adapter passes every shape test and fails in production minutes
 * after init, silently degrading every later write to read-only.
 *
 * A Solid `Accessor<string>` is structurally identical to the core's callback
 * arm (`() => string | null | undefined`), so the adapter cannot and need not
 * tell them apart at runtime — both are resolved per call. The union exists to
 * document that a Solid signal is a first-class grant source.
 */

describe('adaptWriteGrant — per-call resolution (GRANT-2)', () => {
    it('passes a bare string through unchanged', () => {
        expect(adaptWriteGrant('tok_static')).toBe('tok_static');
    });

    it('passes `undefined` through unchanged', () => {
        expect(adaptWriteGrant(undefined)).toBeUndefined();
    });

    it('resolves a Solid accessor on EVERY call, never snapshotting at adapt time', () => {
        createRoot((dispose) => {
            const [token, setToken] = createSolidSignal<string | null>('tok_1');

            // Adapted once, at "init" — the moment a snapshotting adapter would freeze.
            const grant = adaptWriteGrant(token) as () => string | null | undefined;

            expect(grant()).toBe('tok_1');

            setToken('tok_2'); // grant refreshes, as it does every ~5 minutes
            expect(grant()).toBe('tok_2');

            setToken(null); // logged out
            expect(grant()).toBeNull();

            setToken('tok_3'); // logged back in
            expect(grant()).toBe('tok_3');

            dispose();
        });
    });

    it('resolves a plain callback on every call too', () => {
        let n = 0;
        const grant = adaptWriteGrant(() => `tok_${++n}`) as () => string;
        expect(grant()).toBe('tok_1');
        expect(grant()).toBe('tok_2');
        expect(grant()).toBe('tok_3');
    });

    it('carries an async provider through without awaiting it', async () => {
        const grant = adaptWriteGrant(async () => 'tok_async') as () => Promise<string>;
        const result = grant();
        expect(result).toBeInstanceOf(Promise);
        await expect(result).resolves.toBe('tok_async');
    });

    it('does not capture a reactive dependency when read inside a tracking scope', () => {
        // The core calls the provider from its own (non-Solid) code. If such a
        // call ever sits inside a Solid computation, reading the accessor raw
        // would subscribe that computation to the token and re-run it on every
        // refresh. `untrack` keeps the grant a value read, not a signal.
        createRoot((dispose) => {
            const [token, setToken] = createSolidSignal('tok_1');
            const grant = adaptWriteGrant(token) as () => string;

            let runs = 0;
            createComputed(() => {
                runs++;
                grant();
            });

            const before = runs;
            setToken('tok_2');
            expect(runs).toBe(before); // no re-run: the read was untracked
            expect(grant()).toBe('tok_2'); // ...but the value is still current

            dispose();
        });
    });
});
