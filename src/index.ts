/**
 * langsys-js-solid — idiomatic SolidJS binding over `langsys-js-typescript`.
 *
 * The base SDK's `Signal<T>` already satisfies Solid's subscribable contract
 * (`from(tSignal)` works as-is), so this binding is the thinnest of the four:
 * a seeded `useSignal` accessor, three derived primitives, and mount/destroy
 * component glue.
 *
 * Public API:
 *   - `LangsysApp` — the base SDK's singleton forwarded **by reference**, with
 *     two narrow overrides: `init` (accepts a `Signal<string>` for the user
 *     locale and a Solid accessor for `writeGrant`) and `setWriteGrant`.
 *   - Primitives — `useT`, `useCurrentLocale`, `useTranslations`,
 *     `useWriteEnabled`, `useLocaleStore`, and the low-level `useSignal`. These
 *     are the reactive layer; in components prefer them over the raw signals.
 *   - `createLocaleStore` — make the user-locale store (Solid analog of
 *     Svelte's `writable`); `solidToLocaleSource` — adapt an existing signal;
 *     `adaptWriteGrant` — resolve a Solid accessor as a write grant per call.
 *   - `Translate` / `Phrase` / `DontTranslate` — components wrapping the
 *     vanilla DOM handlers. Client-only (they build real DOM nodes).
 *   - Raw signals `t` / `currentlyLoadedLocale` / `sTranslations` — re-exported
 *     for advanced/direct subscription outside Solid's reactivity (they also
 *     work with Solid's own `from()`).
 */

import { adaptWriteGrant, type WriteGrantSource } from './adapters.js';
import {
    LangsysApp as _LangsysApp,
    type ExtractParamKeys,
    type ParamPrimitive,
    type ParamsFor,
    type Signal,
    type TArgs,
    type TFunction,
    type TranslationParams,
    type WriteGrant,
    type iCategories,
    type iContentBlock,
    type iCountry,
    type iCountryDialCode,
    type iCountryList,
    type iCurrency,
    type iCurrencyList,
    type iLangsysInitConfig as iVanillaInitConfig,
    type iLangsysResponse,
    type iLanguageName,
    type iLocaleData,
    type iLocaleDefault,
    type iLocaleFlat,
    type iProject,
    type iTranslations,
} from 'langsys-js-typescript';

// Reactive primitives (raw signals) — re-exported for advanced/direct
// subscription. `tSignal` is exposed under the friendlier name `t`. In
// components, prefer the primitives (`useT`, `useCurrentLocale`, …).
export { currentlyLoadedLocale, createSignal, sTranslations, tSignal as t } from 'langsys-js-typescript';

// Locale canonicalization (BCP 47) — the SDK canonicalizes all locale input
// (v0.3.0+); re-exported so consumers can normalize their own values the same
// way before comparing against `useCurrentLocale()` / `detectPreferredLocale()`.
export { canonicalizeLocale } from 'langsys-js-typescript';

// API client (vanilla — no Solid concerns)
export { LangsysAppAPI } from 'langsys-js-typescript';

// Primitives + adapters (the Solid-idiomatic reactive layer)
export { adaptWriteGrant, createLocaleStore, solidToLocaleSource, useSignal } from './adapters.js';
export type { WriteGrantSource } from './adapters.js';
export { useCurrentLocale, useLocaleStore, useT, useTranslations, useWriteEnabled } from './primitives.js';

// Components
export { Translate, type TranslateProps } from './components/Translate.js';
export { Phrase, type PhraseProps } from './components/Phrase.js';
export { DontTranslate, type DontTranslateProps } from './components/DontTranslate.js';

// Type re-exports — these are framework-agnostic, so consumers can rely on them
// directly without reaching into `langsys-js-typescript`.
export type {
    ExtractParamKeys,
    ParamPrimitive,
    ParamsFor,
    Signal,
    TArgs,
    TFunction,
    TranslationParams,
    WriteGrant,
    iCategories,
    iContentBlock,
    iCountry,
    iCountryDialCode,
    iCountryList,
    iCurrency,
    iCurrencyList,
    iLangsysResponse,
    iLanguageName,
    iLocaleData,
    iLocaleDefault,
    iLocaleFlat,
    iProject,
    iTranslations,
};

/**
 * Solid-flavored init config. Identical to the base SDK's config except for two
 * fields the Solid idiom widens:
 *
 *   - `UserLocaleStore` is a `Signal<string>` — create one with
 *     `createLocaleStore()`, take one from `useLocaleStore`, or adapt an
 *     existing Solid signal with `solidToLocaleSource`. The base SDK only ever
 *     reads and subscribes to it.
 *   - `writeGrant` additionally accepts a Solid accessor, resolved per call.
 */
export interface iLangsysInitConfig extends Omit<iVanillaInitConfig, 'UserLocaleStore' | 'writeGrant'> {
    UserLocaleStore: Signal<string>;
    /**
     * Short-lived write grant for login-walled apps. Accepts everything the
     * base SDK does (a string, or a sync/async callback), plus a Solid accessor
     * — refresh the grant by setting the signal.
     *
     * Prefer the accessor or callback form. A bare string is quickstart-only:
     * grants live ~5 minutes and an app inits once, so a static string is
     * expired minutes in and every later write silently degrades to read-only.
     */
    writeGrant?: WriteGrantSource;
}

/**
 * The Solid entry point's type: the base SDK's singleton exactly, with two
 * methods re-typed for the Solid-flavored config.
 */
export type LangsysAppSolid = Omit<typeof _LangsysApp, 'init' | 'setWriteGrant'> & {
    /** Initialize Langsys. Pass a `Signal<string>` (from `createLocaleStore`) as `UserLocaleStore`. */
    init(config: iLangsysInitConfig): Promise<iLangsysResponse>;
    /**
     * Supply the write grant after `init()` — for apps whose token only exists
     * once the user has logged in. Re-authorizes so the server re-evaluates the
     * session with the new grant (GRANT-3), so `await` it if you need
     * `useWriteEnabled()` settled before the next assertion.
     */
    setWriteGrant(grant: WriteGrantSource | undefined): Promise<void>;
};

/**
 * The two methods this binding adapts, and nothing else. Both exist for a
 * stated reason: `init` widens two config fields to Solid shapes, and
 * `setWriteGrant` accepts a Solid accessor. Neither changes meaning — the
 * decisions stay the core's (BIND-1, BIND-2).
 */
const overrides = {
    init(config: iLangsysInitConfig): Promise<iLangsysResponse> {
        return _LangsysApp.init({
            ...config,
            writeGrant: adaptWriteGrant(config.writeGrant),
        });
    },
    setWriteGrant(grant: WriteGrantSource | undefined): Promise<void> {
        return _LangsysApp.setWriteGrant(adaptWriteGrant(grant));
    },
} as const;

/**
 * Solid SDK entry point — the base SDK's singleton, forwarded **by reference**,
 * with the two narrow overrides above.
 *
 * ## Why a proxy and not a wrapper class
 * This was a hand-written class enumerating one delegating method per core
 * method. That shape has a failure mode with no symptom: **every method the
 * core adds after the class is written silently disappears from this binding**,
 * with a green typecheck and a green suite, because nothing references what is
 * missing.
 *
 * It had already happened six times when the 838 audit found it. `setWriteGrant`
 * — the entire write-grant surface — was simply not on the list, and neither
 * were `applyAuthorization`, `getUserLanguagePreferences`,
 * `parseAcceptLanguageHeader`, `findBestLocaleMatch` and `resolveLocale`.
 * Adding `setWriteGrant` to the list would have fixed the symptom and left the
 * mechanism running for the next core release to trip over.
 *
 * Forwarding by reference is what BIND-6 actually asks for — "re-export by
 * reference everything that does not need adapting" — and it makes the binding
 * excludable from an investigation in one sentence: everything but `init` and
 * `setWriteGrant` *is* the core, not a copy of it. `src/surface.test.ts` guards
 * the structure rather than any method name, so a future core addition cannot
 * go missing quietly again.
 *
 * Forwarded members are returned **unbound**, so `LangsysApp.foo` and the
 * core's `foo` are the same function object. Calling through the proxy sets
 * `this` to the proxy, whose every read forwards to the core singleton, so the
 * method sees the core's state either way. Binding instead would make a
 * destructured method keep working here while the identical destructure off
 * the core singleton breaks — a behaviour difference, which is precisely what
 * BIND-1 forbids a binding from introducing. Own properties (`Translations`,
 * `debug`, `config`, …) pass straight through.
 *
 * Safe because the core class uses no `#private` fields; those cannot be read
 * through a proxy receiver and would force binding (and with it that
 * divergence). `src/surface.test.ts` asserts the identity, so this stops being
 * true loudly rather than silently.
 */
export const LangsysApp: LangsysAppSolid = new Proxy(_LangsysApp, {
    get(target, prop) {
        if (Object.prototype.hasOwnProperty.call(overrides, prop)) {
            return overrides[prop as keyof typeof overrides];
        }
        // `target` as the receiver, so getters read the core's own state.
        return Reflect.get(target, prop, target);
    },
}) as unknown as LangsysAppSolid;
