import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { render } from 'solid-js/web';
import { Phrase, Translate } from './index.js';

/**
 * The client control for `src/unrendered-notice.ssr.test.tsx`: a block rendered in the browser is
 * handed to the core as a DOM host, so nothing is served untranslated and no notice is given.
 */

const warnings: string[] = [];
const original = console.warn;

beforeAll(() => {
    console.warn = (...args: unknown[]) => void warnings.push(args.map(String).join(' '));
});

afterAll(() => {
    console.warn = original;
});

describe('the unrendered-block notice in the browser', () => {
    it('rendering and mounting both components gives no notice', async () => {
        const el = document.createElement('div');
        document.body.appendChild(el);
        const dispose = render(
            () => (
                <main>
                    <Translate category="UI">
                        <h3>Welcome</h3>
                        <p>Browse the catalog.</p>
                    </Translate>
                    <Phrase category="UI">Leaf</Phrase>
                </main>
            ),
            el
        );
        await Promise.resolve();
        expect(el.querySelector('translate')).not.toBeNull();
        expect(warnings.filter((w) => w.includes('not rendered on the server'))).toEqual([]);
        dispose();
        el.remove();
    });
});
