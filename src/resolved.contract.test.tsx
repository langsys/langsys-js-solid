import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { JSX } from 'solid-js';
import { render } from 'solid-js/web';
import { currentlyLoadedLocale } from 'langsys-js-typescript';
import { LangsysApp, createLocaleStore } from './index.js';
import { Phrase } from './components/Phrase.js';
import { Translate } from './components/Translate.js';
import { useT } from './primitives.js';
import { setPage, startContractFixture, until, type ContractFixture } from '../test-support/contract.js';

/**
 * GATE-10 against the contract double (CONF-2, tier `contract`): a subtree marked
 * `data-ls-resolved` is already-resolved output, not source, and nothing inside it is recorded
 * as a miss.
 *
 * Only DOM hosts read the marker. A bare `t()` call is outside the rule: it records its miss even
 * under a resolved ancestor, which is this file's negative control.
 *
 * The reading is the core's; this binding's part is handing the core the host element it
 * renders, attached to the document, so the core can walk to a marked ancestor. Every case
 * marks an ANCESTOR of the host, never the host itself, so inheritance is what is under test.
 *
 * The session may write, so the double would register everything shown here. The unmarked
 * controls register in the same window as the marked cases, which is what makes the marked
 * cases' absence evidence rather than an empty state.
 */

// Registration waits out the flush debounce and reports wait out their jitter, so each case
// runs against the double for longer than vitest's 5s default.
vi.setConfig({ testTimeout: 30_000 });

let fx: ContractFixture;
const disposers: Array<() => void> = [];
const blockPhrases = async () => (await fx.state()).projects.p1.blocks.flatMap((b) => b.phrases.map((p) => p.phrase));
const phrases = async () => (await fx.state()).projects.p1.phrases.map((p) => p.phrase);

/** Render into a container whose attributes mark the host's ancestor. */
function mountIn(attrs: Record<string, string>, view: () => JSX.Element): HTMLElement {
    const el = document.createElement('div');
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    document.body.appendChild(el);
    disposers.push(render(view, el));
    return el;
}

beforeAll(async () => {
    fx = await startContractFixture();
    await fx.seed({
        projects: [{ id: 'p1', base_locale: 'en', target_locales: ['es-es'], website_url: fx.origin }],
        // May write from here: the double registers what this session sends.
        keys: [{ key: 'k-writer', project: 'p1', type: 'ip_write', ip_allowlist: ['127.0.0.1'] }],
    });
    setPage(fx.origin + '/page');
    await LangsysApp.init({
        projectid: 'p1',
        key: 'k-writer',
        UserLocaleStore: createLocaleStore('es-es'),
        baseLocale: 'en',
        apiUrl: fx.baseUrl,
    });
    await until(() => currentlyLoadedLocale.get() === 'es-es');
}, 30_000);

afterAll(async () => {
    while (disposers.length) disposers.pop()!();
    await fx.stop();
});

describe('GATE-10: a resolved ancestor suppresses misses on both render paths', () => {
    it('records nothing inside a resolved subtree, and registers the unmarked controls', async () => {
        // Controls: unmarked, on both paths.
        mountIn({}, () => (
            <Translate category="UI">
                <h3>Block unmarked</h3>
                <p>Block unmarked, detail</p>
            </Translate>
        ));
        mountIn({}, () => <Phrase category="UI">Leaf unmarked</Phrase>);
        // Resolved ancestor, canonical spelling with a locale value, on both paths.
        const resolvedBlock = mountIn({ 'data-ls-resolved': 'es-es' }, () => (
            <Translate category="UI">
                <h3>Block resolved</h3>
                <p>Block resolved, detail</p>
            </Translate>
        ));
        mountIn({ 'data-ls-resolved': 'es-es' }, () => <Phrase category="UI">Leaf resolved</Phrase>);
        // The legacy spelling, bare.
        mountIn({ 'data-langsys-resolved': '' }, () => (
            <Translate category="UI">
                <h3>Block resolved legacy</h3>
                <p>Block resolved legacy, detail</p>
            </Translate>
        ));
        // An opt-out inside a resolved subtree records again.
        mountIn({ 'data-ls-resolved': '' }, () => (
            <div data-ls-resolved="false">
                <Translate category="UI">
                    <h3>Block opted out</h3>
                    <p>Block opted out, detail</p>
                </Translate>
            </div>
        ));

        // NEGATIVE CONTROL: a bare t() under a resolved ancestor is not a DOM host, so it records.
        mountIn({ 'data-ls-resolved': 'es-es' }, () => {
            const t = useT();
            return <span>{t()('Bare t under a resolved ancestor', 'UI')}</span>;
        });

        // What registered, on either path: a content block's phrases, or a flat phrase.
        const registered = async () => [...(await blockPhrases()), ...(await phrases())];
        await until(async () => {
            const r = await registered();
            return (
                r.includes('Block unmarked') &&
                r.includes('Block opted out') &&
                r.includes('Leaf unmarked') &&
                r.includes('Bare t under a resolved ancestor')
            );
        });
        // The block path really ran as a content block, not as a one-token phrase (TOK-6).
        expect(await blockPhrases()).toContain('Block unmarked');

        const after = await registered();
        expect(after).not.toContain('Block resolved');
        expect(after).not.toContain('Block resolved legacy');
        expect(after).not.toContain('Leaf resolved');

        // Identity is untouched: the resolved block is still stamped with its id.
        expect(resolvedBlock.querySelector('translate')?.getAttribute('data-ls-contentblock')).toBeTruthy();
    });
});
