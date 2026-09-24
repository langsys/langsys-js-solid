import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRoot } from 'solid-js';
import { render } from 'solid-js/web';
import { currentlyLoadedLocale, sTranslations, type ServerMessage, type iCategories } from 'langsys-js-typescript';
import { LangsysApp } from './index.js';
import { useMessage } from './messages.js';

/**
 * MSG-5's client half, rowed against the shared rendering vectors
 * (`test-support/fixtures/server-message-vectors.json`, blob `c8125549cfee0f5286f79a8cbc194cd30ccd446e`,
 * authored by the JS core against spec blob `286dcfe4`).
 *
 * The rendering decision — the template through `t()` when the catalog holds it, otherwise the
 * entry's `message`, never `message` as a key, never `code` choosing text — is the core's
 * `renderServerMessage`. This binding's part is `useMessage`, a Solid accessor over it. Every
 * render vector goes through that accessor, and a rendered component shows it repaints when the
 * catalog changes. In-process rendering, so the tier is `n/a (pure)`.
 */

interface RenderVector {
    id: string;
    locale: string;
    category: string;
    catalog: Record<string, Record<string, string>> | null;
    entry: ServerMessage;
    expected: string;
}

const vectors = JSON.parse(
    readFileSync(join(process.cwd(), 'test-support', 'fixtures', 'server-message-vectors.json'), 'utf8')
) as { spec_blob: string; render: RenderVector[] };

const uncategorized = { __category__: '__uncategorized__', __symbol__: '__uncategorized__' };

/** Publish a vector's catalog for its locale; `null` means no catalog at all. */
function publish(catalog: RenderVector['catalog'], locale: string): void {
    if (catalog === null) {
        sTranslations.set({ __uncategorized__: uncategorized } as unknown as iCategories);
        currentlyLoadedLocale.set('');
        return;
    }
    const categories: Record<string, unknown> = { __uncategorized__: uncategorized };
    for (const [category, entries] of Object.entries(catalog)) {
        categories[category] = { __category__: category, __symbol__: category, ...entries };
    }
    LangsysApp.seedCatalog(categories as unknown as iCategories, locale);
}

describe('MSG-5: every shared rendering vector, through useMessage', () => {
    it('reads the vector file this row cites', () => {
        expect(vectors.spec_blob).toContain('286dcfe429c8a0cdac60cdd6ab062bdf671ad078');
        expect(vectors.render.length).toBeGreaterThan(0);
    });

    it.each(vectors.render)('$id', (vector) => {
        publish(vector.catalog, vector.locale);
        createRoot((dispose) => {
            const text = useMessage(() => vector.entry, vector.category);
            expect(text()).toBe(vector.expected);
            dispose();
        });
    });
});

describe('useMessage repaints with the catalog', () => {
    it('shows the message, then the translation once the catalog carries the template', () => {
        const entry: ServerMessage = {
            code: 'mismatch',
            message: 'The password confirmation does not match.',
            template: 'The password confirmation does not match.',
        };
        publish({ Errors: {} }, 'es');

        const el = document.createElement('div');
        document.body.appendChild(el);
        const dispose = render(() => {
            const text = useMessage(() => entry);
            return <p>{text()}</p>;
        }, el);
        expect(el.textContent).toBe(entry.message);

        publish({ Errors: { [entry.template]: 'La confirmación de la contraseña no coincide.' } }, 'es');
        expect(el.textContent).toBe('La confirmación de la contraseña no coincide.');

        dispose();
        el.remove();
    });
});
