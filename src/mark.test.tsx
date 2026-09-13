import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'solid-js/web';
import { generateCustomId, tokenizeElement, type iCategories, type iTranslations } from 'langsys-js-typescript';
import { LangsysApp } from './index.js';
import { Phrase } from './components/Phrase.js';
import { Translate } from './components/Translate.js';

/**
 * MARK-1 — a rendered host carries the identity it was rendered from.
 *
 * The spec's test, followed literally: render a block, then run the tokenizer
 * over the same subtree **independently** and compare. Reading back the
 * attribute the renderer just wrote proves only that it was written.
 *
 * The independent path here is a second, separately built copy of the authored
 * markup, mounted and tokenized on its own — not the rendered host, which the
 * core may already have rewritten for display.
 *
 * Proven on both render paths this binding exposes (CONF-1, every path): the
 * **block** path `<Translate>` and the **leaf** path `<Phrase>`. The block path
 * is also proven with no category, which pins CID-2's `''` slot at the DOM.
 *
 * The core is seeded synchronously through `LangsysApp.seedCatalog` so the
 * block resolves without a network or an `init()`. That call goes through this
 * binding's forwarding proxy, so it doubles as evidence that SRV-4's
 * synchronous seed is reachable here.
 */

const mounted: Array<{ dispose: () => void; el: HTMLElement }> = [];

afterEach(() => {
    while (mounted.length) {
        const m = mounted.pop()!;
        m.dispose();
        m.el.remove();
    }
});

function mount(component: () => unknown): HTMLElement {
    const el = document.createElement('div');
    document.body.appendChild(el);
    mounted.push({ dispose: render(component as never, el), el });
    return el;
}

/** An empty but well-formed catalog, so the block resolves without a network. */
function seed(): void {
    const empty = (c: string) => ({ __category__: c, __symbol__: c }) as iTranslations;
    const catalog = { __uncategorized__: empty('__uncategorized__'), Home: empty('Home') } as iCategories;
    LangsysApp.seedCatalog(catalog, 'en-us');
}

/** Tokenize an independently built copy of the authored markup. */
function independentId(category: string, build: (host: HTMLElement) => void): string {
    const ref = document.createElement('translate');
    build(ref);
    document.body.appendChild(ref);
    try {
        return generateCustomId(category, tokenizeElement(ref).tokens);
    } finally {
        ref.remove();
    }
}

async function waitForAttr(el: Element, name: string, ms = 2000): Promise<void> {
    const start = Date.now();
    while (!el.hasAttribute(name) && Date.now() - start < ms) {
        await new Promise((r) => setTimeout(r, 10));
    }
}

const authored = (host: HTMLElement) => {
    const h3 = document.createElement('h3');
    h3.textContent = 'Welcome to our store';
    const p = document.createElement('p');
    p.textContent = 'Browse the catalog in your language.';
    host.append(h3, p);
};

describe('MARK-1 — block path: <Translate>', () => {
    it('stamps data-ls-contentblock with the id the tokenizer derives independently', async () => {
        seed();
        const container = mount(() => (
            <Translate category="Home">
                <h3>Welcome to our store</h3>
                <p>Browse the catalog in your language.</p>
            </Translate>
        ));
        const host = container.querySelector('translate')!;
        await waitForAttr(host, 'data-ls-contentblock');

        const stamped = host.getAttribute('data-ls-contentblock');
        expect(stamped, 'host was never stamped').toBeTruthy();
        expect(stamped).toBe(independentId('Home', authored));
    });

    it('POSITIVE CONTROL: the independent derivation is sensitive to content', () => {
        // Without this, a derivation that returned a constant would make the
        // equality above pass for any host at all.
        const other = independentId('Home', (h) => {
            h.textContent = 'Something else entirely';
        });
        expect(other).not.toBe(independentId('Home', authored));
    });

    it('with no category, stamps the id derived from the empty-string slot (CID-2)', async () => {
        seed();
        const container = mount(() => (
            <Translate>
                <h3>Welcome to our store</h3>
                <p>Browse the catalog in your language.</p>
            </Translate>
        ));
        const host = container.querySelector('translate')!;
        await waitForAttr(host, 'data-ls-contentblock');

        expect(host.getAttribute('data-ls-contentblock')).toBe(independentId('', authored));
    });
});

describe('MARK-1 — leaf path: <Phrase>', () => {
    it('carries data-ls-phrase on the rendered host', () => {
        const container = mount(() => <Phrase category="Cart">Hi there</Phrase>);
        const host = container.firstElementChild!;
        expect(host.hasAttribute('data-ls-phrase')).toBe(true);
    });

    it('POSITIVE CONTROL: an ordinary rendered span does not', () => {
        const container = mount(() => <span>Hi there</span>);
        expect(container.firstElementChild!.hasAttribute('data-ls-phrase')).toBe(false);
    });
});
