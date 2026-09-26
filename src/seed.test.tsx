import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'solid-js/web';
import { currentlyLoadedLocale, sTranslations, type iCategories } from 'langsys-js-typescript';
import { SEED_ELEMENT_ID, seedFromDocument, useT } from './index.js';

/**
 * The client half of the hydration hand-off (SRV-4): the seed `<LangsysSeed />` writes into the
 * served page (`src/start.ssr.test.tsx` asserts that half) is read and seeded synchronously, so a
 * render straight after shows the server's language. In-process, so the tier is `n/a (pure)`.
 */

function serveSeed(json: string): void {
    const script = document.createElement('script');
    script.type = 'application/json';
    script.id = SEED_ELEMENT_ID;
    script.textContent = json;
    document.head.appendChild(script);
}

afterEach(() => {
    document.getElementById(SEED_ELEMENT_ID)?.remove();
    document.body.innerHTML = '';
    sTranslations.set({
        __uncategorized__: { __category__: '__uncategorized__', __symbol__: '__uncategorized__' },
    } as unknown as iCategories);
    currentlyLoadedLocale.set('');
});

describe('seedFromDocument', () => {
    it('seeds the served catalog synchronously, so the first render is in the server’s language', () => {
        // As `<LangsysSeed />` writes it: `<` escaped, so a translation holding `</script>` survives.
        serveSeed(
            '{"locale":"it-it","catalog":{"UI":{"__category__":"UI","Pricing":"Prezzi","Tag":"\\u003c/script\\u003e"}}}'
        );
        expect(seedFromDocument()).toBe(true);
        expect(currentlyLoadedLocale.get()).toBe('it-it');

        const el = document.createElement('div');
        document.body.appendChild(el);
        const dispose = render(() => {
            const t = useT();
            return (
                <p>
                    {t()('Pricing', 'UI')}|{t()('Tag', 'UI')}
                </p>
            );
        }, el);
        expect(el.textContent).toBe('Prezzi|</script>');
        dispose();
    });

    it('returns false, and seeds nothing, on a page with no seed', () => {
        expect(seedFromDocument()).toBe(false);
        expect(currentlyLoadedLocale.get()).toBe('');
    });
});
