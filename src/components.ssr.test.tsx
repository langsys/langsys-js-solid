import { describe, expect, it } from 'vitest';
import { isServer, renderToString } from 'solid-js/web';
import { DontTranslate } from './components/DontTranslate.js';
import { Phrase } from './components/Phrase.js';
import { Translate } from './components/Translate.js';

/**
 * The components must not crash a server render.
 *
 * Measured before this guard existed: rendered under Solid's server build,
 * `<Translate>`, `<Phrase>` and `<DontTranslate>` all threw
 * `ReferenceError: document is not defined`, because each built its host with
 * `document.createElement`. A SolidStart page using any of them failed its whole
 * server response.
 *
 * Under a server render they now emit their tag, attributes and children,
 * untranslated. That is lifecycle adaptation (BIND-1) and nothing more. It does
 * NOT satisfy SRV-1..5: the served HTML is still the base language, nothing here
 * captures children or scopes a catalog to the request, and whether the client
 * hydrates cleanly against this markup is unproven (SRV-4).
 *
 * Runs against Solid's SERVER build (`vitest.ssr.config.mts`); in the browser
 * project `renderToString` is a stub and none of this could be observed.
 */
describe('components under a server render', () => {
    it('POSITIVE CONTROL: this project really is the server build', () => {
        // Without this, the assertions below could pass against the browser
        // build, where `document` exists and nothing would ever have thrown.
        expect(isServer).toBe(true);
        expect(renderToString(() => 'control' as never)).toContain('control');
    });

    it('<Translate> emits its tag and children, untranslated, instead of throwing', () => {
        const html = renderToString(() => (
            <Translate category="Home" class="hero">
                <h3>Welcome to our store</h3>
            </Translate>
        ));
        expect(html).toMatch(/^<translate\b/);
        // Match the class TOKEN: Solid's server build pads the value (`class="hero "`).
        expect(html).toMatch(/\bclass="\s*hero\s*"/);
        expect(html).toContain('Welcome to our store');
    });

    it('<Phrase> emits a host carrying data-ls-phrase, with its children', () => {
        const html = renderToString(() => <Phrase category="Cart">Hi there</Phrase>);
        expect(html).toMatch(/^<span\b/);
        expect(html).toContain('data-ls-phrase');
        expect(html).toContain('Hi there');
    });

    it('<DontTranslate> keeps translate="no" and its marker', () => {
        const html = renderToString(() => (
            <p>
                Sign in with <DontTranslate>Langsys ID</DontTranslate>
            </p>
        ));
        expect(html).toContain('translate="no"');
        expect(html).toContain('data-ls-dont-translate');
        expect(html).toContain('Langsys ID');
    });

    it('emits no class attribute when none is given, matching the browser path', () => {
        // The browser path only sets `className` when the prop is present. An
        // empty `class=""` on the server would be a server/client disagreement in
        // exactly the markup hydration has to match.
        const renders = [
            renderToString(() => <Translate>Welcome</Translate>),
            renderToString(() => <Phrase>Hi there</Phrase>),
            renderToString(() => <DontTranslate>Langsys ID</DontTranslate>),
        ];
        for (const html of renders) expect(html).not.toMatch(/\bclass=/);
    });

    it('CONTROL: a given class is still emitted, so the row above is not passing by dropping every class', () => {
        expect(renderToString(() => <Phrase class="x">Hi</Phrase>)).toMatch(/\bclass="\s*x\s*"/);
    });

    it('honours the tag prop on the server, as it does in the browser', () => {
        expect(renderToString(() => <Phrase tag="em">x</Phrase>)).toMatch(/^<em\b/);
    });
});
