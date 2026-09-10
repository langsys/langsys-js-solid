# CONFORMANCE — langsys-js-solid

Conformance of this **binding** against the SDK Behaviour Spec.

|                             |                                                                                                                                                 |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Spec version                | **7** (`specVersion: 7`)                                                                                                                        |
| Spec text read              | `docs/sdk-spec.mdx` blob `45cdddf8e9136a85143dc5a5169d59b3355d7dc1`, from `langsys2` `origin/main` @ `f1179ad6a0816af7a0163e87e30b1c3ac9ca207b` |
| Read at                     | 2026-09-10T02:42:07Z — re-derived at write time via `git -C ~/Documents/dev/langsys2 ls-tree origin/main docs/sdk-spec.mdx`                     |
| Repo state                  | `feature/838_write_key_gating`, branched from `main` @ `d330333`; BIND-6 v2 applied                                                             |
| Suite                       | **86 tests / 9 files**, all passing — 83 browser-build + 3 SSR-build                                                                            |
| Evidence grade of the suite | **`mock`** — happy-dom + Solid server build, no network. Includes rendered-template and server-rendered assertions.                             |
| Core consumed               | `langsys-js-typescript` local `0.6.5` via `npm link` — **not** the published `0.6.5` (see [The two 0.6.5s](#the-two-065s))                      |
| Profiles                    | `browser` · `binding` · `all`                                                                                                                   |

> **Nothing in this file is graded `implemented`, and that is correct.** CONF-2:
> the shared contract fixture does not exist, so `mock` evidence caps every
> behavioural row at `provisional` across all thirteen repos. A binding with no
> green ticks is the evidence model working, not a broken binding.

## Scope — why this file is short

This is a **binding**. It inherits the browser core's profile and adds nothing of its own, so
most of the spec is not its to satisfy: the core owns registration, discovery, interpolation and
identity outright. Grading those rules here would produce rows that cannot fail — the
green-proving-nothing failure CONF-1/CONF-3 exist to stop.

So this file carries exactly three things:

1. **BIND-1..6** — the binding backbone. Every row, no exceptions.
2. **Rules this binding could _interfere_ with** — where Solid code sits between the app and a
   core decision. Interference is the only way a binding fails a behavioural rule.
3. **One delegation block** for the families the core owns, each with a probe that could have
   found participation and did not.

A rule absent from this file is absent because this binding cannot reach it. Where that judgement
is non-obvious, the row says so rather than omitting it.

**This binding is unpublished** (`npm view langsys-js-solid` → E404). It has no shipped artifact
and no back-compat obligation, which is why the BIND-6 fix below was taken as a structural
replacement rather than an additive patch — the public-surface change is free now and permanent
after first publish.

## Grades

| Grade         | Means                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `implemented` | Behaviour present, evidence `live` or `contract`. **Unreachable today** — CONF-2.                                                                                                    |
| `provisional` | Behaviour present, evidence `mock`. The honest ceiling until the fixture lands.                                                                                                      |
| `partial`     | Present but incomplete or with a known gap, described in the row.                                                                                                                    |
| `delegated`   | The core owns it and **this binding demonstrably does not participate** — an absence probe plus a positive control proving the probe could have found something. Never a bare "n/a". |
| `n-a`         | Structurally unreachable, with the reason stated and the condition that would make it live.                                                                                          |
| `open`        | A conformance question that is not mine to answer alone. Named, routed, unresolved. **Never green.**                                                                                 |

## 1 — Binding rules (BIND-1..6)

| Rule                                                              | Grade         | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **BIND-1** — adapt shape/timing, never meaning                    | `provisional` | Adaptation is confined to Solid's execution model: SDK `Signal` → Solid `Accessor` (`useSignal`), `createRoot`/`createComputed` for the locale adapter, mount/destroy component glue, and the hydration timing in `useWriteEnabled`. The one adapter BIND-1 names as its worked trap — grant provider resolution — is per call and **mutation-tested**: snapshotting turns 3 tests red. The locale store is asserted to round-trip input **verbatim** (`rendered.test.tsx`), so the binding cannot drift from the core's canonicalization by quietly normalizing on its own. Raw `writeEnabled` is deliberately **not** re-exported — reading it synchronously is the hydration hazard `useWriteEnabled()` exists to avoid — and that absence is marked at the export site _and_ pinned by an assertion, so re-adding it lands red.                                                                                                                                                                                                                                                                                                                                                                               |
| **BIND-2** — never branch on server-computed capability           | `provisional` | `useWriteEnabled()` surfaces the core's `writeEnabled` **unchanged** and branches on nothing. Probe for `write_enabled`/`key_type`/`keyType` in `src/`: **0**, control **9** and **18** in the core. This binding exposes **no `keyType` at all** — the capability signal it offers is the one GATE-1 mandates, not the one GATE-1 forbids deciding from.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **BIND-3** — owns no network behaviour                            | `delegated`   | Code-only probe (§3 method) for `fetch\|XMLHttpRequest\|setTimeout\|setInterval\|retry\|backoff\|headers`: **0 in this binding, 17 in the core.** No scheduling, no request construction, no header setting. The binding never touches a URL at all.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **BIND-4** — introduces no configuration the core does not define | `provisional` | `iLangsysInitConfig` adds **no new keys**. It re-types two the core already defines: `UserLocaleStore` (`Signal<string>`, which the core's own type already is) and `writeGrant` (widened to accept a Solid accessor — an arm structurally identical to the core's existing callback arm). No `discovery`, `hint`, `suppress`, interval or threshold option exists; probe **0**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **BIND-5** — does not cache lookup results                        | `delegated`   | **Closed by ruling as conforming-by-absence.** Registration is idempotent per tuple and discovery requires re-entry **per URL** (`translations.ts:277` records the miss _before_ the `sameToken` dedup at `:287-290`, keyed on `location.href` throughout `discovery.ts`) — so the rule bites only bindings carrying a **lookup cache** in front of `t()`. This binding has none: probe for `createMemo\|useMemo\|cache(` → **0** (control: 15 reactive primitives in use). Its two `===` equality gates govern **re-rendering**, not lookup suppression. Verified by measurement, not inference: on a simulated navigation a re-mounted component re-enters `t()` while a persistent one does not (1 of 2) — Solid's own render semantics, identical to using the core directly, and not a binding-authored cache. (TS ruling, `838-intake-solid`, citations at core `6cdb388`.)                                                                                                                                                                                                                                                                                                                                 |
| **BIND-6** — wrap the narrowest surface possible                  | `provisional` | `LangsysApp` is the core singleton forwarded through a `Proxy`, with exactly two overrides (`init`, `setWriteGrant`). `Reflect.get(target, prop, target)` keeps the **core** as receiver, so getters resolve against the real instance and a future `#private` field keeps working. Functions are **bound to the core** before being handed out — measured, not assumed: unbound, `const { detectPreferredLocale } = LangsysApp` throws — and **cached per property**, so `LangsysApp.refresh === LangsysApp.refresh` (binding on every read mints a new function and silently breaks identity comparisons). `surface.test.ts` guards the **structure**, not a method list; `type-surface.test.ts` guards that the **exported type** does not widen to core-private members. See [the silent-drop mechanism](#the-silent-drop-mechanism), whose original claim is corrected there. **Methods are bound; accessors are forwarded untouched** — `LangsysApp.t` returns the live `TFunction` whose identity is the core's reactivity contract (`cd07df1`), and wrapping it would break `LangsysApp.t === tSignal.get()` while re-rendering still looked correct. Decided from the property descriptor, not `typeof`. |

## 2 — Rules this binding could interfere with

Solid code sits between the app and the core on three paths: the **primitives** (every reactive
read), the **components** (DOM tokenizing), and now the **grant adapter**. Everything below is
graded on those.

| Rule                                                                       | Grade         | Evidence                                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **GATE-1** — decide from `write_enabled`, never `key_type`                 | `delegated`   | The binding makes no register-or-report decision. Probe for `write_enabled` in `src/`: **0**; positive control **9** in the core. `useWriteEnabled()` reads the core's signal and forwards it; it never computes a decision.                                                                                                                                                                          |
| **GATE-2** — collect always; choose the lane at the send site              | `delegated`   | **Closed by the same ruling.** The binding never collects or sends, and — the open concern — it does not suppress the `t()` call that feeds collection, since it holds no lookup cache (BIND-5 row). The lane choice happens at the core's flush site (`translations.ts:280-284`), which this binding cannot reach.                                                                                   |
| **GATE-3** — never persist the write decision                              | `delegated`   | Probe for `localStorage\|sessionStorage\|persist`: **0 in this binding, 7 in the core.** `useWriteEnabled` holds its value in a Solid signal owned by the calling component and disposed with it — asserted in `capability.test.ts` ("stops observing the core once the owning root is disposed"). Nothing outlives the page session.                                                                 |
| **GATE-4** — strip the decision from whatever you cache                    | `n-a`         | The binding caches no response envelope and no catalog. There is nothing here for a write decision to be embedded in.                                                                                                                                                                                                                                                                                 |
| **GATE-7** — every detecting path feeds exactly one lane                   | `delegated`   | **Closed by the same ruling.** Per-URL discovery lives core-side and is ordered before the registration dedup by construction. No Solid code sits between a miss and its lane.                                                                                                                                                                                                                        |
| **GATE-8** — missing `write_enabled` is a version signal, never permission | `provisional` | The binding's obligation is not to collapse the tri-state, and it does not: `useWriteEnabled()` returns `Accessor<boolean \| undefined>` and **`undefined` is never defaulted to `false`** — asserted explicitly, and `false` is asserted to remain distinguishable from `undefined` once resolved (`capability.test.ts`). The version-signal inference itself is the core's and is not reached here. |
| **CAT-1** — a miss is decided by key presence, not truthiness              | `delegated`   | **Closed by the same ruling.** The present-with-null vs absent distinction lives entirely core-side; the binding reads no catalog directly (`useTranslations()` forwards `sTranslations` by reference) and caches nothing that could collapse the two states.                                                                                                                                         |

> **Spec profile change, no row change (2026-09-10).** The spec moved while this lane was open:
> `docs/sdk-spec.mdx` is now blob `45cdddf8` (was `06ae105a`), and **GRANT-1..4 were re-profiled
> `all` → `browser`**, with a new server clause — a server SDK MUST NOT send `X-Write-Grant`.
> This binding carries the `browser` profile, so all four GRANT rows remain in scope and none of
> their grades or evidence change. Re-derived at write time with
> `git -C ~/Documents/dev/langsys2 ls-tree origin/main docs/sdk-spec.mdx`; the suite was re-run
> against the new blob and the counts below are recomputed, not carried forward. `specVersion` is
> still 7. Recorded because the header must say what the file was computed against, even when the
> answer is "nothing moved".

| **GRANT-1** — provider callback, documented as the default form | `provisional` | `writeGrant` accepts a string, a sync/async callback, **or a Solid accessor**. The README documents the signal/callback form as the default and states why the string form is quickstart-only (grants live ~5 min; an app inits once). |
| **GRANT-2** — resolve the grant per request; never cache the token | `provisional` | `adaptWriteGrant` returns `() => untrack(grant)` — resolved on **every** call, never at adapt time. This is BIND-1's named costume trap and is the one row here proven by mutation: replacing it with a snapshot turns 3 tests red, including one that refreshes the token four times through a login/logout cycle. |
| **GRANT-3** — `setWriteGrant()` must re-authorize, not merely set config | `delegated` | `LangsysApp.setWriteGrant` adapts the grant shape and delegates to the core's method, which owns the re-authorization. The binding adds no configuration-only path. Probe: the binding contains no authorization logic — `applyAuthorization` is forwarded as a **bound delegate** of the core, not re-implemented, which `surface.test.ts` asserts by checking the forwarded function reports `bound applyAuthorization` (a reimplementation would carry its own name). |
| **GRANT-4** — send the grant as `X-Write-Grant` | `delegated` | Header construction is the core's; BIND-3 probe confirms the binding sets no headers (**0** vs **17**). |
| **OBS-1** — surface an unusable capability at least once | `delegated` | **Ownership settled core-side since the last revision.** The core added `noticeUnusableWriteCapability`, called from its own `applyAuthorization` on both the init and grant-change paths, latched on the _outcome_ so a re-auth that changes the answer re-reports while one that changes nothing stays quiet. The binding does not participate and needs no action: probe for `warn\|console.\|diagnostic\|notice\|logger` in `src/` → **0**, control **51** in the core. Was `partial` (gap) while the owner was unsettled. |
| **SSR-1..3** — do not collect server-side; degrade loudly | `provisional` | **Now executed, not reasoned.** `capability.ssr.test.tsx` runs against Solid's **server build** (`vitest.ssr.config.mts`) and asserts `useWriteEnabled()` renders the undecided branch even when the core already holds `true` — and separately that a `false` does not leak either. Positive control asserts `isServer` and that `renderToString` really renders, so the browser build cannot make these vacuous. The guard is `onMount`, which never runs server-side. Mutation-checked: seeding eagerly turns both SSR assertions red. The three components remain client-only by construction and documented as such. |
| **WIRE-3** — lowercase `xx-yy` on the wire | `delegated` | The binding performs no locale string manipulation — probe for `toLowerCase\|toUpperCase\|replace(\|normalize` in `src/`: **0**. Verified **side by side with the resolved core**, never a double: `canonicalizeLocale` maps `en-US`→`en-us`, `es-ES`→`es-es`, `ES-es`→`es-es`, `fr-FR`→`fr-fr`. That side-by-side **found a live documentation defect** — see [The locale casing defect](#the-locale-casing-defect). |
| **WIRE-5** — reachable test double, documented where integrators look | `provisional` | `LangsysAppAPI` is re-exported by reference, so `setBaseUrl()` is reachable without an artifact edit, and the playground's `VITE_LANGSYS_API_URL` is documented in `.env.example` where an integrator looks. The binding introduces no `apiUrl` config of its own (BIND-4). |
| **CACHE-1** — cache keys namespaced by project | `n-a` | The binding holds no cross-session or shared cache. The only state it owns is per-component Solid signals, created and disposed with their owner. Nothing is process-external or shared by default, which is the hazard CACHE-1 names. |
| **CID-2** — no-category is `''`, never `null`/`undefined` | `provisional` | Both components default with `?? ''`: `category: props.category ?? ''` and `custom_id: props.custom_id ?? ''` (`Translate.ts:59-60`), matching the rule exactly rather than forwarding `undefined`. |

> **All control figures in this file — inline in §2 and tabulated in §3 — are computed against
> the same core revision, `cfe8d40` (the linked working copy, `c010f32`). They were re-derived
> together on 2026-09-10; none is carried over from an earlier core.**

## 3 — Delegation block: families the core owns

The binding does not participate in any of these. Each row states the probe and the positive
control that proves the probe works.

**Probe method.** Every count is **code only** — comment and JSDoc lines are stripped before
counting, because this binding's prose discusses `fetch`, `write_enabled` and `custom_id`
constantly while its code does none of it. The exact filter:

```bash
probe() {  # $1 = pattern, $2 = tree
  grep -rnE "$1" "$2" --include='*.ts' | grep -v '\.test\.ts' | grep -vE ':[0-9]+: *(\*|//|/\*)'
}
```

**The patterns in the table below are markdown-escaped** (`\|` for the alternation, so the pipes do
not break the table cells). Pasted verbatim into `probe()` every row returns 0 — _including the
control_, which is the signature of a broken probe rather than a clean binding. Unescaped copies,
ready to paste:

```bash
CID='custom_id|customId|generateCustomId|md5'
ICU='intl-messageformat|interpolate|isICU|plural'
REG='batch|flush|keepalive|sendBeacon|debounce|queue'
NET='fetch\(|XMLHttpRequest|setTimeout|setInterval|retry|backoff|headers'
HINT='location|href|hint|discover|fragment'
GATE56='isContentBlockKnown|registerContentBlock|isPhraseMarked|PHRASE_MARKER|isTranslationExcluded|sTranslations\.(set|update)'
GATE3='localStorage|sessionStorage|persist'
GATE1='write_enabled'
GATE8='key_type|keyType'
CACHE1='cacheKey|persist\(|setPersistStorage|PersistStorage'
```

| Family                                             | Probe pattern                                                                                                                   | Mine                           | Control (core) | Reading                                                                                                                                                                       |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CID-1..4** (`custom_id`)                         | `custom_id\|customId\|generateCustomId\|md5`                                                                                    | **2** — pass-through prop only | **37**         | **No generation, no hashing, no id derivation.** Both hits are `Translate.ts`: the prop declaration and `custom_id: props.custom_id ?? ''` handed verbatim to the core class. |
| **ICU-1..5** (interpolation recovery)              | `intl-messageformat\|interpolate\|isICU\|plural`                                                                                | **0**                          | **15**         | Params pass through as `Record<string, ParamPrimitive>`; the core formats and recovers.                                                                                       |
| **REG-1..12** (write lane)                         | `batch\|flush\|keepalive\|sendBeacon\|debounce\|queue`                                                                          | **0**                          | **42**         | No scheduling, batching, or teardown flush.                                                                                                                                   |
| **BIND-3 / network**                               | `fetch\(\|XMLHttpRequest\|setTimeout\|setInterval\|retry\|backoff\|headers`                                                     | **0**                          | **17**         | No network behaviour of any kind.                                                                                                                                             |
| **HINT-1..12** (discovery reports)                 | `location\|href\|hint\|discover\|fragment`                                                                                      | **0**                          | **26**         | The hint lane reads the URL **inside the core**. No Solid code is on that path — there is no seam here to conform through.                                                    |
| **GATE-5, GATE-6** (bookkeeping, lane exclusivity) | `isContentBlockKnown\|registerContentBlock\|isPhraseMarked\|PHRASE_MARKER\|isTranslationExcluded\|sTranslations\.(set\|update)` | **2** — DOM contract only      | **30**         | No "already seen" bookkeeping; the binding never writes the catalog store. Both hits are the marker attribute, below.                                                         |
| **GATE-3** (never persist the decision)            | `localStorage\|sessionStorage\|persist`                                                                                         | **0**                          | **7**          | This binding writes to no storage of any kind.                                                                                                                                |
| **GATE-1** (server-computed capability)            | `write_enabled`                                                                                                                 | **0**                          | **9**          | The binding never reads the wire field; it forwards the core's signal.                                                                                                        |
| **GATE-8** (key-type inference)                    | `key_type\|keyType`                                                                                                             | **0**                          | **18**         | **No `keyType` surface exists here at all** — nothing invites a consumer to gate on key type.                                                                                 |
| **CACHE-1** (namespaced cache keys)                | `cacheKey\|persist\(\|setPersistStorage\|PersistStorage`                                                                        | **0**                          | **7**          | The binding owns no cache to namespace.                                                                                                                                       |

> **Control counts recomputed, not carried forward (2026-09-10).** The core moved `6cdb388` →
> `cfe8d40` while this lane was open, so every count in this table was re-derived by running the
> `probe()` filter above rather than trusting the previous revision. Five controls grew —
> HINT 25→26, GATE-5/6 28→30, GATE-3 6→7, GATE-1 7→9, GATE-8 12→18 — and **every "Mine" count is
> unchanged**, so no grade moves. The growth is the core gaining code, which is what a live control
> should do; a control that never moves while its target is under active development is the one to
> distrust.

> **A discarded probe, recorded because the lesson generalises.** CACHE-1 was first probed with
> `createMemo|useMemo|cache\(|Map\(|WeakMap`. That returns **0 in this binding and 0 in the core** —
> the positive control fails, so the probe proves nothing, and reporting the row on it would have
> been a green tick backed by a search that could not have found anything. The replacement pattern
> above describes what caching actually looks like in this core (`persist`, `PersistStorage`) and
> its control fires. **A `delegated` grade is only as good as a control that fires**; when the
> control comes back empty, the probe is wrong, not the code.

**On the marker attribute.** `Phrase` stamps the phrase marker so a wrapping `<Translate>` skips
it — DOM contract, not bookkeeping, and precisely the shape-adaptation BIND-1 sanctions. Worth
noting against the sibling finding in `langsys-js-angular`: this binding **imports
`PHRASE_MARKER_ATTR` from the core** rather than hardcoding the string, so there is no duplicated
constant across the repo boundary to drift. `DontTranslate` additionally sets a
`data-ls-dont-translate` attribute that the core reads nowhere — it works because it also sets
`translate="no"`. Inert, and the same mild BIND-4 smell flagged in the Angular lane; carried here
so the two can be resolved together rather than twice.

## The silent-drop mechanism

The reason the entire 838 surface was absent from this binding is worth recording, because the
absence had **no symptom**.

`LangsysApp` was a hand-written class that enumerated one delegating method per core method
(`public refresh() { return _LangsysApp.refresh(); }`, twenty times over). Every method the core
added _after_ that class was written silently vanished from this binding's public surface — with
a green typecheck and a green suite, because nothing referenced what was missing.

### Correction (2026-09-09) — a correction of a correction

**Old text.** This section previously read _"It had already happened **six times** when this audit
found it"_, followed by a table marking six core methods "**no** — unreachable through the old
class": `setWriteGrant`, `applyAuthorization`, `getUserLanguagePreferences`,
`parseAcceptLanguageHeader`, `findBestLocaleMatch`, `resolveLocale`.

**New text.** **One** public member was genuinely dropped — `setWriteGrant`, the whole write-grant
surface. The other five are declared `private` in the core and emitted into the `.d.ts` as bare
`private name;` declarations — **name only, no signature** — which TypeScript refuses to any caller
outside the class. They were never API, so they could not be dropped from one.

| Core member                  | Visibility                     | Genuinely dropped API?  |
| ---------------------------- | ------------------------------ | ----------------------- |
| `setWriteGrant`              | `public` (`langsys-app.ts:62`) | **yes**                 |
| `applyAuthorization`         | `private` (`:84`)              | no — never API          |
| `getUserLanguagePreferences` | `private` (`:494`)             | no — never API          |
| `parseAcceptLanguageHeader`  | `private` (`:513`)             | no — never API          |
| `findBestLocaleMatch`        | `private` (`:537`)             | no — never API          |
| `resolveLocale`              | `private` (`:567`)             | no — never API          |
| `getCountries` _(control)_   | `public` (`:342`, `.d.ts:558`) | n/a — was never missing |

Provenance: `git -C ~/Documents/dev/langsys-js-typescript show cfe8d40:src/langsys-app.ts` filtered
with `grep -nE '^\s+(private|public|protected)\s+(async\s+)?<name>\('`; `.d.ts` presence checked
against the built artifact this repo actually resolves. Also verified private at core `6cdb388`, the
commit live when the original claim was written — so the fact was checkable at the time.

### Correction (2026-09-10) — the correction's own measurement was false

The record above originally claimed the five members "appear in **no `.d.ts` at all**", and called
that _stronger_ than "declared private". **It was false, and it was false by the same mechanism the
correction was written to expose.**

They are in the built `.d.ts`, at fixed lines:

```
$ grep -nE '^\s+private [A-Za-z]+;' dist/index.d.ts
548:    private applyAuthorization;
596:    private getUserLanguagePreferences;
597:    private parseAcceptLanguageHeader;
598:    private findBestLocaleMatch;
604:    private resolveLocale;
```

**Why the instrument could not see them.** The probe used was
`grep -nE '^\s+(private )?NAME[(:]' dist/index.d.ts` — anchored on a `(` or `:` after the name,
because it was written for members that have a _signature_. TypeScript does not emit a signature
for a private member: it elides the type entirely and writes `private name;`. So the pattern
returned **0 for all five**, while the positive control `getCountries` — which is public and
therefore _does_ carry a signature at `:558` — matched. **The control fired, so the false negative
read as a verified fact.**

That is precisely the failure the first correction describes: a measurement whose instrument cannot
resolve the distinction it is being used to draw, with a control that passes anyway because it
differs from the subjects in the very property the instrument keys on. The first correction found it
in a runtime prototype walk; this one repeated it one layer up, in the `.d.ts` read that was
supposed to be the authority. **Two measurements sharing a method share its blind spot — including a
corrected one.**

**What actually holds.** The conclusion is unchanged and now rests on the right fact: `private
name;` in a `.d.ts` is inaccessible to every caller outside the class (measured: accessing one
through the core's own type is `TS2341`), so the five were never API and `setWriteGrant` remains the
only genuine drop. The correct instrument for "is this member private in the emitted types" is
`grep -nE '^\s+private [A-Za-z]+;'` — keyed on the _shape of a private declaration_, not on the
shape of a signature.

**Also wrong in the same way, and not editable:** the pushed commit message of `3f90503` carries the
"no `.d.ts` at all" claim. It stands in the history uncorrected; this record is the correction.

**Why the error happened, and why it generalises.** The claim came from a runtime walk of the
core's prototype (`Object.getOwnPropertyNames`). **TypeScript's `private` is erased at compile time**
— it constrains callers, it does not remove the method — so the walk reports implementation detail
and public surface identically, and cannot distinguish them. The walk was correct about what it
measured (uniform forwarding); the conclusion drawn from it (dropped API) did not follow. The
authoritative source for "is this API" is the `.d.ts`, which this lane had available and did not
consult. Two other lanes measured the same five and reached the same wrong conclusion; one caught it
by reading the `.d.ts`.

**What survives the correction.** The mechanism is real, the fix is right, and the reason is
**forward-looking rather than historical**: a public member the core adds tomorrow is exposed here
automatically, where the enumerated version would have omitted it silently with nothing failing.
Adding `setWriteGrant` to the old list would have closed the one real gap and left that mechanism
running. A test naming today's methods would have rotted into the same blind spot.

**It has since caught a real one, unprompted.** While this branch was open, the core added
`noticeUnusableWriteCapability` (its OBS-1 diagnostic) as a method on the class. This binding
forwarded it and `surface.test.ts` began asserting it **with no edit here** — the suite went 66 → 67
browser tests on a docs-only commit, which is how the addition was noticed at all. Under the old
enumerating class it would have been dropped exactly as `setWriteGrant` was: silently, with a green
suite and a green typecheck. The structural test is not a hypothetical guard against a future
regression; it absorbed a live core addition during the wave it was written in.

> **Follow-up, and it makes the same point from the other side (2026-09-10).** That method has since
> moved _out_ of the class — it is a standalone exported function as of core `c1cf492` — so the
> prototype no longer carries it and the walk no longer produces a row for it. The suite absorbed
> the removal exactly as it absorbed the addition, again with no edit here. A hand-maintained list
> would now be wrong in the opposite direction: asserting a member that no longer exists, which
> fails loudly, or quietly keeping a dead name that reads as coverage.

> **Superseded (2026-09-10) — this paragraph is the OLD rationale, kept for the record.** It read:
>
> > ~~Forwarded members are deliberately **unbound**. Binding them would make a destructured method
> > keep working here while the identical destructure off the core singleton breaks — a behaviour
> > difference, which is what BIND-1 forbids a binding from introducing. This is safe only because
> > the core class uses no `#private` fields (verified); the identity assertion in
> > `surface.test.ts` is what makes that stop being true loudly rather than silently.~~
>
> **Methods are now bound to the core**, and the argument above is answered in
> [Destructuring](#destructuring--measured-and-a-deliberate-divergence-from-the-core): surviving
> destructuring is a calling convention, not product behaviour, and the `#private` clause was the
> tell — it named an invariant this repository does not own as the thing keeping the design safe.
> Accessors are still forwarded untouched, and their identity is still asserted. Left in place
> rather than deleted because a reader arriving at this section first would otherwise meet a
> rationale the rest of the file contradicts.

## Rendered-template evidence

"The signal is correct" and "the user sees it" are different facts. The Angular lane shipped a
capability signal holding the right value while the framework never repainted — `afterNextRender`
ran outside the zone, so no change detection was scheduled — and their whole suite read the signal
directly, so nothing could see it. The bug was invisible **by construction**.

Solid has no zone, so that exact failure cannot occur here. The equivalent one can, from the other
side: every update in this binding arrives from **outside Solid's ownership** (a base-SDK
`subscribe` callback) and passes **two `===` equality gates** before reaching a template. So
`rendered.test.tsx` asserts through `render()` and `container.textContent` — the DOM, never the
accessor:

- `useWriteEnabled` repaints across the full tri-state (`checking` → `read-only` → `editable`),
  including from an emit originating outside Solid ownership.
- `useT` repaints on a catalog arriving and on a locale change.
- The BIND-5 hazard, at the DOM: a stable `TFunction` identity leaves rendered text **frozen at
  `v1` across two emits**, while the fresh-identity control repaints. The BIND-5 row is no longer
  a claim about a computation; it is a claim about a user's screen.

Mutation-checked with the Angular failure shape itself — subscribing but never propagating (value
arrives, framework never told) turns **4 tests red**, two of them rendered.

> **A discarded test, recorded because the lesson generalises.** This section first carried a test
> named _"repaints on locale change alone"_. Independent review found it a **tautology**, with
> executed proof: under a kill-propagation mutation it stayed **green** while the catalog test and
> the identity control beside it went red. Root cause: `t()` resolves against `sTranslations`, not
> against the locale, so a locale change on its own re-mints the `TFunction` identity while
> rendering byte-identical text — both assertions held on both branches, and the second was dead
> code either way. Replaced with the real product path (locale flips → catalog lands → repaint),
> which pins the semantics that made the old one vacuous and **does** die under that mutation.
> **A rendered-template test is not automatically a real test**; the same mutation discipline that
> validates a probe has to be pointed at the assertions themselves.

## The locale casing defect

Found by running the locale behaviour **side by side with the resolved core** rather than against a
hand-written double. The instruction that produced it: a double encodes whatever casing its author
assumed, and the assertions written against it then demand that form.

There was no double here — but there was a **documented claim**, and it was wrong. The
`createLocaleStore` docstring said:

> `currentlyLoadedLocale` always emits the canonical form (`'en-US'`), so prefer canonical casing
> to keep comparisons against it straightforward.

The core's `canonicalizeLocale` maps `en-US` → **`en-us`**, and `currentlyLoadedLocale` emits
`this.locale`, which is canonicalized on every path (`translations.ts:561,579,600`). So a consumer
following that advice would write `current() === 'en-US'` against a signal emitting `'en-us'` — a
comparison that **can never be true**, in the direction WIRE-3 forbids.

Corrected in `adapters.ts` and the README, and pinned by assertions in `rendered.test.tsx` — two
of which call the real `canonicalizeLocale` rather than restating the rule, while the third pins
that the store does **not** normalize. The store itself is unchanged: it round-trips input
verbatim, because normalizing in the binding would be the binding adapting meaning (BIND-1) and
would diverge from the core the moment its rule changed.

## Destructuring — measured, and a deliberate divergence from the core

Replacing the wrapper class with a proxy changed a behaviour nobody had written down, so it was
measured against the shape that preceded it (`d330333`, built from that worktree) rather than
reasoned about.

The instrument matters. The first probe used `getCountries` and reported **no difference** — because
`getCountries` is `async`, so a lost `this` surfaces as a **rejected promise**, not a throw, and a
bare `try/catch` never sees it. The probe passed vacuously. Re-run against `detectPreferredLocale`
(public, **synchronous**, and it calls `this.getUserLanguagePreferences`), with the async case
awaited:

| shape                                 | `const { m } = LangsysApp; m()`                                            | exit |
| ------------------------------------- | -------------------------------------------------------------------------- | ---- |
| wrapper class (`d330333`, pre-branch) | **works**                                                                  | 0    |
| unbound proxy (`2ebb66f`)             | throws `Cannot read properties of undefined (…getUserLanguagePreferences)` | 1    |
| **bound proxy (this revision)**       | **works**                                                                  | 0    |
| the **core singleton** itself         | throws — same error                                                        | 1    |

Controls: calling through the object (`LangsysApp.m()`) works in every row, so the probe
discriminates rather than reporting a broken import.

**The last row is the interesting one.** The core does not survive destructuring either, so the
unbound proxy was not a regression against the core — it was _parity_ with it, and the old wrapper
class had been quietly **more permissive** than the thing it wrapped. That was the argument for
leaving it unbound: BIND-1 says a binding must not adapt meaning, and being more forgiving than the
core is a difference.

It was overruled deliberately, and the reasoning is worth keeping because it is a line-drawing
question the fleet will hit again. Surviving destructuring is a **calling convention**, not product
behaviour: the bound function is the core's own function, invoked on the core's own instance,
returning the core's own result. Nothing about _what the SDK does_ changes — only whether a
particular JavaScript idiom works at the call site. Against that, leaving it unbound carried a real
correctness cost: with an unbound forward, `proxy.m()` runs with `this === proxy`, which works only
while the core has no `#private` fields, an invariant this repo does not own.

So: bound, and **cached per property** so `LangsysApp.refresh === LangsysApp.refresh`. Binding on
every read — the shape the sibling Svelte binding uses — mints a fresh function per access, which
silently breaks anything comparing function identity. `surface.test.ts` pins all three properties
(bound delegate, referential stability, destructuring survives) and each was mutation-checked.

### The shipped-release measurement

The fleet ruling on this item is conditional: bind **if destructuring worked in the lane's last
shipped release**, because removing a shipped property from installed consumers is a different act
from declining to add one. Measured rather than assumed:

```
$ npm view langsys-js-solid versions     # E404 — not in the registry
$ npm view langsys-js-solid dist-tags    # E404
$ git tag -l                             # (empty)
  package.json version: 0.1.0
```

**There is no last shipped release.** This package has never been published, carries no release
tag, and has no installed consumers, so neither branch of the ruling applies literally: nothing can
be taken away from anyone. The comparison above is therefore against the **previous state of the
repository** (`d330333`), not against a release, and it is labelled that way throughout.

Binding was chosen anyway, on two grounds that stand independent of the ruling's premise:

1. **Correctness.** An unbound forward makes `proxy.m()` run with `this === proxy`, which works only
   while the core has no `#private` fields — an invariant this repository does not own and cannot
   enforce.
2. **Fleet consistency.** Every other binding that has ruled on this is bound, and a lone unbound
   binding is a difference future readers must re-derive.

So this lane reaches the ruling's outcome without satisfying its condition, and says so rather than
letting the two look like the same thing. The CHANGELOG stays untouched: with no shipped artifact
there is nothing to describe as preserved or broken.

### Bind methods, forward accessors untouched

Found by implementing, and it was **wrong in the first commit of this round** (`3f90503`).

`LangsysApp.t` is a getter returning the live `TFunction`. That closure's _identity_ is the core's
reactivity contract, pinned core-side at `cd07df1`: fresh per catalog/locale change, stable between
changes, because `Signal.set` drops an `Object.is`-equal value. A naive "bind anything callable"
rule binds it too, minting a wrapper per read — so `LangsysApp.t === tSignal.get()` silently stops
holding while re-rendering still _appears_ to work. Measured on the built artifact:

| probe                                | `3f90503` (bug) | fixed  |
| ------------------------------------ | --------------- | ------ |
| `LangsysApp.t === core.LangsysApp.t` | `false`         | `true` |
| `LangsysApp.t === tSignal.get()`     | `false`         | `true` |
| `core.t === tSignal.get()` (control) | `true`          | `true` |
| `LangsysApp.t.name`                  | `"bound fn"`    | `"fn"` |

The rule is therefore: **bind data-property methods, forward accessors untouched** — decided from
the property descriptor, not from `typeof`. This is the same class of failure this lane exists to
catch, and it landed in a commit whose message claimed to be fixing exactly this kind of thing;
recorded rather than quietly amended.

Because this package is **unpublished**, no consumer experienced any of these shapes; there is no
breaking change to announce and the CHANGELOG is untouched. The divergence is recorded here instead.

## The two 0.6.5s

`langsys-js-typescript@0.6.5` **on npm** and `0.6.5` **in the local working copy** are different
code under one version string: the 838 surface was added on top of the already-published 0.6.5
without a bump. No version comparison distinguishes them.

| probe                                   | published `0.6.5` | local `0.6.5` |
| --------------------------------------- | ----------------- | ------------- |
| `writeEnabled`                          | `undefined`       | `object`      |
| `setWriteGrant`                         | `undefined`       | `function`    |
| `autoDiscovery`                         | `undefined`       | `object`      |
| `generateCustomId` _(positive control)_ | `function`        | `function`    |

`src/upstream-precondition.test.ts` asserts this **by symbol, against the artifact
`require.resolve` returns**, so an `npm ci` that silently swaps the link for the registry tarball
is a red build rather than a silent bench swap.

**Sharper here than in the sibling bindings.** This package still declares
`langsys-js-typescript@^0.4.1` — a range that excludes 0.6.5 in _either_ form. The release wave
owns that floor, so until it moves, the symlink is the only thing putting the 838 surface on the
bench, and this test is the only thing that notices when it goes.

**CONF-3 mutation evidence — observed, not staged.** This was not a rehearsed mutation. Partway
through this branch, `npm install --save-dev @types/node` replaced the symlink with the registry
tarball as a side effect. The precondition test went red immediately and named the cause:

```
× exports writeEnabled as object
× exports setWriteGrant as function
× exports autoDiscovery as object
✓ resolves the package at all
✓ loads (positive control: generateCustomId exists in every build)   ← load is fine
```

The positive control staying green is what made the three failures _evidence of absence_ rather
than a broken import. Restored with `npm link ../langsys-js-typescript`. Every other test in the
suite stayed green through the swap, which is exactly the blind spot this file exists to close.

## Check-the-verifier

Each new behaviour was mutated to confirm its test actually catches it. All ten mutations were
reverted; the suite is green at the recorded SHA. **Every row below was re-measured at this tip on
2026-09-10, against current test names — the counts are not carried forward from when the table was
first written, and three of them had drifted.**

| Mutation                                                                                            | Expected to break     | Result                                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Seed `useWriteEnabled` from `writeEnabled.get()` (drop the mount guard)                             | hydration + tri-state | **2 failed** — the seed test and the adoption test                                                                                                                                                              |
| Snapshot the grant at adapt time instead of resolving per call                                      | GRANT-2               | **3 failed** — incl. the four-refresh login/logout cycle                                                                                                                                                        |
| Hide a **non-override** core method from the proxy — `if (prop === 'refresh') return undefined`     | BIND-6                | **3 failed** — `forwards refresh`, the bound-delegate sweep, and override set-equality                                                                                                                          |
| Hide the **override** instead — `if (prop === 'setWriteGrant') return undefined`                    | BIND-6                | **2 failed** — `forwards setWriteGrant` and the dropped-public-member pin. Recorded separately because the count depends on which member is hidden, and a table row that does not say which is not reproducible |
| Subscribe but never propagate — **the Angular failure shape** (value arrives, framework never told) | repaint               | **4 failed** — 2 accessor, **2 rendered-template**                                                                                                                                                              |
| Seed eagerly, dropping the `onMount` guard, checked against the SSR project                         | SSR-1..3              | **2 failed** — both server-render assertions; the browser project alone could not see this                                                                                                                      |
| Widen the exported type — `Record<string, any> &` before the `Omit<…>`                              | BIND-6 v2(b)/(c)      | **6 failed** of 7 in `type-surface.test.ts`: the non-zero-exit row and all five `TS2339` rows. Only the positive control survives, which is the point of having one                                             |
| Stop binding — return the raw function instead of the cached bind                                   | BIND-6 v2(e)          | **4 failed** — bound-delegate sweep, override set-equality, the SYNC destructuring row, and `methods ARE still bound`                                                                                           |
| Bind on every read with no cache (the sibling Svelte shape)                                         | referential stability | **1 failed** — only the stability assertion, which is the property the cache adds                                                                                                                               |
| Bind accessors as well as methods (the bug shipped in `3f90503`)                                    | identity contract     | **2 failed** — `LangsysApp.t` identity, and the accessor sweep                                                                                                                                                  |

## Resolved — BIND-5 / GATE-2 / GATE-7 / CAT-1, and the identity contract

**Both questions this file raised have been ruled on** (Typescript lane, via Reviewer,
`838-intake-solid`; citations against core `6cdb388`).

### Ruling 1 — the four rows close with no code change

Registration is idempotent per tuple, and the discovery lane requires re-entry **per URL**:
`missingToken()` calls `recordMissForDiscovery` at `translations.ts:277`, deliberately _before_ the
`sameToken` dedup at `:287-290`, so "a phrase already queued from an earlier route must not suppress
the record for the page being viewed now" (the core's own comment). Discovery keys on
`location.href` throughout `discovery.ts`.

So the rule bites a binding only where one carries a **lookup cache in front of `t()`** — which is why
the Angular lane needs a navigation-varying key on its pipe memo and this lane needs nothing. The two
equality gates measured here govern **re-rendering**, not lookup suppression, and they were never a
cache: probe for memo primitives returns **0**.

Measured rather than inferred, since the ruling turns on it: across a simulated navigation, a
re-mounted component **does** re-enter `t()` while a persistent one does not (1 of 2 components).
That is Solid's own render semantics — identical to calling the core directly from a component, and
not a binding-authored cache — but it is stated here rather than left to be discovered, because it is
the shape GATE-7 cares about.

### Ruling 2 — fresh-identity-per-emit is a CONTRACT

The question this file asked — _is the core's per-emit `TFunction` identity a contract or an
implementation detail?_ — is answered: **a contract.** The Typescript lane's finding, in their terms:
`signal.ts:43`'s `Object.is` guard enforces it, `translations.ts:97-99` depends on it, it is documented
only in an architecture overview away from both sites, and **no test fails if it breaks** — memoizing
`buildTFn` would silently freeze every binding in the fleet.

**The pin has landed** (core `cd07df1`, "pin the TFunction identity contract at both enforcing
sites"). Verified here rather than taken on report: `cd07df1` adds the comment at `signal.ts`'s
`Object.is` guard plus `tests/tfunction-identity.test.ts` — four tests, one of them a control
asserting that `Signal.set` really does drop an identical reference, without which the other three
could pass under a Signal that notified unconditionally. The companion comment at the mint site in
`translations.ts` landed earlier in the same lane (`d3a8c8d`), so both enforcing sites carry it at
lane tip `82678b6`.

So the frozen-at-`v1` assertion in `rendered.test.tsx` is **no longer the fleet's only guard** — and
it is still worth keeping, for a reason the core's test cannot cover. The core now guards the
contract at the **producer** end (a fresh identity is emitted); this binding guards it at the
**consumer** end (a fresh identity actually repaints a rendered component, across Solid's own
equality gate). A change that satisfied the first and broke the second — Solid altering its default
`equals`, or this binding acquiring a comparator — would pass the core suite and freeze every Solid
app. Two ends, two tests; neither is redundant with the other.

## Ranked gaps

1. ~~The identity contract is unpinned.~~ **Closed.** Fresh-identity-per-emit is ruled a contract and
   is now pinned in the core at both enforcing sites, with a test carrying its own control (`cd07df1`
    - `d3a8c8d`, lane tip `82678b6`; verified here, Reviewer's review of that lane still running). The
      assertion in this repo stays as the **consumer-end** half of the guard — see Ruling 2.
2. ~~No SSR harness.~~ **Closed.** `vitest.ssr.config.mts` runs a second project against Solid's
   server build, and `capability.ssr.test.tsx` executes the SSR half with a positive control
   proving it is not the browser build. SSR-1..3 moved `partial` → `provisional`. **Residual, and
   narrower:** the _hydration_ leg is still unexecuted — asserting it needs the server and browser
   builds cooperating in one process, which this harness cannot do (`renderToString` is a
   non-functional stub under the browser conditions the main project requires, so a hydration test
   there would pass vacuously). Deferred to the E2E wave, where a real browser makes it cheap.
3. **`^0.4.1` cannot resolve the reland.** Local symlink hides it; CI and any real install pull
   0.4.x. Owned by the release wave, guarded here by the precondition test.
4. **OBS-1 diagnostic absent.** Needs an owner decision (core or binding) before it can be graded.
5. **`data-ls-dont-translate` is inert** — a binding-invented DOM contract the core reads nowhere.
   Shared with the Angular lane; resolve once, both places.

## Reproducing this file's evidence

```bash
npm link ../langsys-js-typescript   # bench: local core, not the registry tarball
npm test                            # 86 tests / 9 files — runs BOTH projects
npm run test:ssr                    # the 3 server-build tests alone
npm run typecheck
npm run build
```

Every probe in this file is the `probe()` filter from §3 — a `grep` over `src/`, excluding
`*.test.ts` **and comment lines** — paired with the identical probe over
`langsys-js-typescript/src/` as its positive control. Patterns are stated inline per row so they
can be re-run rather than trusted, and a probe whose control returns zero is reported as a broken
probe rather than a passing row.
