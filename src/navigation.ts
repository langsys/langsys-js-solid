import { createEffect, on } from 'solid-js';
import type { Accessor } from 'solid-js';
import { notifyNavigation } from 'langsys-js-typescript';

/**
 * HINT-13 — tell the core the route changed, so mounted content re-enters the lookup.
 *
 * A component that stays mounted across a navigation (a layout, a header) does not re-render
 * when only the route changes, so its missing phrases are never recorded against the new URL.
 * The core's `notifyNavigation()` republishes `t`, which every `useT()` consumer already
 * depends on; the mounted nodes re-render and record their misses at the URL the page is now
 * on. Content no longer mounted records nothing, and a second call for the same URL reports
 * nothing more.
 *
 * This hook only times the call. Pass an accessor that changes on navigation — with
 * `@solidjs/router`:
 *
 *   const location = useLocation();
 *   useNotifyNavigation(() => location.pathname + location.search + location.hash);
 *
 * The first run is skipped: the initial render is not a navigation. Apps on another router
 * call `notifyNavigation()` from its after-navigation hook instead.
 */
export function useNotifyNavigation(route: Accessor<unknown>): void {
    createEffect(on(route, () => notifyNavigation(), { defer: true }));
}
