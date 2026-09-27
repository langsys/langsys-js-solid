import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { renderToString } from 'solid-js/web';
import { Phrase, Translate } from './index.js';
import { STRING_PATH_DEFERRED } from './components/host.js';

/**
 * The sanctioned fallback's notice (SRV-1, SRV-5): on the server every `<Translate>` and `<Phrase>`
 * is served as source text, because Solid hands a component its children as an HTML string and the
 * core's string entry is deferred. The core says so once per process per reason, naming the cause.
 * Fifty renders of a page with both components give exactly one notice. The client counterpart,
 * `src/unrendered-notice.test.tsx`, gives none. In-process, so the tier is `n/a (pure)`.
 */

const warnings: string[] = [];
const original = console.warn;

beforeAll(() => {
    console.warn = (...args: unknown[]) => void warnings.push(args.map(String).join(' '));
});

afterAll(() => {
    console.warn = original;
});

describe('the unrendered-block notice on the server', () => {
    it('50 renders give one notice, naming the cause', () => {
        let html = '';
        for (let i = 0; i < 50; i++) {
            html = renderToString(() => (
                <main>
                    <Translate category="UI">
                        <h3>Welcome</h3>
                        <p>Browse the catalog.</p>
                    </Translate>
                    <Phrase category="UI">Leaf</Phrase>
                </main>
            ));
        }
        const notices = warnings.filter((w) => w.includes('not rendered on the server'));
        expect(notices).toHaveLength(1);
        expect(notices[0]).toContain(STRING_PATH_DEFERRED);
        // The fallback: source text, and no resolved marker.
        expect(html).toContain('Browse the catalog.');
        expect(html).not.toContain('data-ls-resolved');
    });
});
