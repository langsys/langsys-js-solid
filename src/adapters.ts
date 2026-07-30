import { createComputed, createRoot, createSignal as createSolidSignal, getOwner, onCleanup } from 'solid-js';
import type { Accessor } from 'solid-js';
import { createSignal, type Signal } from 'langsys-js-typescript';

/**
 * Subscribe the current reactive scope to a base-SDK `Signal<T>` and return a
 * Solid `Accessor<T>` that updates whenever the signal changes.
 *
 * This is the Solid mirror of Svelte's `$store` auto-subscription, React's
 * `useSignal` (`useSyncExternalStore`), and Vue's `useSignal` (shallowRef).
 * The base SDK's `subscribe` fires synchronously with the current value and
 * returns an unsubscribe function — the same subscribable contract Solid's
 * own `from()` accepts — but this helper seeds from `.get()` first so the
 * accessor is `Accessor<T>`, not `Accessor<T | undefined>`.
 *
 * The setter is always called with an updater-thunk (`() => next`) because
 * signal payloads can themselves be functions (`TFunction`) — a bare function
 * value would be misread as an updater by Solid.
 *
 * When called under an owner (component body, `createRoot`), the subscription
 * is disposed with it. Outside any owner (module level), the subscription
 * lives for the app's lifetime — fine for the SDK's global singletons, but
 * prefer calling from a component.
 */
export function useSignal<T>(signal: Signal<T>): Accessor<T> {
    const [value, setValue] = createSolidSignal<T>(signal.get());
    const unsubscribe = signal.subscribe((next) => setValue(() => next));
    if (getOwner()) onCleanup(unsubscribe);
    return value;
}

/**
 * Create a reactive `Signal<string>` to hold the user's selected locale — the
 * Solid analog of Svelte's `writable('en-US')`.
 *
 * Pass the result as `UserLocaleStore` to `LangsysApp.init`, read it reactively
 * with `useSignal(store)` (or use the all-in-one `useLocaleStore` primitive),
 * and switch locale with `store.set('fr-FR')`. The base SDK only ever reads and
 * subscribes to it — it never writes.
 *
 * Locale identifiers are canonicalized to BCP 47 by the base SDK (v0.3.0+), so
 * `'en-us'` still works on input — but `currentlyLoadedLocale` always emits the
 * canonical form (`'en-US'`), so prefer canonical casing to keep comparisons
 * against it straightforward.
 */
export function createLocaleStore(initial = 'en-US'): Signal<string> {
    return createSignal<string>(initial);
}

/**
 * Adapt an existing Solid signal pair into the SDK's `Signal<string>` contract
 * — the Solid analog of the Svelte wrapper's `adaptStore(writable)` and Vue's
 * `refToLocaleSource(ref)`.
 *
 * Use this when your app already owns the locale as a Solid signal (a global
 * store, a context) and you want the SDK to react to it directly:
 *
 *   const [locale, setLocale] = createSignal('en-US');
 *   LangsysApp.init({ ..., UserLocaleStore: solidToLocaleSource(locale, setLocale) });
 *   setLocale('fr-FR'); // SDK loads French
 *
 * Each `subscribe` spins up its own `createRoot` + `createComputed`, which
 * preserves the Signal contract the SDK relies on (synchronous notification,
 * immediate first fire) and reacts to ANY write to the Solid signal — the
 * app's own `setLocale` included, not just writes through this adapter. The
 * returned unsubscriber disposes the root.
 */
export function solidToLocaleSource(get: Accessor<string>, set: (value: string) => void): Signal<string> {
    return {
        get: () => get(),
        set: (value) => set(value),
        update: (fn) => set(fn(get())),
        subscribe: (run) => {
            return createRoot((dispose) => {
                createComputed(() => run(get()));
                return dispose;
            });
        },
    };
}
