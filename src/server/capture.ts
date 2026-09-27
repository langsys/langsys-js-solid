import { createComponent, type JSX } from 'solid-js';
import { Dynamic, escape, resolveSSRNode } from 'solid-js/web';

/**
 * A server `<Translate>`'s children, captured as the one HTML string Solid's server build renders
 * them to, and a translated string emitted back as the host's content.
 *
 * Solid's server build hands a component its children already rendered: strings, `{ t: html }`
 * nodes, or arrays of them, with hydration keys (`data-hk`) on elements and hydration comments
 * around every dynamic insert. The capture resolves them exactly as the host element's own render
 * would (`escape`, then `resolveSSRNode`), so capturing and emitting unchanged is byte-identical to
 * rendering the children directly.
 *
 * **Children are read exactly once.** Each read re-renders the subtree and takes new hydration
 * keys, so a second read would shift the keys the client hydrates against and record every miss
 * twice. The single captured string is what is emitted.
 *
 * **A child that has not rendered yet cannot be captured.** Under `<Suspense>` the host receives
 * the fallback and a placeholder (`<template id="pl-…">`), and the content arrives later, outside
 * the host. Capturing it would key a block on the fallback, so the capture fails with a named
 * error instead. A fallback that is bare text, with no element, carries no hydration key, and a
 * string render cannot be told apart from content.
 */

/** Thrown for a child a server render cannot capture, such as pending `<Suspense>` content. */
export class UncapturableChildError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'UncapturableChildError';
    }
}

/**
 * Pending `<Suspense>` content, as each render mode hands it over: a streamed render gives a
 * `<template id="pl-…">` placeholder, and a string render the fallback itself, whose hydration keys
 * carry the `F` Solid gives a fallback branch (context ids are otherwise digits and lowercase).
 */
const SUSPENSE_PLACEHOLDER = /<template id="pl-[^"]*">|data-hk="[^"]*F/;

/** Read the children once and return the HTML they render to. */
export function captureChildren(read: () => unknown): string {
    const html = resolveSSRNode(escape(read() as string)) as string;
    if (SUSPENSE_PLACEHOLDER.test(html)) {
        throw new UncapturableChildError(
            'A <Translate> child is still pending under <Suspense> on the server, so its content cannot be captured. Move the <Suspense> boundary outside the <Translate>, or resolve the data before rendering it.'
        );
    }
    return html;
}

/** What a host renders: its raw content, and the stamp attributes that go with it. */
export interface HostContent {
    html: string;
    stamp?: Record<string, string | undefined>;
}

/**
 * The host element, with the content `render` returns as its raw HTML and `stamp` on the host.
 *
 * `render` runs inside the host's own render, after the host has taken its hydration key, so
 * children captured there take the keys a direct render gives them. It runs once; each stamp
 * attribute in `stampKeys` reads that one result, and an absent one is left off.
 */
export function emitHost(
    tag: string,
    attributes: Record<string, string | undefined>,
    render: () => HostContent,
    stampKeys: readonly string[] = []
): JSX.Element {
    let content: HostContent | undefined;
    const rendered = () => (content ??= render());
    const props: Record<string, unknown> = { component: tag };
    Object.defineProperty(props, 'innerHTML', { enumerable: true, get: () => rendered().html });
    for (const [name, value] of Object.entries(attributes)) if (value !== undefined) props[name] = value;
    for (const name of stampKeys) {
        Object.defineProperty(props, name, { enumerable: true, get: () => rendered().stamp?.[name] });
    }
    return createComponent(Dynamic, props as never);
}
