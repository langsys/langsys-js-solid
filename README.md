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

Input casing is forgiving, but **`useCurrentLocale()` emits the SDK's canonical
form, which is lowercase in both halves** (`'fr-FR'` in → `'fr-fr'` out). Compare
against it through `canonicalizeLocale`, never against a raw string:

```ts
import { canonicalizeLocale, useCurrentLocale } from 'langsys-js-solid';

const current = useCurrentLocale();
if (current() === canonicalizeLocale('fr-FR')) {
    /* … */
} // not `=== 'fr-FR'`
```

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

| Primitive                  | Returns                          | Wraps                                     |
| -------------------------- | -------------------------------- | ----------------------------------------- |
| `useT()`                   | `Accessor<TFunction>`            | the live translation function             |
| `useCurrentLocale()`       | `Accessor<string>`               | the locale whose catalog is loaded        |
| `useTranslations()`        | `Accessor<iCategories>`          | the raw catalog                           |
| `useWriteEnabled()`        | `Accessor<boolean \| undefined>` | whether this session may register content |
| `useLocaleStore(initial?)` | `{ locale, setLocale, store }`   | store + accessor in one                   |
| `useSignal(signal)`        | `Accessor<T>`                    | any base-SDK signal                       |

Already own the locale as a Solid signal? Adapt it instead of migrating:

```ts
import { solidToLocaleSource } from 'langsys-js-solid';

const [locale, setLocale] = createSignal('en-US');
LangsysApp.init({ ..., UserLocaleStore: solidToLocaleSource(locale, setLocale) });
setLocale('fr-FR'); // SDK loads French
```

## Write capability

Whether a session may register new content is decided by the **server**, per
session — the same key answers differently from different addresses — so it is
never inferred from the key. Read it with `useWriteEnabled()`:

```tsx
import { useWriteEnabled } from 'langsys-js-solid';

function EditBadge() {
    const writeEnabled = useWriteEnabled();
    return (
        <Show when={writeEnabled() !== undefined} fallback={<span>Checking…</span>}>
            <Show when={writeEnabled()}>
                <span>Editing enabled</span>
            </Show>
        </Show>
    );
}
```

It is **tri-state**, and the third state matters: `undefined` means _not decided
yet_ (authorization still in flight, a server render, or hydration not finished),
not "no". Gate on `=== true` and render something for `undefined` — treating
`undefined` as `false` turns a pending check into a permanent denial.

The accessor stays `undefined` until the component mounts. That is deliberate:
capability is browser-authoritative, so the server never renders it, and seeding
it earlier would make the first client render disagree with the server's HTML.

### Write grants

Login-walled apps supply a short-lived grant. Grants live about five minutes
while an app inits once and runs for hours, so pass a **signal or a callback**,
never a bare string — it is read afresh on every request:

```ts
const [grant, setGrant] = createSignal<string | null>(null);

await LangsysApp.init({ projectid, key, UserLocaleStore: locale, writeGrant: grant });

setGrant(await login()); // capability re-derives; misses from here register directly
```

If the token only exists after login, still configure the provider at `init`
(returning `null` until then) rather than leaving `writeGrant` unset — an unset
grant tells the SDK no grant can ever arrive. To supply one later, `await
LangsysApp.setWriteGrant(grant)`, which re-authorizes rather than just storing it.

## Playground

`example/` is a runnable playground (`npm run dev`) mirroring the
[langsys-demos](https://github.com/langsys/langsys-demos) apps — copy
`.env.example` to `.env` with a read-only key and switch locales live.

## Learn more

- Interactive explorers: the Langsys Learning Center — [docs.langsys.dev/learn](https://docs.langsys.dev/learn)
- Base SDK: [`langsys-js-typescript`](https://github.com/langsys/langsys-js-typescript)
- API docs: [docs.langsys.dev](https://docs.langsys.dev)
