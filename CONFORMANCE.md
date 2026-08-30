# CONFORMANCE — langsys-js-solid

Conformance of this **binding** against the SDK Behaviour Spec.

|                             |                                                                                                                                                 |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Spec version                | **7** (`specVersion: 7`)                                                                                                                        |
| Spec text read              | `docs/sdk-spec.mdx` blob `06ae105a0a1f7b5245ec32929f0b3885c63f0336`, from `langsys2` `origin/main` @ `fabe22b2a54a06a6c7957b0ad06c52cc1274a4b5` |
| Read at                     | 2026-08-29T18:38:48Z                                                                                                                            |
| Repo state                  | `feature/838_write_key_gating`, branched from `main` @ `d330333`                                                                                |
| Suite                       | **69 tests / 8 files**, all passing — 66 browser-build + 3 SSR-build                                                                            |
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

| Rule                                                              | Grade         | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **BIND-1** — adapt shape/timing, never meaning                    | `provisional` | Adaptation is confined to Solid's execution model: SDK `Signal` → Solid `Accessor` (`useSignal`), `createRoot`/`createComputed` for the locale adapter, mount/destroy component glue, and the hydration timing in `useWriteEnabled`. The one adapter BIND-1 names as its worked trap — grant provider resolution — is per call and **mutation-tested**: snapshotting turns 3 tests red. The locale store is asserted to round-trip input **verbatim** (`rendered.test.tsx`), so the binding cannot drift from the core's canonicalization by quietly normalizing on its own. Raw `writeEnabled` is deliberately **not** re-exported — reading it synchronously is the hydration hazard `useWriteEnabled()` exists to avoid — and that absence is marked at the export site _and_ pinned by an assertion, so re-adding it lands red.                                               |
| **BIND-2** — never branch on server-computed capability           | `provisional` | `useWriteEnabled()` surfaces the core's `writeEnabled` **unchanged** and branches on nothing. Probe for `write_enabled`/`key_type`/`keyType` in `src/`: **0**, control **7** and **12** in the core. This binding exposes **no `keyType` at all** — the capability signal it offers is the one GATE-1 mandates, not the one GATE-1 forbids deciding from.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **BIND-3** — owns no network behaviour                            | `delegated`   | Code-only probe (§3 method) for `fetch\|XMLHttpRequest\|setTimeout\|setInterval\|retry\|backoff\|headers`: **0 in this binding, 17 in the core.** No scheduling, no request construction, no header setting. The binding never touches a URL at all.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **BIND-4** — introduces no configuration the core does not define | `provisional` | `iLangsysInitConfig` adds **no new keys**. It re-types two the core already defines: `UserLocaleStore` (`Signal<string>`, which the core's own type already is) and `writeGrant` (widened to accept a Solid accessor — an arm structurally identical to the core's existing callback arm). No `discovery`, `hint`, `suppress`, interval or threshold option exists; probe **0**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **BIND-5** — does not cache lookup results                        | `delegated`   | **Closed by ruling as conforming-by-absence.** Registration is idempotent per tuple and discovery requires re-entry **per URL** (`translations.ts:277` records the miss _before_ the `sameToken` dedup at `:287-290`, keyed on `location.href` throughout `discovery.ts`) — so the rule bites only bindings carrying a **lookup cache** in front of `t()`. This binding has none: probe for `createMemo\|useMemo\|cache(` → **0** (control: 15 reactive primitives in use). Its two `===` equality gates govern **re-rendering**, not lookup suppression. Verified by measurement, not inference: on a simulated navigation a re-mounted component re-enters `t()` while a persistent one does not (1 of 2) — Solid's own render semantics, identical to using the core directly, and not a binding-authored cache. (TS ruling, `838-intake-solid`, citations at core `6cdb388`.) |
| **BIND-6** — wrap the narrowest surface possible                  | `provisional` | **Was the worst row in this file; now the best-guarded.** `LangsysApp` is the core singleton forwarded through a `Proxy` **by reference** — `LangsysApp.foo === core.foo` is asserted by identity for every core method — with exactly two overrides (`init`, `setWriteGrant`), each for a stated reason. `surface.test.ts` (27 tests) guards the **structure**, not a method list, so the next core addition cannot go missing quietly. See [the silent-drop mechanism](#the-silent-drop-mechanism).                                                                                                                                                                                                                                                                                                                                                                             |

## 2 — Rules this binding could interfere with

Solid code sits between the app and the core on three paths: the **primitives** (every reactive
read), the **components** (DOM tokenizing), and now the **grant adapter**. Everything below is
graded on those.

| Rule                                                                       | Grade           | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **GATE-1** — decide from `write_enabled`, never `key_type`                 | `delegated`     | The binding makes no register-or-report decision. Probe for `write_enabled` in `src/`: **0**; positive control **7** in the core. `useWriteEnabled()` reads the core's signal and forwards it; it never computes a decision.                                                                                                                                                                                                                                                                                                                                                                                              |
| **GATE-2** — collect always; choose the lane at the send site              | `delegated`     | **Closed by the same ruling.** The binding never collects or sends, and — the open concern — it does not suppress the `t()` call that feeds collection, since it holds no lookup cache (BIND-5 row). The lane choice happens at the core's flush site (`translations.ts:280-284`), which this binding cannot reach.                                                                                                                                                                                                                                                                                                       |
| **GATE-3** — never persist the write decision                              | `delegated`     | Probe for `localStorage\|sessionStorage\|persist`: **0 in this binding, 6 in the core.** `useWriteEnabled` holds its value in a Solid signal owned by the calling component and disposed with it — asserted in `capability.test.ts` ("stops observing the core once the owning root is disposed"). Nothing outlives the page session.                                                                                                                                                                                                                                                                                     |
| **GATE-4** — strip the decision from whatever you cache                    | `n-a`           | The binding caches no response envelope and no catalog. There is nothing here for a write decision to be embedded in.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **GATE-7** — every detecting path feeds exactly one lane                   | `delegated`     | **Closed by the same ruling.** Per-URL discovery lives core-side and is ordered before the registration dedup by construction. No Solid code sits between a miss and its lane.                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **GATE-8** — missing `write_enabled` is a version signal, never permission | `provisional`   | The binding's obligation is not to collapse the tri-state, and it does not: `useWriteEnabled()` returns `Accessor<boolean \| undefined>` and **`undefined` is never defaulted to `false`** — asserted explicitly, and `false` is asserted to remain distinguishable from `undefined` once resolved (`capability.test.ts`). The version-signal inference itself is the core's and is not reached here.                                                                                                                                                                                                                     |
| **CAT-1** — a miss is decided by key presence, not truthiness              | `delegated`     | **Closed by the same ruling.** The present-with-null vs absent distinction lives entirely core-side; the binding reads no catalog directly (`useTranslations()` forwards `sTranslations` by reference) and caches nothing that could collapse the two states.                                                                                                                                                                                                                                                                                                                                                             |
| **GRANT-1** — provider callback, documented as the default form            | `provisional`   | `writeGrant` accepts a string, a sync/async callback, **or a Solid accessor**. The README documents the signal/callback form as the default and states why the string form is quickstart-only (grants live ~5 min; an app inits once).                                                                                                                                                                                                                                                                                                                                                                                    |
| **GRANT-2** — resolve the grant per request; never cache the token         | `provisional`   | `adaptWriteGrant` returns `() => untrack(grant)` — resolved on **every** call, never at adapt time. This is BIND-1's named costume trap and is the one row here proven by mutation: replacing it with a snapshot turns 3 tests red, including one that refreshes the token four times through a login/logout cycle.                                                                                                                                                                                                                                                                                                       |
| **GRANT-3** — `setWriteGrant()` must re-authorize, not merely set config   | `delegated`     | `LangsysApp.setWriteGrant` adapts the grant shape and delegates to the core's method, which owns the re-authorization. The binding adds no configuration-only path. Probe: the binding contains no authorization logic (`applyAuthorization` is forwarded by reference, not re-implemented — asserted in `surface.test.ts`).                                                                                                                                                                                                                                                                                              |
| **GRANT-4** — send the grant as `X-Write-Grant`                            | `delegated`     | Header construction is the core's; BIND-3 probe confirms the binding sets no headers (**0** vs **17**).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **OBS-1** — surface an unusable capability at least once                   | `partial` (gap) | The binding emits no diagnostic when authorization resolves `write_enabled: false` on a key expected to write. `useWriteEnabled()` makes the state _readable_, which is a precondition for an app to surface it, but nothing warns on its own. Whether the diagnostic is the core's or the binding's is unsettled; listed so it is countable rather than invisible.                                                                                                                                                                                                                                                       |
| **SSR-1..3** — do not collect server-side; degrade loudly                  | `provisional`   | **Now executed, not reasoned.** `capability.ssr.test.tsx` runs against Solid's **server build** (`vitest.ssr.config.mts`) and asserts `useWriteEnabled()` renders the undecided branch even when the core already holds `true` — and separately that a `false` does not leak either. Positive control asserts `isServer` and that `renderToString` really renders, so the browser build cannot make these vacuous. The guard is `onMount`, which never runs server-side. Mutation-checked: seeding eagerly turns both SSR assertions red. The three components remain client-only by construction and documented as such. |
| **WIRE-3** — lowercase `xx-yy` on the wire                                 | `delegated`     | The binding performs no locale string manipulation — probe for `toLowerCase\|toUpperCase\|replace(\|normalize` in `src/`: **0**. Verified **side by side with the resolved core**, never a double: `canonicalizeLocale` maps `en-US`→`en-us`, `es-ES`→`es-es`, `ES-es`→`es-es`, `fr-FR`→`fr-fr`. That side-by-side **found a live documentation defect** — see [The locale casing defect](#the-locale-casing-defect).                                                                                                                                                                                                     |
| **WIRE-5** — reachable test double, documented where integrators look      | `provisional`   | `LangsysAppAPI` is re-exported by reference, so `setBaseUrl()` is reachable without an artifact edit, and the playground's `VITE_LANGSYS_API_URL` is documented in `.env.example` where an integrator looks. The binding introduces no `apiUrl` config of its own (BIND-4).                                                                                                                                                                                                                                                                                                                                               |
| **CACHE-1** — cache keys namespaced by project                             | `n-a`           | The binding holds no cross-session or shared cache. The only state it owns is per-component Solid signals, created and disposed with their owner. Nothing is process-external or shared by default, which is the hazard CACHE-1 names.                                                                                                                                                                                                                                                                                                                                                                                    |
| **CID-2** — no-category is `''`, never `null`/`undefined`                  | `provisional`   | Both components default with `?? ''`: `category: props.category ?? ''` and `custom_id: props.custom_id ?? ''` (`Translate.ts:59-60`), matching the rule exactly rather than forwarding `undefined`.                                                                                                                                                                                                                                                                                                                                                                                                                       |

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

| Family                                             | Probe pattern                                                                                                                   | Mine                           | Control (core) | Reading                                                                                                                                                                       |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CID-1..4** (`custom_id`)                         | `custom_id\|customId\|generateCustomId\|md5`                                                                                    | **2** — pass-through prop only | **37**         | **No generation, no hashing, no id derivation.** Both hits are `Translate.ts`: the prop declaration and `custom_id: props.custom_id ?? ''` handed verbatim to the core class. |
| **ICU-1..5** (interpolation recovery)              | `intl-messageformat\|interpolate\|isICU\|plural`                                                                                | **0**                          | **15**         | Params pass through as `Record<string, ParamPrimitive>`; the core formats and recovers.                                                                                       |
| **REG-1..12** (write lane)                         | `batch\|flush\|keepalive\|sendBeacon\|debounce\|queue`                                                                          | **0**                          | **42**         | No scheduling, batching, or teardown flush.                                                                                                                                   |
| **BIND-3 / network**                               | `fetch\(\|XMLHttpRequest\|setTimeout\|setInterval\|retry\|backoff\|headers`                                                     | **0**                          | **17**         | No network behaviour of any kind.                                                                                                                                             |
| **HINT-1..12** (discovery reports)                 | `location\|href\|hint\|discover\|fragment`                                                                                      | **0**                          | **25**         | The hint lane reads the URL **inside the core**. No Solid code is on that path — there is no seam here to conform through.                                                    |
| **GATE-5, GATE-6** (bookkeeping, lane exclusivity) | `isContentBlockKnown\|registerContentBlock\|isPhraseMarked\|PHRASE_MARKER\|isTranslationExcluded\|sTranslations\.(set\|update)` | **2** — DOM contract only      | **28**         | No "already seen" bookkeeping; the binding never writes the catalog store. Both hits are the marker attribute, below.                                                         |
| **GATE-3** (never persist the decision)            | `localStorage\|sessionStorage\|persist`                                                                                         | **0**                          | **6**          | This binding writes to no storage of any kind.                                                                                                                                |
| **GATE-1** (server-computed capability)            | `write_enabled`                                                                                                                 | **0**                          | **7**          | The binding never reads the wire field; it forwards the core's signal.                                                                                                        |
| **GATE-8** (key-type inference)                    | `key_type\|keyType`                                                                                                             | **0**                          | **12**         | **No `keyType` surface exists here at all** — nothing invites a consumer to gate on key type.                                                                                 |
| **CACHE-1** (namespaced cache keys)                | `cacheKey\|persist\(\|setPersistStorage\|PersistStorage`                                                                        | **0**                          | **7**          | The binding owns no cache to namespace.                                                                                                                                       |

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

It had already happened **six times** when this audit found it. Measured against the core's
prototype:

| Core method                  | Reachable through the old class?     |
| ---------------------------- | ------------------------------------ |
| `setWriteGrant`              | **no** — the whole 838 grant surface |
| `applyAuthorization`         | **no**                               |
| `getUserLanguagePreferences` | **no**                               |
| `parseAcceptLanguageHeader`  | **no**                               |
| `findBestLocaleMatch`        | **no**                               |
| `resolveLocale`              | **no**                               |

Adding `setWriteGrant` to the list would have closed the gap and left the mechanism running for
the next core release. So the fix is structural: forward by reference through a `Proxy`, override
exactly two methods, and let `surface.test.ts` assert the **structure** — every core prototype
method is reachable, and every non-overridden one is the core's own function object by identity.
A test naming today's methods would have rotted into the same blind spot.

Forwarded members are deliberately **unbound**. Binding them would make a destructured method keep
working here while the identical destructure off the core singleton breaks — a behaviour
difference, which is what BIND-1 forbids a binding from introducing. This is safe only because the
core class uses no `#private` fields (verified); the identity assertion in `surface.test.ts` is
what makes that stop being true loudly rather than silently.

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

Each new behaviour was mutated to confirm its test actually catches it. All five mutations were
reverted; the suite is green at the recorded SHA.

| Mutation                                                                                            | Expected to break     | Result                                                                                     |
| --------------------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------ |
| Seed `useWriteEnabled` from `writeEnabled.get()` (drop the mount guard)                             | hydration + tri-state | **2 failed** — the seed test and the adoption test                                         |
| Snapshot the grant at adapt time instead of resolving per call                                      | GRANT-2               | **3 failed** — incl. the four-refresh login/logout cycle                                   |
| Hide one core method from the proxy (re-create the enumerating blind spot)                          | BIND-6                | **2 failed** — the per-method forwarding test and the 838-surface test                     |
| Subscribe but never propagate — **the Angular failure shape** (value arrives, framework never told) | repaint               | **4 failed** — 2 accessor, **2 rendered-template**                                         |
| Seed eagerly, dropping the `onMount` guard, checked against the SSR project                         | SSR-1..3              | **2 failed** — both server-render assertions; the browser project alone could not see this |

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

They are pinning it now, with comments at both sites and an identity-reuse test. **Until that pin
lands, the frozen-at-`v1` rendered-template assertion in `rendered.test.tsx` is the only guard in the
fleet against that regression** — it is a cross-repo canary living in this binding, not a local
nicety, and should not be deleted as redundant when the core's own test appears.

## Ranked gaps

1. **The identity contract is now ruled, and the pin is pending.** Fresh-identity-per-emit is a
   contract, not an implementation detail (Ruling 2 above). The Typescript lane is adding comments at
   both sites and an identity-reuse test; **this row retires when that pin lands.** Until then the
   frozen-at-`v1` assertion here is the fleet's only guard, so it is load-bearing outside this repo.
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
npm test                            # 69 tests / 8 files — runs BOTH projects
npm run test:ssr                    # the 3 server-build tests alone
npm run typecheck
npm run build
```

Every probe in this file is the `probe()` filter from §3 — a `grep` over `src/`, excluding
`*.test.ts` **and comment lines** — paired with the identical probe over
`langsys-js-typescript/src/` as its positive control. Patterns are stated inline per row so they
can be re-run rather than trusted, and a probe whose control returns zero is reported as a broken
probe rather than a passing row.
