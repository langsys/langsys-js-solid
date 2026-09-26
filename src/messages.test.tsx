import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRoot } from 'solid-js';
import { render } from 'solid-js/web';
import { currentlyLoadedLocale, sTranslations, type iCategories } from 'langsys-js-typescript';
import { LangsysApp, resolveServerMessages, type ServerMessage } from './index.js';
import { useMessage } from './messages.js';

/**
 * Server messages against the shared vectors (`test-support/fixtures/server-message-vectors.json`,
 * blob `7333e3919dac43af81c6c20bfdba974efd79725b`, authored by the JS core against spec blob
 * `5d7e6890`, from real framework messages).
 *
 * Resolving entries out of a framework's error body (MSG-1) and deciding what to show (MSG-5) are
 * the core's `resolveServerMessages` and `renderServerMessage`, which this binding re-exports by
 * reference. The binding's part is `useMessage`, a Solid accessor over the render. Every render
 * vector goes through that accessor; the canonical entries, attached to two frameworks' own error
 * bodies and resolved through the key the app configures, render identically through it; and a
 * rendered component shows it repaints when the catalog changes. In-process, so the tier is
 * `n/a (pure)`.
 */

interface CanonicalEntry extends ServerMessage {
    framework: string;
    source: string;
}

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
) as { spec_blob: string; canonical_entries: CanonicalEntry[]; render: RenderVector[] };

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
        expect(vectors.spec_blob).toContain('5d7e6890b733a50fb6f5f5c30e0056c6ef7bcf45');
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

describe("MSG-1: entries resolve from the framework's own body through configuration", () => {
    const entries = vectors.canonical_entries.map(({ framework: _f, source: _s, ...entry }) => entry);
    const laravel = () => ({
        message: 'The given data was invalid.',
        errors: { password: ['…'] },
        langsys_errors: entries,
    });
    const fastapi = () => ({
        detail: [{ type: 'missing', loc: ['body', 'email'], msg: 'Field required' }],
        meta: { errors: entries },
    });

    it("the canonical entries render identically from two frameworks' bodies, which stay unchanged", () => {
        const catalog: Record<string, string> = {};
        for (const [i, entry] of entries.entries())
            if (entry.template && i % 2 === 0) catalog[entry.template] = `ES ${i}`;
        publish({ Errors: catalog }, 'es');

        const fromLaravel = laravel();
        const fromFastapi = fastapi();
        const a = resolveServerMessages(fromLaravel, { key: 'langsys_errors' });
        const b = resolveServerMessages(fromFastapi, { key: 'meta.errors' });
        expect(a).toEqual(entries);
        expect(b).toEqual(entries);
        expect(fromLaravel).toEqual(laravel());
        expect(fromFastapi).toEqual(fastapi());

        createRoot((dispose) => {
            const shown = (list: ServerMessage[]) => list.map((entry) => useMessage(() => entry)());
            const expected = entries.map((entry, i) =>
                entry.template && i % 2 === 0 ? `ES ${i}` : (entry.message ?? '')
            );
            expect(shown(a)).toEqual(expected);
            expect(shown(b)).toEqual(expected);
            dispose();
        });
    });

    it('resolves nothing without being told where the entries sit', () => {
        expect(() => resolveServerMessages(laravel(), {} as never)).toThrow(TypeError);
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

        publish({ Errors: { [entry.template!]: 'La confirmación de la contraseña no coincide.' } }, 'es');
        expect(el.textContent).toBe('La confirmación de la contraseña no coincide.');

        dispose();
        el.remove();
    });
});
