import { children as resolveChildren, createEffect, onCleanup, onMount, untrack } from 'solid-js';
import type { JSX } from 'solid-js';
import { PHRASE_MARKER_ATTR, Phrase as VanillaPhrase } from 'langsys-js-typescript';
import { appendResolved } from './host.js';

/**
 * Props for the Solid `Phrase` component. Mirrors the React/Vue/Svelte
 * components.
 */
export interface PhraseProps {
    /** Category the phrase registers under (disambiguation for translators). */
    category?: string;
    /** Interpolation params — `{n}` for pluralization, `{name}`, etc. */
    params?: Record<string, unknown>;
    /** Host element tag. Defaults to `<span>`. */
    tag?: string;
    /** CSS class for the host element. */
    class?: string;
    children?: JSX.Element;
}

/**
 * Solid wrapper around the vanilla `Phrase` rich-text handler.
 *
 * Use it to keep a markup-bearing run as ONE translatable phrase — e.g. so a
 * count variable stays next to the noun it pluralizes:
 *
 *   <Phrase category="ProductCard" params={{ n: reviewCount() }}>
 *     Based on %n% <strong>reviews</strong>
 *   </Phrase>
 *
 * The inline markup never reaches the translator — it's replaced with neutral
 * tokens and the real elements are reconstituted at render (see richtext.ts in
 * the base SDK). The host carries `data-ls-phrase` so a wrapping `<Translate>`
 * skips it and lets this handler own it.
 *
 * Keep children static (literal markup): the handler takes over the rendered
 * subtree. For values Solid owns and re-renders, pass them through `params`.
 * Client-only: on the server, render plain markup and hydrate.
 */
export function Phrase(props: PhraseProps): JSX.Element {
    const host = document.createElement(props.tag ?? 'span');
    host.setAttribute(PHRASE_MARKER_ATTR, '');
    if (props.class) host.className = props.class;
    appendResolved(host, resolveChildren(() => props.children));

    let instance: VanillaPhrase | undefined;

    onMount(() => {
        // Recreate only when the category changes; param changes flow through
        // setParams below (hence the untrack).
        createEffect(() => {
            const options = { category: props.category ?? '', params: untrack(() => props.params) };
            instance?.destroy();
            instance = new VanillaPhrase(host, options);
        });
        createEffect(() => instance?.setParams(props.params ?? {}));
    });
    onCleanup(() => {
        instance?.destroy();
        instance = undefined;
    });

    return host;
}

export default Phrase;
