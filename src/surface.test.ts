import { describe, expect, it } from 'vitest';
import { LangsysApp as coreLangsysApp } from 'langsys-js-typescript';
import { LangsysApp } from './index.js';

/**
 * BIND-6 — wrap the narrowest surface possible.
 *
 * ## The bug this test exists to prevent
 * This binding used to export a hand-written `LangsysAppSolid` class that
 * **enumerated** its delegating methods — one `public foo() { return
 * _LangsysApp.foo(); }` per core method. A public method the core added after
 * that class was written would silently vanish from the binding's surface, with
 * a green typecheck and a green suite, because nothing referenced what was
 * missing. `setWriteGrant` — the whole write-grant surface — did exactly that.
 *
 * ## Correction (2026-09-09), recorded because the mistake generalises
 * An earlier version of this comment said **six** members had been dropped,
 * naming `applyAuthorization`, `getUserLanguagePreferences`,
 * `parseAcceptLanguageHeader`, `findBestLocaleMatch` and `resolveLocale`
 * alongside `setWriteGrant`. Those five are `private` in the core and appear in
 * no `.d.ts`; they were never API. The claim came from the runtime prototype
 * walk below, and **TypeScript's `private` is erased at runtime** — so
 * `getOwnPropertyNames` surfaces implementation detail and cannot distinguish
 * it from public surface. The walk was right; the conclusion drawn from it was
 * not. Exactly one public member was genuinely dropped.
 *
 * The prototype walk is still the right instrument for what it actually tests —
 * *uniform forwarding*, i.e. that nothing is dropped on the way through. It is
 * simply not a statement about API. Rows generated from it that name a
 * core-private member are labelled as such below, so no reader takes them for
 * surface.
 */

/** Members this binding deliberately overrides — narrow, each for a stated reason. */
const INTENTIONAL_OVERRIDES = new Set([
    'init', // types UserLocaleStore as a Solid-friendly Signal + adapts writeGrant
    'setWriteGrant', // adapts a Solid Accessor into the core's WriteGrant union
]);

/**
 * Core members declared `private` in `langsys-app.ts`. They are erased at
 * runtime, so the prototype walk sees them and this binding forwards them
 * uniformly — but they are **core-private, forwarded uniformly, not API**.
 * Nothing here presents them as surface, and the exported type excludes them
 * (pinned by `src/type-surface.test.ts`).
 */
const CORE_PRIVATE = new Set([
    'applyAuthorization',
    'getUserLanguagePreferences',
    'parseAcceptLanguageHeader',
    'findBestLocaleMatch',
    'resolveLocale',
    'noticeUnusableWriteCapability',
]);

const label = (name: string) =>
    CORE_PRIVATE.has(name) ? `${name} [core-private, forwarded uniformly, not API]` : name;

function coreMethodNames(): string[] {
    const proto = Object.getPrototypeOf(coreLangsysApp) as object;
    const core = coreLangsysApp as unknown as Record<string, unknown>;
    return Object.getOwnPropertyNames(proto).filter(
        (name) => name !== 'constructor' && typeof core[name] === 'function'
    );
}

describe('BIND-6 — the binding forwards the core surface', () => {
    it('has a positive control: the core exposes methods to forward', () => {
        // If this is empty, every assertion below would pass vacuously.
        expect(coreMethodNames().length).toBeGreaterThan(10);
    });

    it.each(coreMethodNames().map((n) => [label(n), n]))('forwards %s', (_label, name) => {
        expect(typeof (LangsysApp as unknown as Record<string, unknown>)[name as string]).toBe('function');
    });

    it('forwards non-overridden members as bound delegates of the core, not reimplementations', () => {
        const forwarded = coreMethodNames().filter((n) => !INTENTIONAL_OVERRIDES.has(n));
        expect(forwarded.length).toBeGreaterThan(0); // positive control

        for (const name of forwarded) {
            const mine = (LangsysApp as unknown as Record<string, unknown>)[name] as (...a: unknown[]) => unknown;
            const theirs = (coreLangsysApp as unknown as Record<string, unknown>)[name] as (...a: unknown[]) => unknown;
            // A bound copy is not identity-equal to its target, so identity is
            // the wrong probe now. `Function.prototype.bind` preserves `name`
            // as `bound <original>` and arity, which a reimplementation would
            // not: it would carry its own name and its own parameter list.
            expect(mine.name, `${label(name)} is not a bound delegate`).toBe(`bound ${theirs.name}`);
        }
    });

    it('returns a STABLE reference per member — binding on every read would not', () => {
        // Minting a new bound function per property read silently breaks
        // anything comparing function identity: a dependency array, a
        // removeEventListener, a memo key. The bound cache is what prevents it.
        for (const name of coreMethodNames()) {
            const a = (LangsysApp as unknown as Record<string, unknown>)[name];
            const b = (LangsysApp as unknown as Record<string, unknown>)[name];
            expect(a, `${label(name)} is not referentially stable`).toBe(b);
        }
    });

    it('overrides exactly the members it means to, and no more', () => {
        const overridden = coreMethodNames().filter((name) => {
            const mine = (LangsysApp as unknown as Record<string, unknown>)[name] as { name?: string };
            const theirs = (coreLangsysApp as unknown as Record<string, unknown>)[name] as { name?: string };
            // An override is ours, so it is NOT a `bound <core name>` delegate.
            return mine?.name !== `bound ${theirs?.name}`;
        });
        expect(new Set(overridden)).toEqual(INTENTIONAL_OVERRIDES);
    });

    it('exposes the one public member the enumerating class actually dropped', () => {
        expect(typeof LangsysApp.setWriteGrant).toBe('function');
    });

    it('forwards core state properties too, not just methods', () => {
        // `Translations` and `debug` are own properties on the core singleton;
        // an enumerating wrapper had to re-declare each as a getter.
        expect(LangsysApp.Translations).toBe(coreLangsysApp.Translations);
        expect(LangsysApp.debug).toBe(coreLangsysApp.debug);
    });

    it('answers `in` for overrides as well as forwarded members', () => {
        expect('setWriteGrant' in LangsysApp).toBe(true); // override
        expect('getCountries' in LangsysApp).toBe(true); // forwarded
        expect('noSuchMember' in LangsysApp).toBe(false); // control
    });
});

describe('BIND-6 — destructuring survives, and that is measured', () => {
    /**
     * The shape before this branch was a wrapper class, whose own methods closed
     * over the core, so `const { m } = LangsysApp` worked. An **unbound** proxy
     * breaks that: the call site loses `this` and the core throws
     * `Cannot read properties of undefined`.
     *
     * Measured, not assumed — that is why functions are bound before being
     * handed out. Note the core singleton itself does NOT survive destructuring;
     * this binding is deliberately more forgiving than the object it wraps, on
     * calling convention only. It adapts no meaning: same function, same core
     * state, same result (BIND-1).
     */
    it('survives destructuring of a SYNC method whose body uses `this`', () => {
        const { detectPreferredLocale } = LangsysApp;
        expect(() => detectPreferredLocale('en-US,en;q=0.9', ['en-US'])).not.toThrow();
    });

    it('has a positive control: the same call works through the object', () => {
        expect(() => LangsysApp.detectPreferredLocale('en-US,en;q=0.9', ['en-US'])).not.toThrow();
    });

    it('CONTROL: the raw core method really does need its `this`', () => {
        // Without this, the assertions above could pass against a method that
        // never touched `this` and would prove nothing about binding.
        const raw = (coreLangsysApp as unknown as Record<string, unknown>).detectPreferredLocale as (
            ...a: unknown[]
        ) => unknown;
        expect(() => raw('en-US,en;q=0.9', ['en-US'])).toThrow(/undefined/);
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
