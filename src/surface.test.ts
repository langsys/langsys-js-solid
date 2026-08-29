import { describe, expect, it } from 'vitest';
import { LangsysApp as coreLangsysApp } from 'langsys-js-typescript';
import { LangsysApp } from './index.js';

/**
 * BIND-6 — wrap the narrowest surface possible.
 *
 * ## The bug this test exists to prevent
 * This binding used to export a hand-written `LangsysAppSolid` class that
 * **enumerated** its delegating methods — one `public foo() { return
 * _LangsysApp.foo(); }` per core method. Every method the core added after that
 * class was written silently vanished from the binding's surface, with a green
 * typecheck and a green suite, because nothing referenced what was missing.
 *
 * That is how the entire 838 capability surface went absent here: `setWriteGrant`
 * existed on the core and was simply not on the list. Five other core methods
 * (`applyAuthorization`, `getUserLanguagePreferences`, `parseAcceptLanguageHeader`,
 * `findBestLocaleMatch`, `resolveLocale`) had gone the same way unnoticed.
 *
 * Adding `setWriteGrant` to that class would have fixed the symptom and left the
 * mechanism running. So the fix was structural — forward by reference — and this
 * test guards the structure rather than any particular method name: it asserts
 * that **every** core method is reachable, so the next core addition cannot go
 * missing quietly. A test naming only today's methods would rot into the same
 * blind spot.
 */

/** Methods the binding deliberately overrides — narrow, and each for a stated reason. */
const INTENTIONAL_OVERRIDES = new Set([
    'init', // types UserLocaleStore as a Solid-friendly Signal + adapts writeGrant
    'setWriteGrant', // adapts a Solid Accessor into the core's WriteGrant union
]);

function coreMethodNames(): string[] {
    const proto = Object.getPrototypeOf(coreLangsysApp) as object;
    const core = coreLangsysApp as unknown as Record<string, unknown>;
    return Object.getOwnPropertyNames(proto).filter(
        (name) => name !== 'constructor' && typeof core[name] === 'function'
    );
}

describe('BIND-6 — the binding forwards the core surface by reference', () => {
    it('has a positive control: the core exposes methods to forward', () => {
        // If this is empty, every assertion below would pass vacuously.
        expect(coreMethodNames().length).toBeGreaterThan(10);
    });

    it.each(coreMethodNames())('exposes core method `%s`', (name) => {
        expect(typeof (LangsysApp as unknown as Record<string, unknown>)[name]).toBe('function');
    });

    it('forwards non-overridden methods by REFERENCE — the same function object', () => {
        const forwarded = coreMethodNames().filter((n) => !INTENTIONAL_OVERRIDES.has(n));
        expect(forwarded.length).toBeGreaterThan(0); // positive control

        for (const name of forwarded) {
            const mine = (LangsysApp as unknown as Record<string, unknown>)[name];
            const theirs = (coreLangsysApp as unknown as Record<string, unknown>)[name];
            // Identity, not equivalence: a re-implementation or a bound copy fails here.
            expect(mine, `\`${name}\` is not the core's own function`).toBe(theirs);
        }
    });

    it('overrides exactly the two methods it means to, and no more', () => {
        const overridden = coreMethodNames().filter((name) => {
            const mine = (LangsysApp as unknown as Record<string, unknown>)[name];
            const theirs = (coreLangsysApp as unknown as Record<string, unknown>)[name];
            return mine !== theirs;
        });
        expect(new Set(overridden)).toEqual(INTENTIONAL_OVERRIDES);
    });

    it('exposes the 838 surface that the enumerating class dropped', () => {
        expect(typeof LangsysApp.setWriteGrant).toBe('function');
    });

    it('forwards core state properties too, not just methods', () => {
        // `Translations` and `debug` are own properties on the core singleton;
        // an enumerating wrapper had to re-declare each as a getter.
        expect(LangsysApp.Translations).toBe(coreLangsysApp.Translations);
        expect(LangsysApp.debug).toBe(coreLangsysApp.debug);
    });
});

describe('BIND-1 — `writeEnabled` is deliberately NOT re-exported raw', () => {
    /**
     * Reading the core signal raw resolves synchronously, which is exactly the
     * hydration hazard `useWriteEnabled()` exists to avoid: a session that
     * authorizes before hydration would seed a concrete value into markup the
     * server rendered as unknown.
     *
     * The reasoning lives at the export site in `index.ts`, but a comment does
     * not fail a build. This does — a future maintainer adding `writeEnabled`
     * to that raw-signal export line lands red rather than green.
     */
    it('does not export the raw core signal', async () => {
        const publicSurface = (await import('./index.js')) as Record<string, unknown>;
        expect(publicSurface.writeEnabled).toBeUndefined();
    });

    it('has a positive control: the core does export it, and the supported surface exists', async () => {
        // Without this, the assertion above would pass just as well if the core
        // had no `writeEnabled` at all, or if the import had silently failed.
        const core = (await import('langsys-js-typescript')) as Record<string, unknown>;
        expect(core.writeEnabled).toBeDefined();

        const publicSurface = (await import('./index.js')) as Record<string, unknown>;
        expect(typeof publicSurface.useWriteEnabled).toBe('function');
    });
});
