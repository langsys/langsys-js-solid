import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'solid-js/web';
import {
    SnapshotError,
    buildSnapshot,
    currentlyLoadedLocale,
    sTranslations,
    type iCategories,
} from 'langsys-js-typescript';
import { LangsysApp } from './index.js';
import { useT } from './primitives.js';

/**
 * Snapshots (SNAP-2, SNAP-3) are the core's: `LangsysApp.loadSnapshot` parses, verifies and
 * publishes. This binding's part is reaching that method untouched, and a mounted `useT()`
 * consumer repainting from what it publishes, synchronously and with no fetch. In-process, so
 * the tier is `n/a (pure)`.
 */

const snapshot = buildSnapshot({
    projectId: 'p1',
    baseLocale: 'en',
    categories: ['UI'],
    catalogs: { 'es-es': { UI: { Save: 'Guardar' } }, 'fr-fr': { UI: { Save: 'Enregistrer' } } },
    generatedAt: new Date('2026-09-24T00:00:00Z'),
});

const disposers: Array<() => void> = [];

function mountSave(): HTMLElement {
    const el = document.createElement('div');
    document.body.appendChild(el);
    disposers.push(() => el.remove());
    disposers.push(
        render(() => {
            const t = useT();
            return <span>{t()('Save', 'UI')}</span>;
        }, el)
    );
    return el;
}

afterEach(() => {
    while (disposers.length) disposers.pop()!();
    sTranslations.set({
        __uncategorized__: { __category__: '__uncategorized__', __symbol__: '__uncategorized__' },
    } as unknown as iCategories);
    currentlyLoadedLocale.set('');
});

describe('SNAP-2: a snapshot loaded through the binding repaints mounted consumers', () => {
    it('loads the locale it is given, and the text repaints on the same tick', () => {
        const el = mountSave();
        expect(el.textContent).toBe('Save');

        expect(LangsysApp.loadSnapshot(snapshot, 'fr-fr')).toBe(true);
        expect(currentlyLoadedLocale.get()).toBe('fr-fr');
        expect(el.textContent).toBe('Enregistrer');
    });

    it('leaves the snapshot it was handed as it was', () => {
        const before = structuredClone(snapshot);
        LangsysApp.loadSnapshot(snapshot, 'es-es');
        expect(snapshot).toEqual(before);
    });

    it('a locale the snapshot lacks loads nothing, and the text stays source', () => {
        const el = mountSave();
        expect(LangsysApp.loadSnapshot(snapshot, 'de-de')).toBe(false);
        expect(el.textContent).toBe('Save');
    });
});

describe('SNAP-3: an edited snapshot is refused through the binding', () => {
    it('throws SnapshotError by its checksum, and publishes nothing', () => {
        const el = mountSave();
        const edited = structuredClone(snapshot);
        edited.catalog['es-es']!.UI!.Save = 'Guardar ahora';

        let caught: unknown;
        try {
            LangsysApp.loadSnapshot(edited, 'es-es');
        } catch (err) {
            caught = err;
        }
        expect(caught).toBeInstanceOf(SnapshotError);
        expect((caught as SnapshotError).reason).toBe('checksum');
        expect(el.textContent).toBe('Save');
    });
});
