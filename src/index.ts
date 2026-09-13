/**
 * langsys-js-solid — idiomatic SolidJS binding over `langsys-js-typescript`.
 *
 * The base SDK's `Signal<T>` already satisfies Solid's subscribable contract
 * (`from(tSignal)` works as-is), so this binding is the thinnest of the four:
 * a seeded `useSignal` accessor, three derived primitives, and mount/destroy
 * component glue.
 *
 * Public API:
 *   - `LangsysApp` — the base SDK's singleton, forwarded so that **methods are
 *     bound to the core** and **accessors and state pass through by reference**,
 *     with two narrow overrides: `init` (accepts a `Signal<string>` for the user
 *     locale and a Solid accessor for `writeGrant`) and `setWriteGrant`.
 *   - Primitives — `useT`, `useCurrentLocale`, `useTranslations`,
 *     `useWriteEnabled`, `useLocaleStore`, and the low-level `useSignal`. These
 *     are the reactive layer; in components prefer them over the raw signals.
 *   - `createLocaleStore` — make the user-locale store (Solid analog of
 *     Svelte's `writable`); `solidToLocaleSource` — adapt an existing signal;
 *     `adaptWriteGrant` — resolve a Solid accessor as a write grant per call.
 *   - `Translate` / `Phrase` / `DontTranslate` — components wrapping the
 *     vanilla DOM handlers. They build real DOM nodes in the browser and emit
 *     untranslated markup under a server render.
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
//
// `writeEnabled` is the one core signal deliberately NOT re-exported here, and
// it must stay that way. Reading it raw resolves synchronously, so a session
// that authorizes before hydration would seed a concrete value into markup the
// server rendered as unknown, and the first client render would disagree with
// the server's HTML. `useWriteEnabled()` in `primitives.js` is the supported
// surface: same value, adopted after mount. Adding it to the line below would
// reintroduce the hazard silently — `surface.test.ts` asserts its absence so
// that lands red instead of green.
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
 * Solid SDK entry point — the base SDK's singleton, forwarded with the two narrow
 * overrides above: **methods bound to the core**, **accessors and state by
 * reference**.
 *
 * ## Why a proxy and not a wrapper class
 * This was a hand-written class enumerating one delegating method per core
 * method. That shape has a failure mode with no symptom: **a public method the
 * core adds after the class is written silently disappears from this binding**,
 * with a green typecheck and a green suite, because nothing references what is
 * missing.
 *
 * **Correction (2026-09-09).** An earlier version of this note claimed that had
 * "already happened six times", naming `applyAuthorization`,
 * `getUserLanguagePreferences`, `parseAcceptLanguageHeader`,
 * `findBestLocaleMatch` and `resolveLocale` alongside `setWriteGrant`. That was
 * wrong, and wrong in a way worth recording. Those five are declared `private`
 * in the core (`langsys-app.ts:84/494/513/537/567`) and reach the `.d.ts` only as
 * bare `private name;` declarations — name only, no signature — which TypeScript
 * refuses to every caller outside the class. They were never API. `private` is
 * erased at RUNTIME, however, so
 * the `getOwnPropertyNames` walk that produced the claim was reading
 * implementation detail and could not tell it from surface. **One** public
 * member was genuinely dropped: `setWriteGrant`.
 *
 * The mechanism is still real and the fix still right — it is simply
 * forward-looking rather than a defect that had already fired five extra times.
 * A public member the core adds tomorrow is exposed here automatically; the
 * enumerated version would have omitted it silently with nothing failing.
 *
 * Forwarding is what BIND-6 asks for — "re-export by reference everything that
 * does not need adapting" — and it makes the binding excludable from an
 * investigation in one sentence: everything but `init` and `setWriteGrant`
 * delegates to the core rather than reimplementing it. `src/surface.test.ts`
 * guards the structure rather than any method name.
 *
 * **Forwarding rules that matter:**
 *
 * - `Reflect.get(target, prop, target)` — the receiver is the **core**, never
 *   the proxy, so getters resolve against the real instance and any future
 *   `#private` field keeps working. Passing the proxy as receiver is the
 *   standard way this breaks.
 * - Functions are **bound to the core** before being handed out, so a
 *   destructured `const { refresh } = LangsysApp` still works. This was
 *   measured, not assumed: unbound, `const { detectPreferredLocale } =
 *   LangsysApp` throws `Cannot read properties of undefined`, because the call
 *   site loses `this`.
 * - Bound functions are **cached per property**, so `LangsysApp.refresh ===
 *   LangsysApp.refresh`. Binding on every read mints a new function each time,
 *   which silently breaks anything comparing function identity — a dependency
 *   array, a removeEventListener, a memo key. The cache is invalidated if the
 *   underlying core function is ever replaced.
 */
const boundCache = new Map<PropertyKey, { source: unknown; bound: unknown }>();

/** Find a property's descriptor anywhere on the prototype chain. */
function descriptorOf(target: object, prop: PropertyKey): PropertyDescriptor | undefined {
    for (let o: object | null = target; o; o = Object.getPrototypeOf(o) as object | null) {
        const d = Object.getOwnPropertyDescriptor(o, prop);
        if (d) return d;
    }
    return undefined;
}

const forwardingHandler: ProxyHandler<typeof _LangsysApp> = {
    get(target, prop) {
        // `hasOwnProperty`, not `prop in overrides`: `in` walks the prototype
        // chain, so `constructor` and `__proto__` would resolve against
        // Object.prototype and be reported as overrides of ours.
        if (Object.prototype.hasOwnProperty.call(overrides, prop)) {
            return overrides[prop as keyof typeof overrides];
        }
        const value = Reflect.get(target, prop, target);
        if (typeof value !== 'function') return value;

        // **Bind METHODS only — never an accessor's computed value.**
        // `LangsysApp.t` is a getter returning the live `TFunction`, and that
        // closure's *identity* is the core's reactivity contract (pinned core-side
        // at `cd07df1`): fresh per catalog change, stable between changes. Binding
        // it would wrap a new function on every read, so `LangsysApp.t === tSignal.get()`
        // stops holding while re-rendering still appears to work — a silent failure,
        // and precisely the contract this binding's own canary test guards.
        // A method is a data property holding a function; an accessor has a getter.
        if (descriptorOf(target, prop)?.get) return value;

        const cached = boundCache.get(prop);
        if (cached && cached.source === value) return cached.bound;

        const bound = (value as (...args: unknown[]) => unknown).bind(target);
        boundCache.set(prop, { source: value, bound });
        return bound;
    },
    has(target, prop) {
        if (Object.prototype.hasOwnProperty.call(overrides, prop)) return true;
        return Reflect.has(target, prop);
    },
};

export const LangsysApp: LangsysAppSolid = new Proxy(_LangsysApp, forwardingHandler) as unknown as LangsysAppSolid;
