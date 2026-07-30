# Changelog

## 0.1.0 — Unreleased

Initial release.

- `useT`, `useCurrentLocale`, `useTranslations`, `useLocaleStore`, and the
  low-level `useSignal` — seeded Solid accessors over the base SDK's signals.
- `createLocaleStore` (SDK signal factory) and `solidToLocaleSource` (adapt an
  existing Solid signal pair into the SDK's `Signal<string>` contract, reactive
  to direct writes via `createRoot` + `createComputed`).
- `<Translate>`, `<Phrase>`, `<DontTranslate>` components wrapping the vanilla
  DOM handlers — implemented without JSX (they return real DOM nodes, a shape
  Solid renders as-is), so the library ships as plain compiled TS.
- `LangsysApp` delegating entry point, identical surface to the React/Vue
  bindings.
- Vitest suite (12 tests): signal adapter contract, function-payload safety,
  reactive `solidToLocaleSource`, component hosts. Note the vitest config's
  browser-condition resolution — Node's default conditions load Solid's inert
  server build, which would make reactivity tests fail.
- `example/` playground mirroring the langsys-demos apps.
