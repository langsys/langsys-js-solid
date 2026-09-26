import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createRoot, onCleanup } from 'solid-js';
import { renderToString } from 'solid-js/web';
import { currentlyLoadedLocale, sTranslations, tSignal, writeEnabled, type Signal } from 'langsys-js-typescript';
import {
    DontTranslate,
    Phrase,
    Translate,
    useCurrentLocale,
    useLocaleStore,
    useMessage,
    useNotifyNavigation,
    useSignal,
    useT,
    useTranslations,
    useWriteEnabled,
} from './index.js';

/**
 * A server render must not leave subscriptions open on the core's signals. Those signals are
 * process-wide, so a subscription a render opens and never releases outlives the request: one
 * more listener per page served, each holding its render's closures.
 *
 * Every core signal the binding subscribes to is wrapped to count subscriptions opened and
 * released. A page using every exported primitive and component is rendered through
 * `renderToString` many times, and nothing may stay open. On the server the primitives read a
 * detached snapshot and subscribe to nothing. The control shows the counter sees a release: a
 * subscription tied to a root that is then disposed counts as opened and released.
 */

const signals = { tSignal, currentlyLoadedLocale, sTranslations, writeEnabled } as Record<string, Signal<unknown>>;
const opened: Record<string, number> = {};
const released: Record<string, number> = {};
const originals = new Map<Signal<unknown>, Signal<unknown>['subscribe']>();

beforeAll(() => {
    for (const [name, signal] of Object.entries(signals)) {
        opened[name] = 0;
        released[name] = 0;
        const subscribe = signal.subscribe;
        originals.set(signal, subscribe);
        signal.subscribe = (run) => {
            opened[name]!++;
            const unsubscribe = subscribe.call(signal, run);
            let done = false;
            return () => {
                if (!done) released[name]!++;
                done = true;
                unsubscribe();
            };
        };
    }
});

afterAll(() => {
    for (const [signal, subscribe] of originals) signal.subscribe = subscribe;
});

const open = () => Object.fromEntries(Object.keys(signals).map((name) => [name, opened[name]! - released[name]!]));
const reset = () => Object.keys(signals).forEach((name) => ((opened[name] = 0), (released[name] = 0)));

function Page() {
    const t = useT();
    const locale = useCurrentLocale();
    const catalog = useTranslations();
    const enabled = useWriteEnabled();
    const store = useLocaleStore('en-us');
    const viaSignal = useSignal(currentlyLoadedLocale);
    const message = useMessage(() => ({ template: 'Required.', message: 'Required.' }));
    useNotifyNavigation(() => '/page');
    return (
        <main>
            <p>{t()('Hello', 'UI')}</p>
            <p>{locale()}</p>
            <p>{Object.keys(catalog()).length}</p>
            <p>{String(enabled())}</p>
            <p>{store.locale()}</p>
            <p>{viaSignal()}</p>
            <p>{message()}</p>
            <Translate category="UI">
                <h3>Block</h3>
            </Translate>
            <Phrase category="UI">Leaf</Phrase>
            <DontTranslate>Brand</DontTranslate>
        </main>
    );
}

describe('server renders release every core subscription they open', () => {
    it('CONTROL: a subscription tied to a disposed root counts as opened and released', () => {
        reset();
        createRoot((dispose) => {
            for (const signal of Object.values(signals)) onCleanup(signal.subscribe(() => {}));
            dispose();
        });
        expect(opened).toEqual({ tSignal: 1, currentlyLoadedLocale: 1, sTranslations: 1, writeEnabled: 1 });
        expect(released).toEqual({ tSignal: 1, currentlyLoadedLocale: 1, sTranslations: 1, writeEnabled: 1 });
    });

    it('50 renderToString renders of a page using every primitive leave nothing open', () => {
        reset();
        currentlyLoadedLocale.set('de-de');
        let html = '';
        for (let i = 0; i < 50; i++) html = renderToString(() => <Page />);
        expect(open()).toEqual({ tSignal: 0, currentlyLoadedLocale: 0, sTranslations: 0, writeEnabled: 0 });
        // The snapshot is the value at render time.
        expect(html).toContain('<p>Hello</p>');
        expect(html).toContain('<p>de-de</p>');
        expect(html).toContain('<p>Required.</p>');
    });
});
