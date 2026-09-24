import { spawn, type ChildProcess } from 'node:child_process';
import { join } from 'node:path';

/**
 * Starts the vendored contract double (`contract-fixture/server.mjs`, CONF-2) in its own process.
 *
 * There is no accessor for what the double received: `state()` returns accepted state only,
 * which is what CONF-1 lets a test assert on.
 *
 * The page URL is placed on the double's own origin. happy-dom applies the same-origin policy
 * to `fetch` and the double sends no CORS headers, so a page on any other origin could not reach
 * it. Seed the project's `website_url` with `origin`; the double stores a hint only for a URL on
 * the project's host.
 */
export interface ContractFixture {
    baseUrl: string;
    origin: string;
    seed(doc: unknown): Promise<void>;
    state(): Promise<AcceptedState>;
    stop(): Promise<void>;
}

export interface AcceptedState {
    projects: Record<
        string,
        {
            phrases: Array<{ category: string | null; phrase: string }>;
            blocks: Array<{ category: string | null; custom_id: string; phrases: Array<{ phrase: string }> }>;
        }
    >;
    hints: Array<{ project_id: string; url: string }>;
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function until(check: () => boolean | Promise<boolean>, timeoutMs = 15_000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        if (await check()) return;
        await sleep(25);
    }
    throw new Error(`condition not met within ${timeoutMs}ms`);
}

/** Move the page to a URL, as a router's `pushState` would. */
export function setPage(url: string): void {
    (window as unknown as { happyDOM: { setURL(u: string): void } }).happyDOM.setURL(url);
}

export async function startContractFixture(): Promise<ContractFixture> {
    const script = join(process.cwd(), 'contract-fixture', 'server.mjs');
    const child: ChildProcess = spawn(process.execPath, [script], { stdio: ['ignore', 'pipe', 'inherit'] });

    const ready = await new Promise<{ base_url: string; fixture_url: string }>((resolve, reject) => {
        let buffered = '';
        const timer = setTimeout(() => reject(new Error('contract fixture did not report ready within 10s')), 10_000);
        child.stdout!.on('data', (chunk: Buffer) => {
            buffered += chunk.toString('utf8');
            const newline = buffered.indexOf('\n');
            if (newline < 0) return;
            clearTimeout(timer);
            try {
                resolve(JSON.parse(buffered.slice(0, newline)));
            } catch (err) {
                reject(err);
            }
        });
        child.once('exit', (code) => reject(new Error(`contract fixture exited early with code ${code}`)));
    });

    const origin = new URL(ready.base_url).origin;
    setPage(origin + '/');

    return {
        baseUrl: ready.base_url,
        origin,
        seed: async (doc) => {
            const res = await fetch(ready.fixture_url + '/seed', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(doc),
            });
            if (!res.ok) throw new Error(`fixture /seed answered ${res.status}: ${await res.text()}`);
        },
        state: async () => (await (await fetch(ready.fixture_url + '/state')).json()) as AcceptedState,
        stop: () =>
            new Promise<void>((resolve) => {
                if (child.exitCode !== null) return resolve();
                child.once('exit', () => resolve());
                child.kill('SIGTERM');
            }),
    };
}
