import { describe, expect, it } from 'vitest';
import { createRoot, createSignal as createSolidSignal } from 'solid-js';
import { createSignal } from 'langsys-js-typescript';
import { createLocaleStore, solidToLocaleSource, useSignal } from './adapters.js';
import { useLocaleStore, useT } from './primitives.js';

describe('useSignal', () => {
    it('seeds from the current value and tracks updates', () => {
        const signal = createSignal('en-US');
        createRoot((dispose) => {
            const value = useSignal(signal);
            expect(value()).toBe('en-US');
            signal.set('fr-FR');
            expect(value()).toBe('fr-FR');
            dispose();
        });
    });

    it('unsubscribes when the owning root is disposed', () => {
        const signal = createSignal('a');
        let value!: () => string;
        createRoot((dispose) => {
            value = useSignal(signal);
            dispose();
        });
        signal.set('b');
        expect(value()).toBe('a');
    });

    it('carries function payloads without treating them as updaters', () => {
        const first = () => 'first';
        const second = () => 'second';
        const signal = createSignal<() => string>(first);
        createRoot((dispose) => {
            const value = useSignal(signal);
            expect(value()).toBe(first);
            signal.set(second);
            expect(value()).toBe(second);
            dispose();
        });
    });
});

describe('createLocaleStore', () => {
    it('returns a base-SDK Signal', () => {
        const store = createLocaleStore('de-DE');
        expect(store.get()).toBe('de-DE');
        const seen: string[] = [];
        const unsubscribe = store.subscribe((v) => seen.push(v));
        store.set('es-ES');
        unsubscribe();
        store.set('fr-FR');
        expect(seen).toEqual(['de-DE', 'es-ES']);
    });
});

describe('solidToLocaleSource', () => {
    it('satisfies the Signal contract: immediate first fire, sync notify, unsubscribe', () => {
        const [locale, setLocale] = createSolidSignal('en-US');
        const source = solidToLocaleSource(locale, setLocale);

        const seen: string[] = [];
        const unsubscribe = source.subscribe((v) => seen.push(v));
        expect(seen).toEqual(['en-US']);

        // Writes through the adapter notify…
        source.set('fr-FR');
        expect(seen).toEqual(['en-US', 'fr-FR']);

        // …and so do the app's own direct writes to the Solid signal.
        setLocale('de-DE');
        expect(seen).toEqual(['en-US', 'fr-FR', 'de-DE']);

        unsubscribe();
        setLocale('es-ES');
        expect(seen).toEqual(['en-US', 'fr-FR', 'de-DE']);
        expect(source.get()).toBe('es-ES');
    });

    it('supports update()', () => {
        const [locale, setLocale] = createSolidSignal('en');
        const source = solidToLocaleSource(locale, setLocale);
        source.update((v) => v + '-US');
        expect(locale()).toBe('en-US');
    });
});

describe('primitives', () => {
    it('useT returns an accessor to the current translation function', () => {
        createRoot((dispose) => {
            const t = useT();
            expect(typeof t()).toBe('function');
            expect(t()('Hello')).toBe('Hello');
            dispose();
        });
    });

    it('useLocaleStore wires locale, setLocale, and store together', () => {
        createRoot((dispose) => {
            const { locale, setLocale, store } = useLocaleStore('en-US');
            expect(locale()).toBe('en-US');
            setLocale('fr-FR');
            expect(locale()).toBe('fr-FR');
            expect(store.get()).toBe('fr-FR');
            dispose();
        });
    });
});
