import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Show, Suspense, createResource } from 'solid-js';
import { renderToStringAsync } from 'solid-js/web';
import { provideRequestEvent } from 'solid-js/web/storage';
import type { RequestScope } from 'langsys-js-typescript';
import { LangsysApp, LangsysSeed, SEED_ELEMENT_ID, createLocaleStore, useT } from './index.js';
import { LANGSYS_SCOPE, langsysMiddleware, type LangsysRequestEvent } from './start.js';
import { sleep, startContractFixture, type ContractFixture } from '../test-support/contract.js';

/**
 * SolidStart server rendering through the core's request scope (SRV-7), against the contract
 * double (CONF-2, tier `contract`), which serves the German and Italian catalogs.
 *
 * Each request runs as SolidStart runs it: the middleware inside the request event
 * (`provideRequestEvent`, what SolidStart's `decorateMiddleware` does), and `next()` rendering the
 * page inside the event too. The page reads `useT()` before and after an `await` (a resource under
 * `<Suspense>`), so a render that lost its scope across the await would show it.
 */

let fx: ContractFixture;

const middleware = langsysMiddleware({
    locale: (event) => new URL(event.request.url).searchParams.get('lang') ?? undefined,
});

function Late() {
    const t = useT();
    return <p>{t()('Checkout', 'UI')}</p>;
}

function Document() {
    const t = useT();
    const [late] = createResource(() => sleep(20).then(() => true));
    return (
        <html>
            <head>
                <LangsysSeed />
            </head>
            <body>
                <p>{t()('Pricing', 'UI')}</p>
                <p>{t()('Only in English', 'UI')}</p>
                <Suspense>
                    <Show when={late()}>
                        <Late />
                    </Show>
                </Suspense>
            </body>
        </html>
    );
}

/** One request, as SolidStart serves it. Resolves the served bytes and the request's scope. */
async function serve(lang: string): Promise<{ html: string; scope: RequestScope }> {
    const request = new Request(`${fx.origin}/pricing?lang=${lang}`);
    const event: LangsysRequestEvent = { request, locals: {} };
    const h3Event = { context: {}, req: request };
    const render = () =>
        provideRequestEvent(event as never, async () => {
            const html = await renderToStringAsync(() => <Document />);
            return new Response(html, { headers: { 'content-type': 'text/html' } });
        });
    const response = (await provideRequestEvent(event as never, () => middleware(h3Event, render))) as Response;
    return { html: await response.text(), scope: event.locals[LANGSYS_SCOPE] as RequestScope };
}

beforeAll(async () => {
    fx = await startContractFixture();
    await fx.seed({
        projects: [
            {
                id: 'p1',
                base_locale: 'en',
                target_locales: ['de-de', 'it-it'],
                website_url: fx.origin,
                phrases: [
                    { category: 'UI', phrase: 'Pricing', translations: { 'de-de': 'Preise', 'it-it': 'Prezzi' } },
                    { category: 'UI', phrase: 'Checkout', translations: { 'de-de': 'Kasse', 'it-it': 'Cassa' } },
                    {
                        category: 'UI',
                        phrase: 'Close tag',
                        translations: { 'de-de': '</script>', 'it-it': '</script>' },
                    },
                ],
            },
        ],
        keys: [{ key: 'k-public', project: 'p1', type: 'ip_write' }],
    });
    await LangsysApp.init({
        projectid: 'p1',
        key: 'k-public',
        UserLocaleStore: createLocaleStore('en'),
        baseLocale: 'en',
        apiUrl: fx.baseUrl,
    });
}, 30_000);

afterAll(async () => {
    await fx.stop();
});

const GERMAN = ['Preise', 'Kasse'];
const ITALIAN = ['Prezzi', 'Cassa'];

describe('SRV-7: each SolidStart request renders in its own scope', () => {
    it('de, then it through a new scope: the Italian page carries no German', async () => {
        const de = await serve('de-de');
        for (const word of GERMAN) expect(de.html).toMatch(new RegExp(`<p[^>]*>${word}</p>`));

        const it_ = await serve('it-it');
        for (const word of ITALIAN) expect(it_.html).toMatch(new RegExp(`<p[^>]*>${word}</p>`));
        for (const word of GERMAN) expect(it_.html).not.toContain(word);
    });

    it('concurrent it and de renders each carry only their own locale (SRV-2)', async () => {
        const pages = await Promise.all(['it-it', 'de-de', 'it-it', 'de-de'].map((lang) => serve(lang)));
        for (const [i, page] of pages.entries()) {
            const [own, other] = i % 2 === 0 ? [ITALIAN, GERMAN] : [GERMAN, ITALIAN];
            for (const word of own) expect(page.html).toMatch(new RegExp(`<p[^>]*>${word}</p>`));
            for (const word of other) expect(page.html).not.toContain(word);
        }
    });

    it('a phrase the catalog lacks renders in the base language and is the scope’s miss (SRV-1)', async () => {
        const { html, scope } = await serve('it-it');
        expect(html).toContain('<p>Only in English</p>');
        expect(scope.misses()).toContainEqual({ category: 'UI', phrase: 'Only in English' });
        expect(scope.misses().map((m) => m.phrase)).not.toContain('Pricing');
    });

    it('the page carries the seed its scope rendered with (SRV-4)', async () => {
        const { html } = await serve('it-it');
        const match = html.match(new RegExp(`<script[^>]*id="${SEED_ELEMENT_ID}"[^>]*>(.*?)</script>`));
        expect(match).not.toBeNull();
        const seed = JSON.parse(match![1]!) as { locale: string; catalog: Record<string, Record<string, unknown>> };
        expect(seed.locale).toBe('it-it');
        expect(seed.catalog.UI!.Pricing).toBe('Prezzi');
        // A translation holding `</script>` cannot end the seed's script early.
        expect(seed.catalog.UI!['Close tag']).toBe('</script>');
    });
});
