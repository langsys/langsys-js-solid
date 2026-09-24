import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { Show, createSignal } from 'solid-js';
import type { JSX } from 'solid-js';
import { render } from 'solid-js/web';
import { currentlyLoadedLocale } from 'langsys-js-typescript';
import { LangsysApp, createLocaleStore } from './index.js';
import { useNotifyNavigation } from './navigation.js';
import { useT } from './primitives.js';
import { setPage, sleep, startContractFixture, until, type ContractFixture } from '../test-support/contract.js';

/**
 * HINT-13 against the contract double (CONF-2, tier `contract`).
 *
 * A persistent layout holds a missing phrase and stays mounted while the route changes. With
 * the binding's call wired, the double stores a hint for the new page; without it, it stores
 * none. The key is permitted to report and reads-only from here, so the double WOULD store a
 * hint for page B — the absence case is evidence, not an empty state that any SDK would leave.
 *
 * Reports wait 5 to 30 seconds of jitter, so timers are faked with auto-advance: real network
 * I/O proceeds while a test jumps the jitter. Each scenario uses its own URLs, because the core
 * reports each URL once per session.
 */

// Registration waits out the flush debounce and reports wait out their jitter, so each case
// runs against the double for longer than vitest's 5s default.
vi.setConfig({ testTimeout: 30_000 });

let fx: ContractFixture;
const page = (path: string) => fx.origin + path;
const hints = async () => (await fx.state()).hints.map((h) => h.url);
const disposers: Array<() => void> = [];
const runOutJitter = () => vi.advanceTimersByTimeAsync(31_000);

function mount(view: () => JSX.Element): void {
    const el = document.createElement('div');
    document.body.appendChild(el);
    disposers.push(() => el.remove());
    disposers.push(render(view, el));
}

beforeAll(async () => {
    fx = await startContractFixture();
    await fx.seed({
        config: { renderer_egress_ips: ['10.9.9.9'] },
        projects: [{ id: 'p1', base_locale: 'en', target_locales: ['es-es'], website_url: fx.origin }],
        // Read-only from here, and permitted to report: the canonical public site.
        keys: [{ key: 'k-public', project: 'p1', type: 'ip_write', report_discovered_content: true }],
    });
    setPage(page('/start'));
    await LangsysApp.init({
        projectid: 'p1',
        key: 'k-public',
        UserLocaleStore: createLocaleStore('es-es'),
        baseLocale: 'en',
        apiUrl: fx.baseUrl,
    });
    await until(() => currentlyLoadedLocale.get() === 'es-es');
}, 30_000);

afterAll(async () => {
    await fx.stop();
});

afterEach(() => {
    while (disposers.length) disposers.pop()!();
    vi.useRealTimers();
});

const fakeTimers = () =>
    vi.useFakeTimers({
        toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'],
        shouldAdvanceTime: true,
    });

describe('HINT-13: a route change re-enters the SDK, so a persistent layout is reported for the new page', () => {
    it('with the binding wired, the layout miss is stored for page B', async () => {
        fakeTimers();
        const [route, setRoute] = createSignal('/a1');
        setPage(page('/a1'));
        mount(() => {
            const t = useT();
            useNotifyNavigation(route);
            return <span>{t()('Layout phrase', 'UI')}</span>;
        });
        await runOutJitter();
        await until(async () => (await hints()).includes(page('/a1')));

        setPage(page('/b1'));
        setRoute('/b1');
        await runOutJitter();
        await until(async () => (await hints()).includes(page('/b1')));
    });

    it('without the call, the same layout records nothing for page B, although the double would store it', async () => {
        fakeTimers();
        const [route, setRoute] = createSignal('/a2');
        setPage(page('/a2'));
        mount(() => {
            const t = useT();
            void route;
            return <span>{t()('Layout phrase', 'UI')}</span>;
        });
        await runOutJitter();
        await until(async () => (await hints()).includes(page('/a2')));

        setPage(page('/b2'));
        setRoute('/b2');
        await runOutJitter();
        await sleep(800);
        expect(await hints()).not.toContain(page('/b2'));
    });

    it('CONTROL: content that only page A rendered, unmounted by the navigation, records nothing at B', async () => {
        fakeTimers();
        const [route, setRoute] = createSignal('/a3');
        setPage(page('/a3'));
        const PageA = () => {
            const t = useT();
            return <p>{t()('Only on page A', 'UI')}</p>;
        };
        mount(() => {
            useNotifyNavigation(route);
            return (
                <Show when={route() === '/a3'}>
                    <PageA />
                </Show>
            );
        });
        await runOutJitter();
        await until(async () => (await hints()).includes(page('/a3')));

        setPage(page('/b3'));
        setRoute('/b3');
        await runOutJitter();
        await sleep(800);
        expect(await hints()).not.toContain(page('/b3'));
    });
});
