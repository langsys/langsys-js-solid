import { AsyncLocalStorage } from 'node:async_hooks';
import { getRequestEvent } from 'solid-js/web';
import { createRequestScope, setRequestScopeStorage, type RequestScope } from 'langsys-js-typescript';

/**
 * SolidStart server rendering, one request scope per request (spec SRV-7).
 *
 * The request scope is the core's: its locale, its view of the catalog, the misses its render
 * records, and the seed its page hands the client. This module only wires SolidStart's request
 * lifecycle to it, and holds no request state of its own. It is server-only: it imports
 * `node:async_hooks`, which the main entry never does.
 *
 * SolidStart runs each middleware inside its request event (`getRequestEvent()` answers there), and
 * `next()` renders the page in the same async chain. So the middleware opens the scope, renders
 * inside `scope.run(next)` with an `AsyncLocalStorage` holding it across every `await` of the
 * render, and closes it once the render has produced the response. The scope is also left on the
 * event's `locals` under `LANGSYS_SCOPE`, for the app's own server code.
 */

/** The request event SolidStart hands its middleware and render, as far as this module reads it. */
export interface LangsysRequestEvent {
    request: Request;
    locals: Record<string, unknown>;
}

export interface LangsysMiddlewareOptions {
    /**
     * The request's locale, as the framework or the app already resolved it (SRV-6). Return
     * nothing to render the request outside any scope.
     */
    locale(event: LangsysRequestEvent): string | undefined | Promise<string | undefined>;
}

/** The key the request's scope is left under on `event.locals`. */
export const LANGSYS_SCOPE = 'langsysScope';

let storageInstalled = false;

/**
 * An h3 middleware for SolidStart's `createMiddleware([...])`:
 *
 * ```ts
 * // src/middleware.ts
 * import { createMiddleware } from '@solidjs/start/middleware';
 * import { langsysMiddleware } from 'langsys-js-solid/start';
 *
 * export default createMiddleware([langsysMiddleware({ locale: (event) => resolveLocale(event.request) })]);
 * ```
 *
 * Every `useT()`, top-level `t()` and `LangsysApp.t` the page renders reads the request's scope.
 * Put `<LangsysSeed />` in the document's `<head>` so the client seeds before it hydrates.
 */
export function langsysMiddleware(
    options: LangsysMiddlewareOptions
): (event: unknown, next: () => unknown) => Promise<unknown> {
    if (!storageInstalled) {
        setRequestScopeStorage(new AsyncLocalStorage());
        storageInstalled = true;
    }
    return async (_h3Event, next) => {
        const event = getRequestEvent() as LangsysRequestEvent | undefined;
        if (!event) return next();
        const locale = await options.locale(event);
        if (!locale) return next();

        const scope = await createRequestScope({ locale, url: event.request.url });
        event.locals[LANGSYS_SCOPE] = scope;
        let response: unknown;
        try {
            response = await scope.run(() => next());
        } catch (error) {
            void scope.close();
            throw error;
        }
        return closeAfterBody(response, scope);
    };
}

/**
 * Close the scope once the response body has been sent (SRV-3). A streamed page keeps rendering
 * after `next()` resolves, so closing then would stop recording misses the stream has yet to
 * render. Registration is never awaited on the request path.
 */
function closeAfterBody(response: unknown, scope: RequestScope): unknown {
    if (!(response instanceof Response) || !response.body) {
        void scope.close();
        return response;
    }
    const body = response.body.pipeThrough(
        new TransformStream<Uint8Array, Uint8Array>({
            flush() {
                void scope.close();
            },
        })
    );
    return new Response(body, response);
}

/** The request scope SolidStart's current request renders in, if the middleware opened one. */
export function requestScope(
    event: LangsysRequestEvent | undefined = getRequestEvent() as never
): RequestScope | undefined {
    return event?.locals[LANGSYS_SCOPE] as RequestScope | undefined;
}
