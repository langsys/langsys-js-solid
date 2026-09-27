import { describe, expect, it } from 'vitest';
import { Show, Suspense, createComponent, createResource, type JSX } from 'solid-js';
import { renderToStream, renderToString } from 'solid-js/web';
import { DontTranslate, Phrase } from '../index.js';
import { serverHost } from '../components/host.js';
import { UncapturableChildError, captureChildren, emitHost } from './capture.js';

/**
 * The server capture a `<Translate>` host will hand the core, and the emit of what comes back.
 *
 * Captured and emitted unchanged, every child shape renders byte-identical to the host rendering
 * its children directly, hydration keys included, for the host and for the sibling after it: the
 * capture takes the same keys the direct render does, so the client hydrates against the same
 * markup. The children are read exactly once. A child still pending under `<Suspense>` fails with
 * a named error rather than being captured as its fallback.
 */

function Captured(props: { children?: JSX.Element }) {
    return emitHost('translate', { class: undefined }, () => ({ html: captureChildren(() => props.children) }));
}

function Direct(props: { children?: JSX.Element }) {
    return serverHost('translate', { class: undefined }, () => props.children);
}

function Name() {
    return <b>Ana</b>;
}

type Host = typeof Captured;
const count = 3;
const shapes: Record<string, (H: Host) => JSX.Element> = {
    'static markup': (H) => (
        <H>
            <h3>Welcome to our store</h3>
            <p class="lead" title="Hi">
                Browse the <a href="/c">catalog</a> &amp; save.
            </p>
        </H>
    ),
    'text only': (H) => <H>Just a sentence.</H>,
    'dynamic value': (H) => (
        <H>
            <p>
                You have {count} items, {'Ana & Bo <3'}.
            </p>
        </H>
    ),
    'component child': (H) => (
        <H>
            <p>
                Hi <Name /> there
            </p>
        </H>
    ),
    'control flow': (H) => (
        <H>
            <Show when={true}>
                <p>Shown</p>
            </Show>
        </H>
    ),
    'nested Phrase and DontTranslate': (H) => (
        <H>
            <p>
                Sign in with <DontTranslate>Langsys ID</DontTranslate>.
            </p>
            <Phrase category="UI">Leaf</Phrase>
        </H>
    ),
    'entities and void elements': (H) => (
        <H>
            <p>
                &copy; A<br />B<img src="x.png" alt="Pic" />
            </p>
        </H>
    ),
};

describe('captureChildren and emitHost', () => {
    for (const [name, shape] of Object.entries(shapes)) {
        it(`${name}: captured and emitted unchanged is the direct render, byte for byte`, () => {
            const page = (H: Host) => () => (
                <main>
                    {shape(H)}
                    <p>After</p>
                </main>
            );
            expect(renderToString(page(Captured))).toBe(renderToString(page(Direct)));
        });
    }

    it('the fallback serves the captured source unchanged, with the stamp on the host', () => {
        const stampKeys = ['data-ls-contentblock', 'data-ls-resolved'];
        function Stamped(props: { children?: JSX.Element }) {
            return emitHost(
                'translate',
                { class: undefined },
                () => ({
                    html: captureChildren(() => props.children),
                    stamp: { 'data-ls-contentblock': 'cb-1', 'data-ls-resolved': 'es-es' },
                }),
                stampKeys
            );
        }
        const page = (H: Host) => () => (
            <main>
                {shapes['dynamic value']!(H)}
                <p>After</p>
            </main>
        );
        const stamped = renderToString(page(Stamped));
        expect(stamped).toMatch(/<translate [^>]*data-ls-contentblock="cb-1" data-ls-resolved="es-es"/);
        // Only the host's attributes differ: Solid spaces a tag's attribute list by where it ends.
        const tidy = (html: string) =>
            html.replace(/ data-ls-contentblock="cb-1" data-ls-resolved="es-es"/, '').replace(/ >/g, '>');
        expect(tidy(stamped)).toBe(tidy(renderToString(page(Direct))));
    });

    it('reads the children exactly once', () => {
        let reads = 0;
        renderToString(() =>
            createComponent(Captured, {
                get children() {
                    reads++;
                    return <p>Once</p>;
                },
            })
        );
        expect(reads).toBe(1);
    });

    function Pending() {
        const [value] = createResource(() => new Promise<string>(() => {}));
        return <p>{value()}</p>;
    }
    const pending = () => (
        <Captured>
            <Suspense fallback={<i>loading</i>}>
                <Pending />
            </Suspense>
        </Captured>
    );

    it('a child pending under <Suspense> fails with a named error in a streamed render', () => {
        expect(() => renderToStream(pending)).toThrow(UncapturableChildError);
    });

    it('a child pending under <Suspense> fails with a named error in a string render', () => {
        expect(() => renderToString(pending)).toThrow(UncapturableChildError);
    });
});
