import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * CONF-2 / CONF-3 — the conformance file is checked, not trusted.
 *
 * CONF-2 requires the evidence grade to be RECORDED; CONF-3 requires runtime
 * rules to carry the mutation that proves them. A document can claim both and
 * still be wrong, so this test holds the file to the canonical format and fails
 * the build when it drifts: a tier its status cannot carry (`implemented` with
 * `mock` evidence is really `provisional`), a rule rowed twice, an
 * `implemented` row naming a test that does not exist, a `delegated` row with no
 * firing control, a header that disagrees with its own table, or a verifier
 * table with nothing in it.
 *
 * It checks STRUCTURE only. Whether all of the spec's ids are present needs the
 * spec, which lives in a sibling repository CI cannot see; that half is
 * `_dev_/tally-conformance.mjs`, run by hand against a langsys2 checkout. A
 * check that silently skipped in CI would be worse than none.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TIERS = ['live', 'contract', 'mock', 'n/a (pure)', '-'];

function testFilesOnDisk(): Set<string> {
    const walk = (d: string): string[] =>
        readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [e.name]));
    return new Set(walk(join(ROOT, 'src')).filter((f) => /\.test\.tsx?$/.test(f)));
}

const splitRow = (line: string) =>
    line
        .split(/(?<!\\)\|/)
        .slice(1, -1)
        .map((c) => c.trim());

/** The tiers each canonical status may carry, or null for a non-canonical status. */
function allowedTiers(status: string): string[] | null {
    if (status === 'implemented') return ['live', 'contract', 'n/a (pure)'];
    if (status === 'provisional') return ['mock'];
    if (['partial', 'not implemented', 'delegated', 'waived'].includes(status)) return ['-'];
    if (status === 'held (strip ruling)') return TIERS;
    if (/^n\/a \(profile: .+\)$/.test(status) || /^n\/a \(architecture: .{12,}\)$/.test(status)) return ['-'];
    return null;
}

function check(md: string, tests: Set<string>): string[] {
    const errors: string[] = [];
    const lines = md.split('\n');

    const rev = lines.find((l) => /^\|\s*\*\*Spec revision read\*\*\s*\|/.test(l));
    if (!rev || !/\bblob\s+[0-9a-f]{40}\b/.test(rev) || !/\blangsys2\s+[0-9a-f]{7,40}/.test(rev)) {
        errors.push('header: "Spec revision read" must name langsys2 <commit> and blob <40-hex>');
    }
    if (!lines.some((l) => /^\|\s*\*\*Profiles\*\*\s*\|/.test(l))) errors.push('header: no "Profiles" row');

    const starts = lines.flatMap((l, i) =>
        /^\|\s*Rule\s*\|\s*Status\s*\|\s*Tier\s*\|\s*Evidence\s*\|/.test(l) ? [i] : []
    );
    if (starts.length !== 1) {
        errors.push(`expected exactly one status table, found ${starts.length}`);
        return errors;
    }

    const seen = new Set<string>();
    let rows = 0;
    for (let j = starts[0] + 2; j < lines.length && lines[j].startsWith('|'); j++) {
        rows++;
        const [id = '', status = '', tier = '', ...rest] = splitRow(lines[j]);
        const evidence = rest.join(' ');
        if (!/^[A-Z]{2,5}-\d+$/.test(id)) {
            errors.push(`:${j + 1} rule cell "${id}" is not exactly one rule id`);
            continue;
        }
        if (seen.has(id)) errors.push(`${id} is rowed more than once`);
        seen.add(id);

        const allowed = allowedTiers(status);
        if (!allowed) errors.push(`${id}: status "${status}" is not canonical`);
        else if (!allowed.includes(tier)) errors.push(`${id}: status "${status}" cannot carry tier "${tier}"`);

        if (status === 'implemented') {
            const named = [...evidence.matchAll(/`([^`]+)`/g)].some((m) => tests.has(m[1].split('/').pop() ?? ''));
            if (!named) errors.push(`${id}: implemented names no test file that exists`);
        }
        if (status === 'delegated' && !(/core row/i.test(evidence) && /control/i.test(evidence))) {
            errors.push(`${id}: delegated must name the core row and a firing control`);
        }
        if (status === 'provisional' && !/waits on:/i.test(evidence))
            errors.push(`${id}: provisional must say what it waits on`);
        if (status === 'waived' && !(/operator/i.test(evidence) && /agree/i.test(evidence))) {
            errors.push(`${id}: waived needs the operator's recorded agreement`);
        }
    }

    const declared = md.match(/\|\s*\*\*Spec version\*\*\s*\|[^\n]*?(\d+) rules/)?.[1];
    if (!declared) errors.push('header: "Spec version" row must state "<n> rules"');
    else if (Number(declared) !== rows)
        errors.push(`header declares ${declared} rules, the status table has ${rows} rows`);

    const verifier = md.split(/^## Check-the-verifier/m)[1]?.split(/^## /m)[0] ?? '';
    const mutationRows = verifier.split('\n').filter((l) => l.startsWith('|')).length - 2;
    if (mutationRows < 1) errors.push('CONF-3: the Check-the-verifier section records no mutations');

    return errors;
}

const header = (rules: number) =>
    [
        '| | |',
        '|---|---|',
        '| **Spec revision read** | langsys2 5cff03a1, docs/sdk-spec.mdx blob 5c5c0723f88fb8e6b13f58876c7adca8b6b35691 |',
        '| **Profiles** | browser, binding, all |',
        `| **Spec version** | 8.0.1 — ${rules} rules |`,
        '',
        '| Rule | Status | Tier | Evidence |',
        '|---|---|---|---|',
    ].join('\n');
const verifierSection = '\n\n## Check-the-verifier\n\n| Mutation | Result |\n|---|---|\n| stamp removed | 2 failed |\n';

describe('CONFORMANCE.md is held to the canonical format (CONF-2, CONF-3)', () => {
    const tests = testFilesOnDisk();

    it('passes every structural check', () => {
        const md = readFileSync(join(ROOT, 'CONFORMANCE.md'), 'utf8');
        expect(check(md, tests)).toEqual([]);
    });

    it('CONTROL: a minimal valid file passes, so the checks below are not rejecting everything', () => {
        const md =
            header(2) +
            '\n| BIND-1 | implemented | n/a (pure) | `src/surface.test.ts` |' +
            '\n| GATE-1 | delegated | - | core row GATE-1; probe mine 0 / core 9 (firing control) |' +
            verifierSection;
        expect(check(md, tests)).toEqual([]);
    });

    it('POSITIVE CONTROL: rejects implemented carrying mock evidence (that row is provisional)', () => {
        const md = header(1) + '\n| BIND-1 | implemented | mock | `src/surface.test.ts` |' + verifierSection;
        expect(check(md, tests)).toContain('BIND-1: status "implemented" cannot carry tier "mock"');
    });

    it('POSITIVE CONTROL: rejects a rule rowed twice, and an implemented row naming no real test', () => {
        const md =
            header(2) +
            '\n| BIND-1 | implemented | n/a (pure) | `src/no-such.test.ts` |' +
            '\n| BIND-1 | implemented | n/a (pure) | `src/surface.test.ts` |' +
            verifierSection;
        const errors = check(md, tests);
        expect(errors).toContain('BIND-1 is rowed more than once');
        expect(errors).toContain('BIND-1: implemented names no test file that exists');
    });

    it('POSITIVE CONTROL: rejects a delegated row with no firing control', () => {
        const md = header(1) + '\n| GATE-1 | delegated | - | the core does it |' + verifierSection;
        expect(check(md, tests)).toContain('GATE-1: delegated must name the core row and a firing control');
    });

    it('POSITIVE CONTROL: rejects a header that disagrees with its own table', () => {
        const md = header(3) + '\n| BIND-1 | implemented | n/a (pure) | `src/surface.test.ts` |' + verifierSection;
        expect(check(md, tests)).toContain('header declares 3 rules, the status table has 1 rows');
    });

    it('POSITIVE CONTROL: rejects an empty verifier table (CONF-3)', () => {
        const md =
            header(1) +
            '\n| BIND-1 | implemented | n/a (pure) | `src/surface.test.ts` |' +
            '\n\n## Check-the-verifier\n\n| Mutation | Result |\n|---|---|\n';
        expect(check(md, tests)).toContain('CONF-3: the Check-the-verifier section records no mutations');
    });
});
