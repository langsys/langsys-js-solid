// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { createRoot } from 'solid-js';
import { PHRASE_MARKER_ATTR } from 'langsys-js-typescript';
import { DontTranslate } from './components/DontTranslate.js';
import { Phrase } from './components/Phrase.js';
import { Translate } from './components/Translate.js';

describe('DontTranslate', () => {
    it('renders a translate="no" host with its children verbatim', () => {
        const host = createRoot(() =>
            DontTranslate({ children: 'Langsys ID' as unknown as ReturnType<typeof DontTranslate> })
        ) as HTMLElement;
        expect(host.tagName.toLowerCase()).toBe('span');
        expect(host.getAttribute('translate')).toBe('no');
        expect(host.hasAttribute('data-ls-dont-translate')).toBe(true);
        expect(host.textContent).toBe('Langsys ID');
    });

    it('honors the tag and class props', () => {
        const host = createRoot(() => DontTranslate({ tag: 'code', class: 'brand' })) as HTMLElement;
        expect(host.tagName.toLowerCase()).toBe('code');
        expect(host.className).toBe('brand');
    });
});

describe('Phrase', () => {
    it('renders a marked host so a wrapping Translate skips it', () => {
        createRoot((dispose) => {
            const host = Phrase({
                category: 'Cart',
                children: 'Hi %name%' as unknown as ReturnType<typeof Phrase>,
            }) as HTMLElement;
            expect(host.tagName.toLowerCase()).toBe('span');
            expect(host.hasAttribute(PHRASE_MARKER_ATTR)).toBe(true);
            expect(host.textContent).toBe('Hi %name%');
            dispose();
        });
    });
});

describe('Translate', () => {
    it('renders the default <translate> host with children', () => {
        createRoot((dispose) => {
            const child = document.createElement('h3');
            child.textContent = 'Welcome';
            const host = Translate({
                category: 'Home',
                children: child as unknown as ReturnType<typeof Translate>,
            }) as HTMLElement;
            expect(host.tagName.toLowerCase()).toBe('translate');
            expect(host.querySelector('h3')?.textContent).toBe('Welcome');
            dispose();
        });
    });
});
