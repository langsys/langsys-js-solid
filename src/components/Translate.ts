import { children as resolveChildren, createEffect, onCleanup, onMount, untrack } from 'solid-js';
import type { JSX } from 'solid-js';
import { Translate as VanillaTranslate, type ParamPrimitive } from 'langsys-js-typescript';
import { appendResolved } from './host.js';

/**
 * Props for the Solid `Translate` component. Mirrors the React/Vue/Svelte
 * components 1:1.
 */
export interface TranslateProps {
    /** Optional category under which tokens are registered. Helps translators disambiguate. */
    category?: string;
    /** Optional stable id for the content block. If omitted, the SDK hashes category + tokens. */
    custom_id?: string;
    /** Optional human-readable label shown in the Translation Manager. */
    label?: string;
    /** Host element tag. Defaults to a `<translate>` custom element. */
    tag?: string;
    /** CSS class for the host element. */
    class?: string;
    /**
     * Interpolation params for `{name}`-style placeholders in the content —
     * same single-brace syntax as `t()`. In markup, author the placeholders as
     * `%name%` (the base SDK normalizes `%name%` → `{name}` at capture); a bare
     * `{name}` collides with JSX expressions, so `%name%` is the portable form.
     */
    params?: Record<string, ParamPrimitive>;
    children?: JSX.Element;
}

/**
 * Solid wrapper around the vanilla `Translate` DOM class from
 * `langsys-js-typescript`. It renders a host element, then on mount lets the
 * vanilla class walk and tokenize the rendered children (text nodes plus
 * translatable attributes), register the content block, and re-translate on
 * locale change. On cleanup it tears the instance down.
 *
 * This is the Solid analog of the React/Vue/Svelte `<Translate>` components —
 * pure mount/destroy glue; the component returns a real DOM node (a shape
 * Solid renders as-is), so it needs no JSX compilation inside the library.
 *
 * The SDK mutates the rendered DOM in place, so keep the children static:
 * prose, marketing copy, CMS-rendered HTML — the content-block use case. For
 * dynamic per-string values that Solid owns and re-renders, use `useT()`
 * instead. Client-only: on the server, render plain markup and hydrate.
 */
export function Translate(props: TranslateProps): JSX.Element {
    const host = document.createElement(props.tag ?? 'translate');
    if (props.class) host.className = props.class;
    appendResolved(host, resolveChildren(() => props.children));

    let instance: VanillaTranslate | undefined;

    onMount(() => {
        // Recreate when identity props change; param changes flow through
        // setParams below without recreating (hence the untrack).
        createEffect(() => {
            const options = {
                category: props.category ?? '',
                custom_id: props.custom_id ?? '',
                label: props.label ?? '',
                params: untrack(() => props.params),
            };
            instance?.destroy();
            instance = new VanillaTranslate(host, options);
        });
        createEffect(() => instance?.setParams(props.params));
    });
    onCleanup(() => {
        instance?.destroy();
        instance = undefined;
    });

    return host;
}

export default Translate;
