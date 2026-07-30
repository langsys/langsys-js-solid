import type { ResolvedChildren } from 'solid-js';

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
