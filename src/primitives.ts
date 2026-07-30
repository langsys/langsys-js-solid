import { currentlyLoadedLocale, sTranslations, tSignal } from 'langsys-js-typescript';
import type { Signal, TFunction, iCategories } from 'langsys-js-typescript';
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
