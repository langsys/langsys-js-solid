import { children as resolveChildren } from 'solid-js';
import type { JSX } from 'solid-js';
import { appendResolved } from './host.js';

/**
 * Props for the Solid `DontTranslate` component. Mirrors the React/Vue/Svelte
 * components.
 */
export interface DontTranslateProps {
    /** Host element tag. Defaults to `<span>`. */
    tag?: string;
    /** CSS class for the host element. */
    class?: string;
    children?: JSX.Element;
}

/**
 * Marks a region as never-translated, preserved verbatim:
 *
 *   Built with <DontTranslate>Kangen®</DontTranslate> on
 *   <DontTranslate>langsys.dev</DontTranslate>
 *
 * The host carries the standard `translate="no"` attribute, which both the
 * tokenizer and the renderer in the base SDK already honor — so its content is
 * never tokenized, registered, or replaced. Pure presentational glue; no
 * vanilla handler needed.
 */
export function DontTranslate(props: DontTranslateProps): JSX.Element {
    const host = document.createElement(props.tag ?? 'span');
    host.setAttribute('translate', 'no');
    host.setAttribute('data-ls-dont-translate', '');
    if (props.class) host.className = props.class;
    appendResolved(host, resolveChildren(() => props.children));
    return host;
}

export default DontTranslate;
