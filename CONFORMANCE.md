# CONFORMANCE — langsys-js-solid

Conformance of this **binding** against the SDK Behaviour Spec.

|                        |                                                                                                                                                                                                                                                                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Spec revision read** | langsys2 5cff03a17751e7dae9dcf1af52a9454d027c9006, docs/sdk-spec.mdx blob 5c5c0723f88fb8e6b13f58876c7adca8b6b35691                                                                                                                                                                                                           |
| **Profiles**           | browser, binding, all — derived: binding over langsys-js-typescript                                                                                                                                                                                                                                                          |
| **Spec version**       | 8.0.1 — 79 rules                                                                                                                                                                                                                                                                                                             |
| **Re-derived**         | 2026-09-12 with `git -C ~/Documents/dev/langsys2 ls-tree 5cff03a17751e7dae9dcf1af52a9454d027c9006 docs/sdk-spec.mdx`. The origin fetch failed (the spec host was unreachable), so the commit and blob were verified from the local object store; the commit is not yet on `origin/main`.                                     |
| **Repo state**         | `feature/838_write_key_gating`                                                                                                                                                                                                                                                                                               |
| **Suite**              | **102 tests / 11 files**, all passing: 99 browser-build + 3 SSR-build (typecheck, test and build each exit 0)                                                                                                                                                                                                                |
| **Core consumed**      | `langsys-js-typescript` at `f58e0c43593108fc42b33524e634ac13c94fbbee` through `npm link`, src clean at probe time, dist built 11s before that commit. `package.json` declares `^0.6.5`, the core version built against; it must match the core version that ships in the release wave (see [The two 0.6.5s](#the-two-065s)). |
| **Tally**              | 59 delegated, 13 implemented, 6 not implemented, 1 n/a (profile)                                                                                                                                                                                                                                                             |

**What surfaced while writing this:**

- **`<Translate>` and `<Phrase>` crash a server render.** Rendered under Solid's server build they throw
  `ReferenceError: document is not defined`. A SolidStart page containing either fails its SSR response.
  Found by running the server build for SRV, and ranked first below.
- **The dependency record was false.** `package.json` said `^0.4.1` and the lockfile resolved the
  registry's `0.4.1`, while this file said the build ran against local `0.6.5`.
- **A probe with a dead control.** WIRE-1's pattern was case-sensitive and the core writes
  `x-Authorization`, so the control returned 0: a probe that could not have found anything, not a clean
  binding. Re-run case-insensitively; every probe now is.
- **A timeout reported as a failure.** The type-surface test spawned `tsc` inside a test body and crossed
  vitest's 5000ms default once the core's `.d.ts` grew. Nothing was wrong with the types.
- **A harness that reported nothing.** The first run of the leaf-stamp mutation printed no summary at all.
  Rerun with full output it turns 2 tests red.
- **A redundant default.** The binding's `category ?? ''` is unnecessary: the core already maps `undefined`
  and `null` to the empty-string slot, measured by identical ids.

## Scope

Every one of the spec's 79 rule ids is rowed exactly once below. This is a **binding**: its profile is
derived over `langsys-js-typescript`, so a rule the core owns is graded `delegated` here, naming the core
row, its current core grade, and an absence probe whose control fires against the core. A delegated row is
green for this binding and says nothing about whether the core has proven the property: where the core
grades its own row `provisional` or "no test", that gap belongs to the core lane and is visible in the row.

Rules this binding can meet or break by its own code (BIND, capability surfacing, grant adaptation,
host stamping, test-double reachability, and the evidence rules) are graded on this binding's tests.
Rules whose Profiles line binds a binding performing a server render (SRV) are graded on measurements of
this binding under Solid's server build.

## Vocabulary

**Status** is one of `implemented`, `provisional`, `delegated`, `partial`, `not implemented`,
`held (strip ruling)`, `waived`, `n/a (profile: <p>)` or `n/a (architecture: <reason>)`. **Tier** is one
of `live`, `contract`, `mock`, `n/a (pure)` or `-`.

The tier describes the evidence for the property the rule governs, not whether a double appears in a
test. `live`, `contract` and `mock` apply only where that property depends on what the API answers.
In-process behaviour (DOM tests with no server involved), meta-rules, artifact inspection with a positive
control, and isolation properties are `n/a (pure)`. `delegated`, `not implemented` and `n/a` rows take `-`.

## Status

| Rule    | Status                | Tier       | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------- | --------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GATE-1  | delegated             | -          | Core row GATE-1 (core-graded: provisional). The binding makes no register-or-report decision. probe GATE1 mine 0 / core 9 (firing control).                                                                                                                                                                                                                                                                                                                                                                |
| GATE-2  | delegated             | -          | Core row GATE-2 (core-graded: provisional). Collection and the lane choice are the core's; no lookup cache here could suppress the `t()` call that feeds collection (BIND-5). probe GATE1 mine 0 / core 9 (firing control).                                                                                                                                                                                                                                                                                |
| GATE-3  | delegated             | -          | Core row GATE-3 (core-graded: provisional, no test). The binding writes no storage. probe GATE3 mine 0 / core 18 (firing control).                                                                                                                                                                                                                                                                                                                                                                         |
| GATE-4  | delegated             | -          | Core row GATE-4 (core-graded: provisional, no test). The binding caches no response envelope. probe CACHE mine 0 / core 7 (firing control).                                                                                                                                                                                                                                                                                                                                                                |
| GATE-5  | delegated             | -          | Core row GATE-5 (core-graded: provisional). No already-seen bookkeeping. probe GATE56 mine 0 / core 18 (firing control).                                                                                                                                                                                                                                                                                                                                                                                   |
| GATE-6  | delegated             | -          | Core row GATE-6 (core-graded: provisional). probe GATE56 mine 0 / core 18 (firing control).                                                                                                                                                                                                                                                                                                                                                                                                                |
| GATE-7  | delegated             | -          | Core row GATE-7 (core-graded: provisional). Per-URL discovery is ordered before the registration dedup core-side (Typescript ruling). probe GATE1 mine 0 / core 9 (firing control).                                                                                                                                                                                                                                                                                                                        |
| GATE-8  | delegated             | -          | Core row GATE-8 (core-graded: implemented). The binding does no key-type fallback and reads no cache; the tri-state it surfaces is pinned under BIND-2. probe GATE8 mine 0 / core 18 (firing control).                                                                                                                                                                                                                                                                                                     |
| CAT-1   | delegated             | -          | Core row CAT-1 (core-graded: implemented). The binding reads no catalog value; `useTranslations()` forwards the signal by reference. probe CAT mine 0 / core 12 (firing control).                                                                                                                                                                                                                                                                                                                          |
| CAT-2   | delegated             | -          | Core row CAT-2 (core-graded: implemented). The binding reads no catalog value; `useTranslations()` forwards the signal by reference. probe CAT mine 0 / core 12 (firing control).                                                                                                                                                                                                                                                                                                                          |
| CAT-3   | delegated             | -          | Core row CAT-3 (core-graded: provisional, no test). The binding reads no catalog value; `useTranslations()` forwards the signal by reference. probe CAT mine 0 / core 12 (firing control).                                                                                                                                                                                                                                                                                                                 |
| REG-1   | delegated             | -          | Core row REG-1 (core-graded: provisional). No scheduling, batching or teardown flush in the binding. probe REG mine 0 / core 58 (firing control).                                                                                                                                                                                                                                                                                                                                                          |
| REG-2   | delegated             | -          | Core row REG-2 (core-graded: provisional). probe REG mine 0 / core 58 (firing control).                                                                                                                                                                                                                                                                                                                                                                                                                    |
| REG-3   | delegated             | -          | Core row REG-3 (core-graded: provisional). probe REG mine 0 / core 58 (firing control).                                                                                                                                                                                                                                                                                                                                                                                                                    |
| REG-4   | delegated             | -          | Core row REG-4 (core-graded: provisional). probe REG mine 0 / core 58 (firing control).                                                                                                                                                                                                                                                                                                                                                                                                                    |
| REG-5   | delegated             | -          | Core row REG-5 (core-graded: provisional). probe REG mine 0 / core 58 (firing control).                                                                                                                                                                                                                                                                                                                                                                                                                    |
| REG-6   | delegated             | -          | Core row REG-6 (core-graded: provisional). probe REG mine 0 / core 58 (firing control).                                                                                                                                                                                                                                                                                                                                                                                                                    |
| REG-7   | delegated             | -          | Core row REG-7 (core-graded: provisional). probe REG mine 0 / core 58 (firing control).                                                                                                                                                                                                                                                                                                                                                                                                                    |
| REG-8   | delegated             | -          | Core row REG-8 (core-graded: provisional). probe REG mine 0 / core 58 (firing control).                                                                                                                                                                                                                                                                                                                                                                                                                    |
| REG-9   | delegated             | -          | Core row REG-9 (core-graded: provisional). probe REG mine 0 / core 58 (firing control).                                                                                                                                                                                                                                                                                                                                                                                                                    |
| REG-10  | delegated             | -          | Core row REG-10 (core-graded: provisional). probe REG mine 0 / core 58 (firing control).                                                                                                                                                                                                                                                                                                                                                                                                                   |
| REG-11  | delegated             | -          | Core row REG-11 (core-graded: implemented). probe REG mine 0 / core 58 (firing control).                                                                                                                                                                                                                                                                                                                                                                                                                   |
| REG-12  | delegated             | -          | Core row REG-12 (core-graded: provisional, no test). probe REG mine 0 / core 58 (firing control).                                                                                                                                                                                                                                                                                                                                                                                                          |
| HINT-1  | delegated             | -          | Core row HINT-1 (core-graded: implemented). The report lane, and the URL it carries, live inside the core. probe HINT mine 0 / core 56 (firing control).                                                                                                                                                                                                                                                                                                                                                   |
| HINT-2  | n/a (profile: server) | -          | Server SDKs never report; this SDK claims no server profile.                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| HINT-3  | delegated             | -          | Core row HINT-3 (core-graded: provisional). The report lane, and the URL it carries, live inside the core. probe HINT mine 0 / core 56 (firing control).                                                                                                                                                                                                                                                                                                                                                   |
| HINT-4  | not implemented       | -          | The cap is the core's (core row HINT-4, core-graded: provisional), but HINT-4's own note says a binding in the persistent-layout shape records a known non-capture rather than conformance. This binding is in that shape, measured: across a navigation a re-mounted component re-enters `t()` and a persistent one does not (1 of 2), so no URL is captured for the new route. Closes when the navigation entry point lands.                                                                             |
| HINT-5  | delegated             | -          | Core row HINT-5 (core-graded: provisional). probe HINT mine 0 / core 56 (firing control).                                                                                                                                                                                                                                                                                                                                                                                                                  |
| HINT-6  | delegated             | -          | Core row HINT-6 (core-graded: implemented). probe HINT mine 0 / core 56 (firing control).                                                                                                                                                                                                                                                                                                                                                                                                                  |
| HINT-7  | delegated             | -          | Core row HINT-7 (core-graded: provisional). probe HINT mine 0 / core 56 (firing control).                                                                                                                                                                                                                                                                                                                                                                                                                  |
| HINT-8  | delegated             | -          | Core row HINT-8 (core-graded: provisional). probe HINT mine 0 / core 56 (firing control).                                                                                                                                                                                                                                                                                                                                                                                                                  |
| HINT-9  | delegated             | -          | Core row HINT-9 (core-graded: provisional). probe HINT mine 0 / core 56 (firing control).                                                                                                                                                                                                                                                                                                                                                                                                                  |
| HINT-10 | delegated             | -          | Core row HINT-10 (core-graded: implemented). probe HINT mine 0 / core 56 (firing control).                                                                                                                                                                                                                                                                                                                                                                                                                 |
| HINT-11 | delegated             | -          | Core row HINT-11 (core-graded: implemented). probe HINT mine 0 / core 56 (firing control).                                                                                                                                                                                                                                                                                                                                                                                                                 |
| HINT-12 | delegated             | -          | Core row HINT-12 (core-graded: implemented). probe HINT mine 0 / core 56 (firing control).                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ICU-1   | delegated             | -          | Core row ICU-1 (core-graded: corroborated). Params pass through as `ParamPrimitive`; the core formats and recovers. probe ICU mine 0 / core 21 (firing control).                                                                                                                                                                                                                                                                                                                                           |
| ICU-2   | delegated             | -          | Core row ICU-2 (core-graded: corroborated). probe ICU mine 0 / core 21 (firing control).                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ICU-3   | delegated             | -          | Core row ICU-3 (core-graded: corroborated). probe ICU mine 0 / core 21 (firing control).                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ICU-4   | delegated             | -          | Core row ICU-4 (core-graded: implemented). probe ICU mine 0 / core 21 (firing control).                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ICU-5   | delegated             | -          | Core row ICU-5 (core-graded: corroborated). probe ICU mine 0 / core 21 (firing control).                                                                                                                                                                                                                                                                                                                                                                                                                   |
| CID-1   | delegated             | -          | Core row CID-1 (core-graded: corroborated). The binding derives no id; `custom_id` is handed to the core verbatim. probe CIDGEN mine 0 / core 24 (firing control).                                                                                                                                                                                                                                                                                                                                         |
| CID-2   | delegated             | -          | Core row CID-2 (core-graded: implemented). The core maps `undefined` and `null` to the empty-string slot itself (measured: identical ids), so the binding's own `?? ''` is redundant; removing it leaves `src/mark.test.tsx` green. probe CIDGEN mine 0 / core 24 (firing control).                                                                                                                                                                                                                        |
| CID-3   | delegated             | -          | Core row CID-3 (core-graded: implemented). Legacy-id tolerance lives in the core Translate lookup; the binding passes the host and `custom_id` only. probe CIDLEG mine 0 / core 11 (firing control).                                                                                                                                                                                                                                                                                                       |
| CID-4   | delegated             | -          | Core row CID-4 (core-graded: corroborated). probe CIDGEN mine 0 / core 24 (firing control).                                                                                                                                                                                                                                                                                                                                                                                                                |
| TOK-1   | delegated             | -          | Core row TOK-1 (core-graded: implemented). The binding tokenizes nothing. probe TOK mine 0 / core 37 (firing control).                                                                                                                                                                                                                                                                                                                                                                                     |
| TOK-2   | delegated             | -          | Core row TOK-2 (core-graded: implemented). probe TOK mine 0 / core 37 (firing control).                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TOK-3   | delegated             | -          | Core row TOK-3 (core-graded: implemented). probe TOK mine 0 / core 37 (firing control).                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TOK-4   | delegated             | -          | Core row TOK-4 (core-graded: implemented). probe TOK mine 0 / core 37 (firing control).                                                                                                                                                                                                                                                                                                                                                                                                                    |
| TOK-5   | delegated             | -          | Core row TOK-5 (core-graded: implemented). probe TOK mine 0 / core 37 (firing control).                                                                                                                                                                                                                                                                                                                                                                                                                    |
| MARK-1  | implemented           | n/a (pure) | `src/mark.test.tsx`, on both render paths. Block: the host `<Translate>` renders carries `data-ls-contentblock` equal to the id re-derived by tokenizing an independent copy of the markup, with and without a category. Leaf: the `<Phrase>` host carries `data-ls-phrase`, stamped by this binding itself. Mutations: stop the binding's stamp, 2 red; hand the core a detached host, 2 red; hand the core Phrase a detached host, 0 red, which is how the leaf stamp is known to be this binding's own. |
| MARK-2  | delegated             | -          | Core row MARK-2 (core-graded: implemented). The binding reads no host identity on either path. probe MARKRD mine 0 / core 24 (firing control).                                                                                                                                                                                                                                                                                                                                                             |
| SSR-1   | delegated             | -          | Core row SSR-1 (core-graded: provisional). Strategy selection and server-side collection are the core's. Capability markup under SSR is separately pinned undecided in `src/capability.ssr.test.tsx` (BIND-1). probe SSR mine 0 / core 23 (firing control).                                                                                                                                                                                                                                                |
| SSR-2   | delegated             | -          | Core row SSR-2 (core-graded: provisional). probe SSR mine 0 / core 23 (firing control).                                                                                                                                                                                                                                                                                                                                                                                                                    |
| SSR-3   | delegated             | -          | Core row SSR-3 (core-graded: provisional, no test). probe SSR mine 0 / core 23 (firing control).                                                                                                                                                                                                                                                                                                                                                                                                           |
| SRV-1   | not implemented       | -          | Measured under Solid's server build: with no seed, `t()` serves the base language; with a hand-seeded catalog it serves the translation, but only through the core's process-global. `<Translate>` and `<Phrase>` throw `ReferenceError: document is not defined` during server render. Not built, by instruction; where child capture lives is an open operator decision.                                                                                                                                 |
| SRV-2   | not implemented       | -          | The catalog is the core's module-global signal and nothing here scopes it to a request. Measured: after a `de` catalog is seeded, an `it` render in the same process serves the German text.                                                                                                                                                                                                                                                                                                               |
| SRV-3   | not implemented       | -          | No server-render collection exists or is tested here; the binding neither schedules collection after flush nor checks key type (probe SRVCOL mine 0 / core 31 (firing control)).                                                                                                                                                                                                                                                                                                                           |
| SRV-4   | not implemented       | -          | The core half exists and is reachable here: `LangsysApp.seedCatalog` is synchronous and forwarded (`src/mark.test.tsx` calls it). The binding half, seeding before hydration so the first client render matches the served HTML with the mismatch warning as positive control, has no test; it needs the server and browser builds in one run.                                                                                                                                                             |
| SRV-5   | not implemented       | -          | Measured: `<Translate>` and `<Phrase>` throw an unnamed `ReferenceError: document is not defined` under server render, rather than capturing children or failing with a named error. Once-per-subtree counting is untested.                                                                                                                                                                                                                                                                                |
| BIND-1  | implemented           | n/a (pure) | Adaptation is confined to Solid's execution model. `src/capability.test.ts` and `src/capability.ssr.test.tsx`: capability seeds `undefined` and adopts the core value only after mount (mutation: seed eagerly, 2 red in each project). `src/write-grant.test.ts`: the grant is resolved per call (mutation: snapshot at adapt time, 3 red). `src/rendered.test.tsx`: the locale store round-trips input verbatim.                                                                                         |
| BIND-2  | implemented           | n/a (pure) | `useWriteEnabled()` surfaces the core signal unchanged, tri-state preserved (`src/capability.test.ts`). No branch on server-computed capability: probe GATE1 mine 0 / core 9 (firing control); probe GATE8 mine 0 / core 18 (firing control). Raw `writeEnabled` is not re-exported, pinned in `src/surface.test.ts` (mutation: re-export it, 1 red).                                                                                                                                                      |
| BIND-3  | implemented           | n/a (pure) | Owns no network behaviour, by artifact inspection: probe NET mine 0 / core 22 (firing control). Pinned structurally by `src/surface.test.ts`, which forwards every method to the core rather than wrapping any.                                                                                                                                                                                                                                                                                            |
| BIND-4  | implemented           | n/a (pure) | `iLangsysInitConfig` adds no keys; it re-types two the core defines (`UserLocaleStore`, `writeGrant`). No discovery, hint or suppress option: probe HINT mine 0 / core 56 (firing control). The accessor arm of `writeGrant` is pinned in `src/write-grant.test.ts`.                                                                                                                                                                                                                                       |
| BIND-5  | implemented           | n/a (pure) | No lookup cache: probe MEMO mine 0 / core 3 (firing control). The identity dependency is proven at the DOM in `src/rendered.test.tsx`: a stable identity leaves text frozen at v1 while the fresh-identity control repaints. Typescript ruling: conforming by absence; the identity contract is pinned core-side at cd07df1.                                                                                                                                                                               |
| BIND-6  | implemented           | n/a (pure) | The core singleton is forwarded through a Proxy: methods bound to the core and cached per property, accessors and state by reference, overrides exactly `init` and `setWriteGrant`. `src/surface.test.ts` (structure, stability, destructuring, accessor identity) and `src/type-surface.test.ts` (the exported type refuses core-private members, 5 TS2339, positive control exits 0). Mutations: unbind, 4 red; bind without the cache, 1 red; bind accessors, 2 red; widen the type, 6 of 7 red.        |
| GRANT-1 | implemented           | n/a (pure) | `writeGrant` accepts a string, a sync or async callback, or a Solid accessor (`src/write-grant.test.ts`); the README documents the signal or callback form as the default.                                                                                                                                                                                                                                                                                                                                 |
| GRANT-2 | implemented           | n/a (pure) | `adaptWriteGrant` resolves the source on every call, untracked (`src/write-grant.test.ts`, four refreshes through a login and logout cycle). Mutation: snapshot at adapt time, 3 red.                                                                                                                                                                                                                                                                                                                      |
| GRANT-3 | delegated             | -          | Core row GRANT-3 (core-graded: implemented). The binding override adapts the grant's shape and delegates; re-authorization is the core's. probe GRANT3 mine 0 / core 4 (firing control).                                                                                                                                                                                                                                                                                                                   |
| GRANT-4 | delegated             | -          | Core row GRANT-4 (core-graded: implemented). The binding sets no header. probe NET mine 0 / core 22 (firing control).                                                                                                                                                                                                                                                                                                                                                                                      |
| CACHE-1 | delegated             | -          | Core row CACHE-1 (core-graded: implemented). The binding holds no cache. probe CACHE mine 0 / core 7 (firing control).                                                                                                                                                                                                                                                                                                                                                                                     |
| OBS-1   | delegated             | -          | Core row OBS-1 (core-graded: implemented). The diagnostic is emitted by the core at authorization; the binding emits none. probe OBS mine 0 / core 12 (firing control).                                                                                                                                                                                                                                                                                                                                    |
| WIRE-1  | delegated             | -          | Core row WIRE-1 (core-graded: provisional). The binding sets no auth header; probed case-insensitively after a case-sensitive probe returned a dead control. probe WIRE1 mine 0 / core 1 (firing control).                                                                                                                                                                                                                                                                                                 |
| WIRE-2  | delegated             | -          | Core row WIRE-2 (core-graded: provisional). probe WIRE2 mine 0 / core 14 (firing control).                                                                                                                                                                                                                                                                                                                                                                                                                 |
| WIRE-3  | delegated             | -          | Core row WIRE-3 (core-graded: implemented). The binding rewrites no locale; the store round-trips verbatim and the core's lowercase form is asserted side by side in `src/rendered.test.tsx`. probe WIRE3 mine 0 / core 19 (firing control).                                                                                                                                                                                                                                                               |
| WIRE-4  | delegated             | -          | Core row WIRE-4 (core-graded: provisional, no test). `t()` is the core's, and the binding adds no throw or catch path around it. The component crash under server render is recorded under SRV-5. probe WIRE4 mine 0 / core 26 (firing control).                                                                                                                                                                                                                                                           |
| WIRE-5  | implemented           | n/a (pure) | `LangsysAppAPI` is re-exported, so `setBaseUrl()` points the SDK at a double without editing the artifact (`src/surface.test.ts`, with a positive control on the core); `VITE_LANGSYS_API_URL` is documented in `.env.example`. Mutation: drop the re-export, 1 red.                                                                                                                                                                                                                                       |
| CONF-1  | implemented           | n/a (pure) | No test here asserts on spies, call arguments or outgoing payloads: probe mine 0 / core tests 75 (firing control). Every path: MARK-1 is proven on the block and leaf paths in `src/mark.test.tsx`, and repainting through rendered templates in `src/rendered.test.tsx`. The binding makes no network call, so nothing here could assert on what the SDK sent.                                                                                                                                            |
| CONF-2  | implemented           | n/a (pure) | Every row records its tier, and `src/conformance.test.ts` fails the build on a non-canonical tier or one its status cannot carry (positive control: an `implemented` row carrying `mock` is rejected).                                                                                                                                                                                                                                                                                                     |
| CONF-3  | implemented           | n/a (pure) | Runtime rules carry their recorded mutations in Check-the-verifier, each naming what was broken and which tests went red; `src/conformance.test.ts` fails if that table is empty. The fresh-process clause governs SSR strategy cases, which this binding does not run: probe SSR mine 0 / core 23 (firing control).                                                                                                                                                                                       |

## Probes

Every count is code only: comment and JSDoc lines are stripped, and test and type-probe files are
excluded. The same pattern runs over this binding's `src/` and, as its control, over the core's `src/` at
`f58e0c43593108fc42b33524e634ac13c94fbbee`. All patterns are **case-insensitive** after WIRE-1's
case-sensitive probe returned a dead control. A probe whose control returns zero is reported as a broken
probe, never as a passing row; none does.

```bash
probe() {  # $1 = pattern, $2 = tree
  grep -rniE "$1" "$2" --include='*.ts' --include='*.tsx' | grep -vE '\.(test|probe)\.tsx?:' | grep -vE ':[0-9]+: *(\*|//|/\*)'
}
CIDGEN='generateCustomId|generateLegacyCustomId|md5'
CIDLEG='md5Legacy|generateLegacyCustomId'
ICU='intl-messageformat|interpolate|isICU|plural'
REG='batch|flush|keepalive|sendBeacon|debounce|queue'
NET='fetch\(|XMLHttpRequest|setTimeout|setInterval|retry|backoff|headers'
HINT='location|href|hint|discover|fragment'
GATE56='isContentBlockKnown|registerContentBlock|isTranslationExcluded|sTranslations\.(set|update)'
GATE3='localStorage|sessionStorage|persist'
GATE1='write_enabled'
GATE8='key_type|keyType'
CACHE='cacheKey|persist\(|setPersistStorage|PersistStorage'
TOK='tokenizeElement|NON_TRANSLATABLE_ELEMENTS|TRANSLATABLE_ATTRIBUTES|normalizeMarkupPlaceholders|collapseWhitespace'
MARKRD='PHRASE_MARKER_ATTRS|_ATTR_LEGACY|data-langsys-|getAttribute\(|hasAttribute\('
WIRE1='x-authorization'
WIRE2='\b204\b|\.status\b|content-length'
WIRE3='toLowerCase|toUpperCase|localeCompare'
WIRE4='catch\s*\(|catch\s*\{'
CAT='sTranslations\.get\(|getValue\(|isContentBlockKnown\('
SSR='ssrTokenStrategy|isServer|typeof window'
GRANT3='applyAuthorization|authorize-project|reauthori'
OBS='noticeUnusableWriteCapability|console\.warn|logger\.warn'
SRVCOL='missingToken|recordMissForDiscovery|flushTokens'
MEMO='createMemo|useMemo|cache\('
REACT='createSignal|createComputed|createEffect|createRoot'
```

| Probe  | Mine | Core control | Used for                                                 |
| ------ | ---- | ------------ | -------------------------------------------------------- |
| CIDGEN | 0    | 24           | CID-1, CID-2, CID-4                                      |
| CIDLEG | 0    | 11           | CID-3                                                    |
| ICU    | 0    | 21           | ICU-1..5                                                 |
| REG    | 0    | 58           | REG-1..12                                                |
| NET    | 0    | 22           | BIND-3, GRANT-4                                          |
| HINT   | 0    | 56           | BIND-4, HINT-1, HINT-3, HINT-5..12                       |
| GATE56 | 0    | 18           | GATE-5, GATE-6                                           |
| GATE3  | 0    | 18           | GATE-3                                                   |
| GATE1  | 0    | 9            | BIND-2, GATE-1, GATE-2, GATE-7                           |
| GATE8  | 0    | 18           | BIND-2, GATE-8                                           |
| CACHE  | 0    | 7            | CACHE-1, GATE-4                                          |
| TOK    | 0    | 37           | TOK-1..5                                                 |
| MARKRD | 0    | 24           | MARK-2                                                   |
| WIRE1  | 0    | 1            | WIRE-1                                                   |
| WIRE2  | 0    | 14           | WIRE-2                                                   |
| WIRE3  | 0    | 19           | WIRE-3                                                   |
| WIRE4  | 0    | 26           | WIRE-4                                                   |
| CAT    | 0    | 12           | CAT-1..3                                                 |
| SSR    | 0    | 23           | CONF-3, SSR-1..3                                         |
| GRANT3 | 0    | 4            | GRANT-3                                                  |
| OBS    | 0    | 12           | OBS-1                                                    |
| SRVCOL | 0    | 31           | SRV-3                                                    |
| MEMO   | 0    | 3            | BIND-5                                                   |
| REACT  | 13   | 16           | control for MEMO: proves the probe sees Solid primitives |

The CONF-1 spy probe runs over test files instead:
`grep -rnE 'toHaveBeenCalled|mock\.calls|vi\.fn\(|spyOn\(|getRequests'` gives 0 over this binding's
`src/**/*.test.*` and 75 over the core's `tests/`.

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

**Sharper here than in the sibling bindings, and corrected (2026-09-12).** Until this revision the
package declared `langsys-js-typescript@^0.4.1`, a range that excluded 0.6.5 in _either_ form, and the
lockfile resolved the registry's `0.4.1` while this file claimed the build ran against local `0.6.5`. The
range is now `^0.6.5`, the core version this binding is built against. That range still resolves the
**registry** `0.6.5`, which lacks the 838 surface, so `npm ci` still swaps the bench for the wrong
artifact; the range must move to whatever core version ships in the release wave. Until then the
symlink is the only thing putting the 838 surface on the bench, and this test is the only thing that
notices when it goes.

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

Each new behaviour was mutated to confirm its test actually catches it. All mutations below were
reverted; the suite is green at the recorded SHA. **Every row below was re-measured at this tip on
2026-09-10, against current test names — the counts are not carried forward from when the table was
first written, and three of them had drifted.**

| Mutation                                                                                            | Expected to break            | Result                                                                                                                                                                                                                            |
| --------------------------------------------------------------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Seed `useWriteEnabled` from `writeEnabled.get()` (drop the mount guard)                             | hydration + tri-state        | **2 failed** — the seed test and the adoption test                                                                                                                                                                                |
| Snapshot the grant at adapt time instead of resolving per call                                      | GRANT-2                      | **3 failed** — incl. the four-refresh login/logout cycle                                                                                                                                                                          |
| Hide a **non-override** core method from the proxy — `if (prop === 'refresh') return undefined`     | BIND-6                       | **3 failed** — `forwards refresh`, the bound-delegate sweep, and override set-equality                                                                                                                                            |
| Hide the **override** instead — `if (prop === 'setWriteGrant') return undefined`                    | BIND-6                       | **2 failed** — `forwards setWriteGrant` and the dropped-public-member pin. Recorded separately because the count depends on which member is hidden, and a table row that does not say which is not reproducible                   |
| Subscribe but never propagate — **the Angular failure shape** (value arrives, framework never told) | repaint                      | **4 failed** — 2 accessor, **2 rendered-template**                                                                                                                                                                                |
| Seed eagerly, dropping the `onMount` guard, checked against the SSR project                         | SSR-1..3                     | **2 failed** — both server-render assertions; the browser project alone could not see this                                                                                                                                        |
| Widen the exported type — `Record<string, any> &` before the `Omit<…>`                              | BIND-6 v2(b)/(c)             | **6 failed** of 7 in `type-surface.test.ts`: the non-zero-exit row and all five `TS2339` rows. Only the positive control survives, which is the point of having one                                                               |
| Stop binding — return the raw function instead of the cached bind                                   | BIND-6 v2(e)                 | **4 failed** — bound-delegate sweep, override set-equality, the SYNC destructuring row, and `methods ARE still bound`                                                                                                             |
| Bind on every read with no cache (the sibling Svelte shape)                                         | referential stability        | **1 failed** — only the stability assertion, which is the property the cache adds                                                                                                                                                 |
| Bind accessors as well as methods (the bug shipped in `3f90503`)                                    | identity contract            | **2 failed** — `LangsysApp.t` identity, and the accessor sweep                                                                                                                                                                    |
| Leaf stamp removed from `<Phrase>` (`host.setAttribute(PHRASE_MARKER_ATTR, '')`)                    | MARK-1 leaf                  | **2 failed**: the leaf-path stamp and `Phrase > renders a marked host`. The first run of this mutation printed no summary line at all, an instrument failure in the harness rather than a green; rerun with the full output kept. |
| Core `Phrase` handed a detached element instead of the rendered host                                | provenance of the leaf stamp | **0 failed, as intended**: the core does not stamp `data-ls-phrase`, so the leaf marker is this binding's own work.                                                                                                               |
| Core `Translate` handed a detached element instead of the rendered host                             | MARK-1 block                 | **2 failed**: the block stamp with and without a category.                                                                                                                                                                        |
| `LangsysAppAPI` re-export removed                                                                   | WIRE-5                       | **1 failed**.                                                                                                                                                                                                                     |
| The binding's `category ?? ''` default removed                                                      | CID-2 redundancy             | **0 failed, as intended**: the core maps `undefined` and `null` to the empty-string slot itself (measured: identical ids), which is why CID-2 is delegated.                                                                       |
| `tsc` spawned inside a test body, unchanged code                                                    | harness                      | Red at 5611ms and 7185ms against the grown core: vitest's 5000ms default, not a type regression. Moved to `beforeAll` with a 120s budget.                                                                                         |
| One `implemented` row in this file given a `mock` tier                                              | CONF-2                       | **1 failed**: `CONFORMANCE.md is held to the canonical format > passes every structural check`, naming the row and the tier it cannot carry.                                                                                      |

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

> **Regraded under the canonical vocabulary (2026-09-12).** These rows closed as `delegated` under the
> old vocabulary. BIND-5 is a binding rule with no core counterpart, so it cannot be delegated to one:
> it is now `implemented` on the same evidence. GATE-2, GATE-7 and CAT-1 remain `delegated`, now naming
> the core row and its current core grade.

## Gaps, ranked by cost

1. **SRV-5, SRV-1 — `<Translate>` and `<Phrase>` throw during a server render.** A SolidStart page
   containing either fails its SSR response with `ReferenceError: document is not defined`. Availability:
   an error page, not merely a wrong language. Not built, by instruction; where child capture lives is an
   open operator decision.
2. **SRV-1, SRV-2 — served HTML is the base language, and the catalog is process-global.** Crawlers index
   the base language under localised URLs, and under concurrent locales the last seed wins for every
   request. Search visibility, and correctness under load.
3. **SRV-4 — no pre-hydration seed is proven.** The core's synchronous `seedCatalog` is reachable here, but
   nothing shows a client entry calling it before hydration, so a page served in Italian would re-render in
   the base language. A visible flash on every server-rendered page.
4. **HINT-4 — persistent layouts never capture the new route.** Measured: 1 of 2 components re-enters `t()`
   across a navigation. Content in a persistent layout is silently never discovered for later routes. Closes
   with the navigation entry point.
5. **CI resolves the registry artifact.** `^0.6.5` now matches the core built against, but `npm ci` installs
   registry `0.6.5`, which lacks the 838 surface, so CI stays red on the precondition test until the core
   publishes and the range moves to that version. Release coordination.
6. **Delegated rows inherit the core's gaps.** The core grades several counterparts `provisional` or "no
   test" (CAT-3, GATE-3, GATE-4, REG-12, SSR-3, WIRE-4). Real gaps, owned by the core lane.

## Reproducing this file's evidence

```bash
npm link ../langsys-js-typescript   # bench: the local core, not the registry tarball
npm test                            # both projects: browser build, then Solid's server build
npm run typecheck && npm run build
# the tally, against a langsys2 checkout that carries the cited commit:
node _dev_/tally-conformance.mjs ~/Documents/dev/langsys2
```

The SRV measurements are reproduced by rendering under the server project (`vitest.ssr.config.mts`) with
`renderToString`: `useT()` inside a component with no catalog seeded; the same after
`sTranslations.set` with an Italian catalog; a German catalog seeded next and the Italian render repeated;
and `<Translate>` and `<Phrase>` rendered directly. The measurement is not committed as a test, because a
test pinning today's behaviour would pin a defect.
