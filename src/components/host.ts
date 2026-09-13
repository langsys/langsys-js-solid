import { createComponent } from 'solid-js';
import type { JSX, ResolvedChildren } from 'solid-js';
import { Dynamic } from 'solid-js/web';

/**
 * Append Solid-resolved children to a host element. Solid resolves children to
 * DOM nodes, strings, or numbers (or arrays of those); anything non-Node
 * becomes a text node. Shared by the component wrappers, which hand the filled
 * host to the base SDK's DOM handlers.
 */
export function appendResolved(host: HTMLElement, resolved: () => ResolvedChildren): void {
    const items = resolved();
    for (const item of Array.isArray(items) ? items : [items]) {
        if (item == null || typeof item === 'boolean') continue;
        host.append(item instanceof Node ? item : document.createTextNode(String(item)));
    }
}

/**
 * The host a component emits under a SERVER render: its tag, its attributes,
 * and its children, untranslated.
 *
 * The browser path builds a real DOM node and hands it to the core, which walks
 * and translates it. There is no `document` on the server, so that path threw
 * `ReferenceError: document is not defined` and failed the whole response. This
 * is the lifecycle adaptation BIND-1 permits: same markup shape, nothing decided
 * about meaning, and the page degrades to the base language instead of erroring.
 *
 * It does NOT satisfy SRV-1..5. Serving translated HTML, request-scoped catalogs
 * and server-side child capture are open, and whether the client hydrates
 * cleanly against this markup is unproven (SRV-4).
 */
export function serverHost(
    tag: string,
    attributes: Record<string, string | undefined>,
    children: () => JSX.Element
): JSX.Element {
    // Drop absent attributes. Spreading `{ class: undefined }` makes Solid's
    // server build emit `class=""`, while the browser path sets no attribute at
    // all when the prop is absent — a server/client disagreement in exactly the
    // markup hydration has to match.
    const present = Object.fromEntries(Object.entries(attributes).filter(([, v]) => v !== undefined));
    return createComponent(Dynamic, {
        component: tag,
        ...present,
        get children() {
            return children();
        },
    } as never);
}
