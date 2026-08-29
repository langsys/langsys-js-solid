import { afterEach, describe, expect, it } from 'vitest';
import { Show, createRoot } from 'solid-js';
import { render } from 'solid-js/web';
import {
    createSignal as coreCreateSignal,
    currentlyLoadedLocale,
    sTranslations,
    writeEnabled,
} from 'langsys-js-typescript';
import type { iCategories, iTranslations } from 'langsys-js-typescript';
import { useSignal } from './adapters.js';
import { useT, useWriteEnabled } from './primitives.js';

/**
 * Rendered-template tests — "the signal is correct" and "the user sees it" are
 * different facts.
 *
 * ## Why this file exists
 * The Angular lane shipped a capability signal that held the right value while
 * the framework never repainted: `afterNextRender` ran outside the zone, so no
 * change detection was scheduled. Their entire suite read the signal directly,
 * so nothing could see it. The bug was invisible by construction, not by
 * oversight (Reviewer, `838-intake-solid`).
 *
 * Solid has no zone and no change detection, so that exact failure cannot
 * occur here — but the equivalent one can, from the other side: this binding's
 * updates arrive from **outside Solid's ownership**, in a base-SDK `subscribe`
 * callback, and pass through **two `===` equality gates** (the core's
 * `Object.is` guard and Solid's own `createSignal` default) before reaching a
 * template. A value can be correct in the accessor and still never repaint.
 *
 * So every assertion here goes through `render()` and reads
 * `container.textContent` — the DOM, not the signal.
 *
 * The SSR half lives in `ssr.test.tsx`: this file runs against Solid's BROWSER
 * build (forced by `vitest.config.mts`, without which the reactive graph is
 * inert and these tests would pass vacuously), and `renderToString` is a
 * non-functional stub there.
 */

const containers: HTMLElement[] = [];
const disposers: Array<() => void> = [];

/** Render into a detached container and return its live text. */
function mount(component: () => unknown) {
    const container = document.createElement('div');
    document.body.appendChild(container);
    containers.push(container);
    disposers.push(render(component as never, container));
    return {
        get text() {
            return container.textContent ?? '';
        },
    };
}

/** Build a well-formed catalog. `iCategories` requires `__uncategorized__`. */
function catalog(category: string, entries: Record<string, string>): iCategories {
    const cat = { __category__: category, __symbol__: category, ...entries } as iTranslations;
    const uncategorized = { __category__: '__uncategorized__', __symbol__: '__uncategorized__' } as iTranslations;
    return { __uncategorized__: uncategorized, [category]: cat };
}

/** Let Solid's onMount effects flush. */
const flush = async () => {
    await Promise.resolve();
    await Promise.resolve();
};

afterEach(() => {
    while (disposers.length) disposers.pop()?.();
    while (containers.length) containers.pop()?.remove();
});

describe('useWriteEnabled — through a rendered template', () => {
    it('paints the undecided state first, then repaints when capability resolves', async () => {
        writeEnabled.set(undefined);

        const view = mount(() => {
            const enabled = useWriteEnabled();
            return (
                <Show when={enabled() !== undefined} fallback={<span>checking</span>}>
                    <Show when={enabled()} fallback={<span>read-only</span>}>
                        <span>editable</span>
                    </Show>
                </Show>
            );
        });

        // Core holds `undefined`, so the mounted value is `undefined` too: the
        // template stays on its undecided branch rather than guessing.
        expect(view.text).toBe('checking');

        await flush();
        expect(view.text).toBe('checking'); // still undecided — never guesses `false`

        writeEnabled.set(false);
        expect(view.text).toBe('read-only'); // REPAINTS on a real answer

        writeEnabled.set(true);
        expect(view.text).toBe('editable'); // REPAINTS, not merely "signal is true"

        writeEnabled.set(false);
        expect(view.text).toBe('read-only');
    });

    it('repaints from a core emit that originates outside Solid ownership', async () => {
        // The core's subscribe callback fires from plain (non-Solid) code. This
        // is the path Angular's bug lived on: value arrives, framework never
        // notices. Asserted at the DOM.
        writeEnabled.set(false);
        const view = mount(() => {
            const enabled = useWriteEnabled();
            return <span>{String(enabled())}</span>;
        });
        await flush();
        expect(view.text).toBe('false');

        writeEnabled.set(true);
        expect(view.text).toBe('true');
    });
});

describe('useT — through a rendered template', () => {
    it('repaints translated text when the catalog changes', () => {
        sTranslations.set(catalog('Greeting', {}));
        currentlyLoadedLocale.set('en-us');

        const view = mount(() => {
            const t = useT();
            return <span>{t()('Hello', 'Greeting')}</span>;
        });

        expect(view.text).toBe('Hello'); // base-language default

        // A catalog arriving is the event a consumer must repaint on.
        sTranslations.set(catalog('Greeting', { Hello: 'Hola' }));
        currentlyLoadedLocale.set('es-es');

        expect(view.text).toBe('Hola'); // REPAINTED
    });

    it('repaints on locale change alone', () => {
        sTranslations.set(catalog('Greeting', { Hello: 'Bonjour' }));
        currentlyLoadedLocale.set('en-us');

        const view = mount(() => {
            const t = useT();
            return <span>{t()('Hello', 'Greeting')}</span>;
        });
        const first = view.text;

        currentlyLoadedLocale.set('fr-fr');
        expect(view.text).toBe('Bonjour');
        expect(view.text).not.toBe(first === 'Bonjour' ? '' : first);
    });
});

describe('the equality gate, proven at the DOM (BIND-5)', () => {
    /**
     * The `open` BIND-5 row measured this with `createComputed`. Re-proved here
     * through a rendered template, because the consequence that matters is not
     * "the computation did not re-run" — it is "the user's screen froze".
     *
     * `useT()`'s correctness rests entirely on the core minting a fresh
     * `TFunction` identity per emit (`translations.ts:97-99`). This asserts what
     * a stable identity would do to a real rendered component.
     */
    it('POSITIVE CONTROL: a fresh identity per emit repaints', () => {
        const sig = coreCreateSignal<() => string>(() => 'v1');
        const view = mount(() => {
            const value = useSignal(sig);
            return <span>{value()()}</span>;
        });

        expect(view.text).toBe('v1');
        sig.set(() => 'v2');
        expect(view.text).toBe('v2'); // repaints
    });

    it('HAZARD: a stable identity with mutated state leaves the DOM frozen', () => {
        let backing = 'v1';
        const stableT = () => backing; // one identity, forever
        const sig = coreCreateSignal<() => string>(stableT);

        const view = mount(() => {
            const value = useSignal(sig);
            return <span>{value()()}</span>;
        });

        expect(view.text).toBe('v1');

        backing = 'v2';
        sig.set(stableT); // same reference -> swallowed by the equality gates
        expect(view.text).toBe('v1'); // FROZEN: the user still sees the old string

        backing = 'v3';
        sig.set(stableT);
        expect(view.text).toBe('v1'); // still frozen
    });
});

describe('WIRE-3 — locale casing, measured against the core (not a double)', () => {
    /**
     * Not asserted against a hand-written double. A double encodes whatever
     * casing its author assumed, and assertions written against it then demand
     * that form — which is how the Angular lane ended up asserting the exact
     * casing WIRE-3 forbids. These run the real `canonicalizeLocale` from the
     * resolved core, side by side with what this binding does.
     */
    it('the core canonicalizes to LOWERCASE, both halves', async () => {
        const { canonicalizeLocale } = await import('langsys-js-typescript');
        expect(canonicalizeLocale('en-US')).toBe('en-us');
        expect(canonicalizeLocale('es-ES')).toBe('es-es');
        expect(canonicalizeLocale('ES-es')).toBe('es-es');
        expect(canonicalizeLocale('fr-FR')).toBe('fr-fr');
    });

    it('the locale store round-trips input VERBATIM — it must not canonicalize (BIND-1)', () => {
        createRoot((dispose) => {
            const store = coreCreateSignal<string>('en-US');
            const locale = useSignal(store);
            // The binding is a transparent container. Canonicalizing here would be
            // the binding adapting meaning, and would diverge from the core the
            // moment its rule changed.
            expect(locale()).toBe('en-US');
            store.set('es-ES');
            expect(locale()).toBe('es-ES');
            dispose();
        });
    });

    it('so a consumer comparing against currentlyLoadedLocale must compare canonicalized', async () => {
        const { canonicalizeLocale } = await import('langsys-js-typescript');
        // The trap this pins: `currentlyLoadedLocale` emits the canonicalized
        // form, so a raw `=== 'en-US'` comparison never matches. Documented in
        // createLocaleStore's docstring, which previously claimed the opposite.
        currentlyLoadedLocale.set(canonicalizeLocale('en-US'));
        expect(currentlyLoadedLocale.get()).toBe('en-us');
        expect(currentlyLoadedLocale.get()).not.toBe('en-US');
    });
});
