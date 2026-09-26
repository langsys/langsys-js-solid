import { afterAll, describe, expect, it } from 'vitest';
import { AsyncLocalStorage } from 'node:async_hooks';
import { renderToString } from 'solid-js/web';
import { createRequestScope, setRequestScopeStorage, type iCategories } from 'langsys-js-typescript';
import { LangsysApp, useCurrentLocale, useT, useTranslations } from './index.js';

/**
 * SRV-2 for every primitive that reads the catalog or the locale, not only `useT()`.
 *
 * The process-wide state is seeded German; a render inside an Italian request scope must read
 * the scope through `useT()`, `useCurrentLocale()` and `useTranslations()` alike. On the server
 * each primitive reads its core signal at render time, and inside a scope the core answers those
 * signals with the scope's locale and catalog. Run with and without an `AsyncLocalStorage`, since
 * the core nests scopes synchronously without one. The control renders the same page outside any
 * scope and reads the German, so the Italian is the scope's and not an empty process state.
 * In-process, so the tier is `n/a (pure)`.
 */

const catalog = (pricing: string) =>
    ({
        __uncategorized__: { __category__: '__uncategorized__', __symbol__: '__uncategorized__' },
        UI: { __category__: 'UI', __symbol__: 'UI', Pricing: pricing },
    }) as unknown as iCategories;

function Page() {
    const t = useT();
    const locale = useCurrentLocale();
    const translations = useTranslations();
    return (
        <p>
            {t()('Pricing', 'UI')}|{locale()}|{String(translations().UI?.Pricing)}
        </p>
    );
}

const text = (html: string) => html.replace(/<[^>]*>/g, '');

afterAll(() => setRequestScopeStorage(null));

describe('SRV-2: every primitive reads the request scope, not the process', () => {
    for (const [mode, storage] of [
        ['without a storage', null],
        ['with an AsyncLocalStorage', new AsyncLocalStorage()],
    ] as const) {
        it(`de in the process, it in the scope: Prezzi|it|Prezzi, ${mode}`, async () => {
            setRequestScopeStorage(storage);
            LangsysApp.seedCatalog(catalog('Preise'), 'de');

            expect(text(renderToString(() => <Page />))).toBe('Preise|de|Preise');

            const scope = await createRequestScope({ locale: 'it', catalog: catalog('Prezzi') });
            expect(text(scope.run(() => renderToString(() => <Page />)))).toBe('Prezzi|it|Prezzi');
        });
    }
});
