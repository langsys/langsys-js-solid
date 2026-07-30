# langsys-js-solid

SolidJS binding for [Langsys](https://langsys.dev) — realtime, continuous
translations with automatic token discovery. The phrase in your code is the
lookup key **and** the base-language default: no keys file, no extraction step.

This is the thinnest of the Langsys bindings, and that's by design: the base
SDK ([`langsys-js-typescript`](https://github.com/langsys/langsys-js-typescript))
is built on signals whose `subscribe(fn) → unsubscribe` contract Solid's own
`from()` already accepts. This package adds seeded accessors (no
`| undefined`), the component glue, and nothing else.

## Install

```bash
npm install langsys-js-solid solid-js
```

## Initialize

```ts
import { LangsysApp, createLocaleStore } from 'langsys-js-solid';

export const locale = createLocaleStore('en-US');

await LangsysApp.init({
    projectid: import.meta.env.VITE_LANGSYS_PROJECT_ID,
    key: import.meta.env.VITE_LANGSYS_API_KEY, // read-only in the browser
    UserLocaleStore: locale,
});
```

Switch locale anywhere with `locale.set('fr-FR')` — every `useT()` consumer
re-renders with the new catalog once it loads.

## Translate

```tsx
import { useT } from 'langsys-js-solid';

function Greeting(props: { name: string }) {
    const t = useT();
    return <p>{t()('Hello, {name}!', 'Greetings', { name: props.name })}</p>;
}
```

`t` is an accessor (call it, then call the function it returns) — that's what
makes the component re-render when the locale or catalog changes. ICU plurals
work out of the box:

```tsx
t()('You have {count, plural, one {# new message} other {# new messages}}.', 'Inbox', { count: count() });
```

## Components

```tsx
import { DontTranslate, Phrase, Translate } from 'langsys-js-solid';

// A region of markup as one content block:
<Translate category="Home">
    <h3>Welcome to our store</h3>
    <p>Browse the catalog in your language.</p>
</Translate>

// One sentence with inline markup/params, kept whole for the translator:
<Phrase category="Cart" params={{ name: 'Sarah', count: count() }}>
    Hi %name%, you have %count% items in your cart.
</Phrase>

// Never translated, preserved verbatim:
<p>Sign in with <DontTranslate>Langsys ID</DontTranslate> to continue.</p>
```

Keep `<Translate>`/`<Phrase>` children static — the SDK mutates the rendered
DOM in place. For values Solid owns and re-renders, use `useT()` or pass them
through `params`. The components build real DOM nodes, so they're client-only;
on the server render plain markup and hydrate.

## Reactive primitives

| Primitive | Returns | Wraps |
| --- | --- | --- |
| `useT()` | `Accessor<TFunction>` | the live translation function |
| `useCurrentLocale()` | `Accessor<string>` | the locale whose catalog is loaded |
| `useTranslations()` | `Accessor<iCategories>` | the raw catalog |
| `useLocaleStore(initial?)` | `{ locale, setLocale, store }` | store + accessor in one |
| `useSignal(signal)` | `Accessor<T>` | any base-SDK signal |

Already own the locale as a Solid signal? Adapt it instead of migrating:

```ts
import { solidToLocaleSource } from 'langsys-js-solid';

const [locale, setLocale] = createSignal('en-US');
LangsysApp.init({ ..., UserLocaleStore: solidToLocaleSource(locale, setLocale) });
setLocale('fr-FR'); // SDK loads French
```

## Playground

`example/` is a runnable playground (`npm run dev`) mirroring the
[langsys-demos](https://github.com/langsys/langsys-demos) apps — copy
`.env.example` to `.env` with a read-only key and switch locales live.

## Learn more

- Interactive explorers: the Langsys Learning Center — [docs.langsys.dev/learn](https://docs.langsys.dev/learn)
- Base SDK: [`langsys-js-typescript`](https://github.com/langsys/langsys-js-typescript)
- API docs: [docs.langsys.dev](https://docs.langsys.dev)
