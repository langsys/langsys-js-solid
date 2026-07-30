/**
 * langsys-js-solid — idiomatic SolidJS binding over `langsys-js-typescript`.
 *
 * The base SDK's `Signal<T>` already satisfies Solid's subscribable contract
 * (`from(tSignal)` works as-is), so this binding is the thinnest of the four:
 * a seeded `useSignal` accessor, three derived primitives, and mount/destroy
 * component glue.
 *
 * Public API:
 *   - `LangsysApp` — `init` accepts a `Signal<string>` (make one with
 *     `createLocaleStore`, or adapt an existing Solid signal pair with
 *     `solidToLocaleSource`) for the user locale; every other method delegates.
 *   - Primitives — `useT`, `useCurrentLocale`, `useTranslations`,
 *     `useLocaleStore`, and the low-level `useSignal`. These are the reactive
 *     layer; in components prefer them over the raw signals.
 *   - `createLocaleStore` — make the user-locale store (Solid analog of
 *     Svelte's `writable`); `solidToLocaleSource` — adapt an existing signal.
 *   - `Translate` / `Phrase` / `DontTranslate` — components wrapping the
 *     vanilla DOM handlers. Client-only (they build real DOM nodes).
 *   - Raw signals `t` / `currentlyLoadedLocale` / `sTranslations` — re-exported
 *     for advanced/direct subscription outside Solid's reactivity (they also
 *     work with Solid's own `from()`).
 */

import {
    LangsysApp as _LangsysApp,
    type ExtractParamKeys,
    type ParamPrimitive,
    type ParamsFor,
    type Signal,
    type TArgs,
    type TFunction,
    type TranslationParams,
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
export { createLocaleStore, solidToLocaleSource, useSignal } from './adapters.js';
export { useCurrentLocale, useLocaleStore, useT, useTranslations } from './primitives.js';

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
 * Solid-flavored init config. Identical to the base SDK's config except
 * `UserLocaleStore` is typed as a `Signal<string>` — create one with
 * `createLocaleStore()` (or get one from the `useLocaleStore` primitive, or
 * adapt an existing Solid signal with `solidToLocaleSource`). The base SDK
 * only reads and subscribes to it.
 */
export interface iLangsysInitConfig extends Omit<iVanillaInitConfig, 'UserLocaleStore'> {
    UserLocaleStore: Signal<string>;
}

/**
 * Solid SDK entry point. Delegates everything to the underlying
 * `langsys-js-typescript` singleton. Because the Solid locale store is already
 * a `Signal` (unlike Svelte's `Writable`, which needs adapting), `init` is a
 * straight passthrough — the Solid-native concerns live in the primitives and
 * the components, not here.
 */
class LangsysAppSolid {
    /** Initialize Langsys. Pass a `Signal<string>` (from `createLocaleStore`) as `UserLocaleStore`. */
    public init(config: iLangsysInitConfig): Promise<iLangsysResponse> {
        return _LangsysApp.init(config);
    }

    public get Translations() {
        return _LangsysApp.Translations;
    }

    public get translationsLoadingPromise() {
        return _LangsysApp.translationsLoadingPromise;
    }

    /** Current translation function. Reads fresh state on every call (not reactive on its own — use `useT()` in components). */
    public get t(): TFunction {
        return _LangsysApp.t;
    }

    public get debug() {
        return _LangsysApp.debug;
    }

    public refresh() {
        return _LangsysApp.refresh();
    }

    public getCountries(inLocale?: string) {
        return _LangsysApp.getCountries(inLocale);
    }
    public getCountryName(forCountryCode: string, inLocale?: string) {
        return _LangsysApp.getCountryName(forCountryCode, inLocale);
    }
    public getCurrencies(inLocale?: string) {
        return _LangsysApp.getCurrencies(inLocale);
    }
    public getCurrencyName(forCurrencyCode: string, inLocale?: string) {
        return _LangsysApp.getCurrencyName(forCurrencyCode, inLocale);
    }
    public getDialCodes(inLocale?: string) {
        return _LangsysApp.getDialCodes(inLocale);
    }

    public getLocales(inLocale?: string) {
        return _LangsysApp.getLocales(inLocale);
    }
    public getLocalesFlat(inLocale?: string) {
        return _LangsysApp.getLocalesFlat(inLocale);
    }
    public getLocalesData(inLocale?: string, forceRefresh?: boolean) {
        return _LangsysApp.getLocalesData(inLocale, forceRefresh);
    }
    public getLocalesFormat(format: '' | 'flat' | 'data' = '', inLocale?: string) {
        return _LangsysApp.getLocalesFormat(format, inLocale);
    }
    public getLocaleName(forLocale: string, shortName?: boolean, inLocale?: string) {
        return _LangsysApp.getLocaleName(forLocale, shortName, inLocale);
    }
    public getLocaleNameWithLookup(forLocale: string, shortName?: boolean, inLocale?: string) {
        return _LangsysApp.getLocaleNameWithLookup(forLocale, shortName, inLocale);
    }

    /** @deprecated use `getLocaleNameWithLookup` or `getLocaleName` */
    public getLanguageName(forLocale: string, shortName?: boolean, inLocale?: string) {
        return _LangsysApp.getLanguageName(forLocale, shortName, inLocale);
    }

    public detectPreferredLocale(acceptLanguageHeader?: string | null, supportedLocales?: string[]) {
        return _LangsysApp.detectPreferredLocale(acceptLanguageHeader, supportedLocales);
    }
}

export const LangsysApp = new LangsysAppSolid();
