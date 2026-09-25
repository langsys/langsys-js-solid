import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { render } from 'solid-js/web';
import { LegacyFormatError, currentlyLoadedLocale, type LegacyKeyFile } from 'langsys-js-typescript';
import { LangsysApp, createLocaleStore } from './index.js';
import { useT } from './primitives.js';
import { setPage, startContractFixture, until, type ContractFixture } from '../test-support/contract.js';

/**
 * The legacy-key mode (MIG-1..8) is the core's. This binding's part is carrying `legacyKeys` from
 * its `init` to the core's untouched, so the file set the core resolves is the one the app
 * configured.
 *
 * Both probes read what the core did with the files, not what was handed to it. A file the core
 * does not read is refused by name, so the file reaches the core as configured. And against the
 * contract double (CONF-2, tier `contract`), a key rendered through `useT()` registers its
 * converted value under the key's namespace, never the key string; a `vue-i18n` pipe registers as
 * a plural, which it does only when the file's declared format arrives with it; and a non-key
 * argument registers as literal source text in the same window. The session may write, so the
 * double would register the key string too if it were sent.
 */

vi.setConfig({ testTimeout: 30_000 });

const legacyKeys: LegacyKeyFile[] = [
    {
        name: 'locales/en.json',
        format: 'vue-i18n',
        data: { checkout: { submit: 'Pay now', greet: 'Hello {{name}}', items: 'item | items' } },
    },
];

let fx: ContractFixture;
const disposers: Array<() => void> = [];
/**
 * `t()`'s type reads the params a call may pass from the placeholders in its first argument. A key
 * has none, so a keyed call with params is typed through this plain signature.
 */
const keyed = (t: unknown) => t as (key: string, params?: Record<string, unknown>) => string;
const phrases = async () => (await fx.state()).projects.p1.phrases;

beforeAll(async () => {
    fx = await startContractFixture();
    await fx.seed({
        projects: [{ id: 'p1', base_locale: 'en', target_locales: ['es-es'], website_url: fx.origin }],
        keys: [{ key: 'k-writer', project: 'p1', type: 'ip_write', ip_allowlist: ['127.0.0.1'] }],
    });
    setPage(fx.origin + '/page');
}, 30_000);

afterAll(async () => {
    while (disposers.length) disposers.pop()!();
    await fx.stop();
});

describe('MIG: the binding hands legacyKeys to the core untouched', () => {
    it('a file the core does not read is refused, naming the file', async () => {
        const init = LangsysApp.init({
            projectid: 'p1',
            key: 'k-writer',
            UserLocaleStore: createLocaleStore('es-es'),
            apiUrl: fx.baseUrl,
            legacyKeys: [{ name: 'locale/en/LC_MESSAGES/django.mo', data: {} }],
        });
        await expect(init).rejects.toBeInstanceOf(LegacyFormatError);
        await expect(init).rejects.toThrow('locale/en/LC_MESSAGES/django.po');
    });

    it('a key registers its converted value under its namespace; a non-key registers as written', async () => {
        await LangsysApp.init({
            projectid: 'p1',
            key: 'k-writer',
            UserLocaleStore: createLocaleStore('es-es'),
            baseLocale: 'en',
            apiUrl: fx.baseUrl,
            legacyKeys,
        });
        await until(() => currentlyLoadedLocale.get() === 'es-es');

        const el = document.createElement('div');
        document.body.appendChild(el);
        disposers.push(() => el.remove());
        disposers.push(
            render(() => {
                const t = useT();
                return (
                    <p>
                        <span>{t()('checkout.submit')}</span>
                        <span>{keyed(t())('checkout.greet', { name: 'Ana' })}</span>
                        <span>{keyed(t())('checkout.items', { count: 2 })}</span>
                        <span>{t()('Welcome back!', 'UI')}</span>
                    </p>
                );
            }, el)
        );
        expect(el.textContent).toBe('Pay nowHello AnaitemsWelcome back!');

        await until(async () => (await phrases()).some((p) => p.phrase === 'Welcome back!'));
        await until(async () => (await phrases()).some((p) => p.phrase === 'Hello {name}'));
        const registered = await phrases();
        expect(registered).toContainEqual(expect.objectContaining({ category: 'checkout', phrase: 'Pay now' }));
        expect(registered).toContainEqual(expect.objectContaining({ category: 'checkout', phrase: 'Hello {name}' }));
        expect(registered).toContainEqual(
            expect.objectContaining({ category: 'checkout', phrase: '{count, plural, =1 {item} other {items}}' })
        );
        expect(registered).toContainEqual(expect.objectContaining({ category: 'UI', phrase: 'Welcome back!' }));
        expect(registered.map((p) => p.phrase)).not.toContain('checkout.submit');
        expect(registered.map((p) => p.phrase)).not.toContain('checkout.greet');
        expect(registered.map((p) => p.phrase)).not.toContain('item | items');
    });
});
