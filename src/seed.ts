import { createComponent, type JSX } from 'solid-js';
import { Dynamic, isServer } from 'solid-js/web';
import { LangsysApp as _LangsysApp, currentRequestScope, type iCategories } from 'langsys-js-typescript';

/**
 * The hydration hand-off (SRV-4): the catalog a server render used, carried to the client so its
 * first render agrees with the served HTML.
 *
 * On the server, `<LangsysSeed />` writes the current request scope's seed into the page as a JSON
 * script. On the client, `seedFromDocument()` reads it and seeds the core synchronously; call it
 * before `hydrate()`/`mount()`. Put the component in the document's `<head>`, outside what the
 * client hydrates: it renders nothing in the browser.
 */

/** The id of the script element the seed is written to. */
export const SEED_ELEMENT_ID = 'langsys-seed';

/** JSON that is safe inside a `<script>`: no `</script>`, and no line separators JS rejects. */
function scriptSafeJson(value: unknown): string {
    return JSON.stringify(value)
        .replace(/</g, '\\u003c')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029');
}

/** Writes the request scope's seed into the page. Renders nothing outside a scope or in the browser. */
export function LangsysSeed(): JSX.Element {
    if (!isServer) return null;
    const scope = currentRequestScope();
    if (!scope) return null;
    return createComponent(Dynamic, {
        component: 'script',
        type: 'application/json',
        id: SEED_ELEMENT_ID,
        innerHTML: scriptSafeJson(scope.seed()),
    });
}

/**
 * Seed the core from the catalog the server rendered with, synchronously. Returns false when the
 * page carries no seed.
 */
export function seedFromDocument(doc: Document = document): boolean {
    const text = doc.getElementById(SEED_ELEMENT_ID)?.textContent;
    if (!text) return false;
    const seed = JSON.parse(text) as { locale: string; catalog: iCategories };
    _LangsysApp.seedCatalog(seed.catalog, seed.locale);
    return true;
}
