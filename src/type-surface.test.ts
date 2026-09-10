import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

/**
 * BIND-6 v2(b)/(c) — the exported type must not widen to core-private members.
 *
 * ## Why a type-level test, when the runtime one already passes
 * The proxy forwards **everything** on the core's prototype, because
 * TypeScript's `private` is erased at runtime and `getOwnPropertyNames` cannot
 * see it. That uniform forwarding is fine — it is what keeps a future public
 * member from being dropped — but it means the runtime surface is *wider than
 * the API*. The only thing holding the line is the exported type, and nothing
 * was asserting that.
 *
 * **The mechanism, stated precisely, because the error code depends on it.**
 * `Omit<typeof _LangsysApp, …>` is a mapped type over `keyof`, and `keyof`
 * **drops private members entirely** — it does not carry their `private`
 * modifier through. So on the exported type these five simply do not exist,
 * which is `TS2339` ("Property does not exist"). Accessing the same member on
 * the *raw* core type instead yields `TS2341` ("Property is private and only
 * accessible within class"), measured. The assertions below are therefore
 * coupled to the **mapped-type shape** of the export: replacing `Omit<…>` with
 * the raw core type would still reject the members, but with a different code,
 * and these rows would fail for a reason that is not a regression.
 *
 * Without this test, someone "simplifying" the export to `any`, to
 * `Record<string, unknown>`, or to a hand-written interface listing what the
 * prototype walk reports would publish five core-internal methods as this
 * binding's API, with every runtime test still green.
 *
 * ## What it asserts
 * Two fixtures under `src/type-probes/` (excluded from `tsconfig.json`, so
 * `npm run typecheck` stays green while one of them is deliberately broken):
 *
 *   - the **negative probe** names the five core-private members and must fail
 *     with `TS2339` on every line;
 *   - the **positive control** names five genuinely public members and must
 *     compile clean. Without it the negative probe would pass equally well
 *     against a broken import path or a type that refused everything — neither
 *     of which says anything about privacy.
 */

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');

/** The private members. Kept explicit so a failure names which one leaked. */
const CORE_PRIVATE = [
    'applyAuthorization',
    'getUserLanguagePreferences',
    'parseAcceptLanguageHeader',
    'findBestLocaleMatch',
    'resolveLocale',
] as const;

/** Memoized: `tsc` is slow, and each fixture's result is deterministic. */
const cache = new Map<string, { status: number; output: string }>();

function typecheck(fixture: string): { status: number; output: string } {
    const hit = cache.get(fixture);
    if (hit) return hit;

    const result = spawnSync(
        'npx',
        [
            'tsc',
            '--noEmit',
            '--strict',
            '--module',
            'ESNext',
            '--moduleResolution',
            'Bundler',
            '--target',
            'ES2021',
            '--lib',
            'ES2021,DOM',
            '--jsx',
            'preserve',
            '--jsxImportSource',
            'solid-js',
            `src/type-probes/${fixture}`,
        ],
        { cwd: repoRoot, encoding: 'utf8' }
    );
    const out = { status: result.status ?? -1, output: `${result.stdout ?? ''}${result.stderr ?? ''}` };
    cache.set(fixture, out);
    return out;
}

describe('BIND-6 — the exported type refuses core-private members', () => {
    it('POSITIVE CONTROL: public members compile clean (exit 0)', () => {
        const { status, output } = typecheck('public-member.probe.ts');
        expect(status, `public probe should compile; tsc said:\n${output}`).toBe(0);
    });

    it('negative probe fails to compile (non-zero exit)', () => {
        const { status } = typecheck('private-member.probe.ts');
        expect(status).not.toBe(0);
    });

    it.each(CORE_PRIVATE)('rejects `%s` with TS2339', (member) => {
        const { output } = typecheck('private-member.probe.ts');
        expect(output).toContain(`error TS2339: Property '${member}' does not exist`);
    });
});
