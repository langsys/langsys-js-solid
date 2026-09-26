import type { Accessor } from 'solid-js';
import { renderServerMessage, type ServerMessage } from 'langsys-js-typescript';
import { useT } from './primitives.js';

/**
 * A server message entry as a Solid accessor that re-renders with the catalog and the locale.
 *
 * What is shown is the core's decision (MSG-5): `renderServerMessage` renders the entry's
 * template through `t()` under the messages category when the catalog holds it, and otherwise
 * shows the entry's `message`, as it does for an entry with no template; `message` is never used
 * as a lookup key and `code` never chooses text. This wrapper only adds timing: reading `t` makes the accessor depend on the catalog and
 * locale, so it repaints when either changes.
 *
 * `category` overrides the category configured at `init` (`messagesCategory`, default `Errors`)
 * for this entry alone.
 */
export function useMessage(entry: Accessor<ServerMessage>, category?: string): Accessor<string> {
    const t = useT();
    return () => {
        t();
        return renderServerMessage(entry(), category);
    };
}
