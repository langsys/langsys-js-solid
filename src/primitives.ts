import { currentlyLoadedLocale, sTranslations, tSignal, writeEnabled } from 'langsys-js-typescript';
import type { Signal, TFunction, iCategories } from 'langsys-js-typescript';
import { createSignal as createSolidSignal, onCleanup, onMount } from 'solid-js';
import type { Accessor } from 'solid-js';
import { createLocaleStore, useSignal } from './adapters.js';

/**
 * The current translation function as a Solid accessor, updating whenever
 * translations or the loaded locale change. This is the Solid analog of
 * Svelte's `$t` store read, React's `useT()`, and Vue's `useT()`.
 *
 *   const t = useT();
 *   // JSX: <h1>{t()('Welcome to my app', 'UI')}</h1>
 *
 * The phrase is both the lookup key and the base-language default. Signature:
 * `t()(phrase, category?, params?)`. Placeholder names in the phrase are
 * type-checked against the params object at the call site.
 */
export function useT(): Accessor<TFunction> {
    return useSignal(tSignal);
}

/**
 * The locale whose translations are currently loaded. This lags the
 * user-selected locale (`UserLocaleStore`) until the fetch for the new locale
 * settles, which makes it the right value to gate "translations are ready" UI on.
 */
export function useCurrentLocale(): Accessor<string> {
    return useSignal(currentlyLoadedLocale);
}

/**
 * The raw translation catalog. Rarely needed in app code — prefer `useT()`.
 * Exposed for advanced cases (inspecting which categories/phrases are loaded).
 */
export function useTranslations(): Accessor<iCategories> {
    return useSignal(sTranslations);
}

/**
 * Whether this session may register content — the server's answer, surfaced
 * unchanged, as a Solid accessor.
 *
 * **Tri-state, and the third state is load-bearing:**
 *
 *   - `undefined` — not decided yet. Either authorization has not resolved, or
 *     this is a server render, or the client has not finished hydrating.
 *   - `true` — the server said this session may write.
 *   - `false` — the server said it may not.
 *
 * `undefined` is never collapsed into `false` (GATE-8): "we have not heard
 * yet" and "you may not write" are different answers, and treating the first
 * as the second turns a pending check into a permanent denial. Gate optimistic
 * UI on `=== true`, and render a pending state for `undefined`:
 *
 *   const writeEnabled = useWriteEnabled();
 *   // JSX: <Show when={writeEnabled() !== undefined} fallback={<Spinner />}>
 *   //        <Show when={writeEnabled()}>…editing UI…</Show>
 *   //      </Show>
 *
 * **Why this does not go through `useSignal`.** `useSignal` seeds
 * synchronously from `signal.get()` in the component body, which is exactly
 * the hazard here. Capability is *browser-authoritative*: the same key answers
 * differently from different addresses (GATE-1), so the server cannot know it
 * and never renders it. A session that authorizes before hydration completes
 * would seed a concrete value into markup the server rendered as unknown, and
 * the first client render would disagree with the server's HTML.
 *
 * The house rule the three sibling bindings share is that **the first client
 * render must agree with what the server rendered** — React pins its server
 * snapshot, Vue gates on `pastHydration`, Svelte defers past first subscribe.
 * Solid's idiom for the same principle is `onMount`: it never runs under SSR,
 * and on the client it runs after the hydration pass. So the accessor seeds
 * `undefined`, and only adopts the core's value once mounted. The value itself
 * is always the core's — this is timing, not meaning (BIND-1).
 *
 * Consequence worth knowing: outside a reactive owner there is no mount, so
 * the accessor stays `undefined` forever. Call it from a component.
 */
export function useWriteEnabled(): Accessor<boolean | undefined> {
    const [value, setValue] = createSolidSignal<boolean | undefined>(undefined);

    onMount(() => {
        onCleanup(writeEnabled.subscribe((next) => setValue(next)));
    });

    return value;
}

/**
 * All-in-one convenience for the user-locale store. Creates one
 * `Signal<string>` (the Solid analog of Svelte's `writable`), subscribes the
 * current owner to it, and returns `{ locale, setLocale, store }`.
 *
 *   const { locale, setLocale, store } = useLocaleStore('en-US');
 *   LangsysApp.init({ projectid, key, UserLocaleStore: store });
 *
 *   // JSX: <select value={locale()} onChange={(e) => setLocale(e.currentTarget.value)}>…
 *
 * A Solid component body runs once, so the store is stable for the component's
 * lifetime and safe to hand to `LangsysApp.init`.
 */
export function useLocaleStore(initial = 'en-US'): {
    locale: Accessor<string>;
    setLocale: (locale: string) => void;
    store: Signal<string>;
} {
    const store = createLocaleStore(initial);
    const locale = useSignal(store);
    return { locale, setLocale: store.set, store };
}
