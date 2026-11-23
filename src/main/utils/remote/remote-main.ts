import {RemoteEvent} from "../../../types";
import {IncomingMessage, ServerResponse} from "node:http";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RemoteHandler = (event: RemoteEvent, ...args: any[]) => any | Promise<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RemoteListener = (event: RemoteEvent, ...args: any[]) => void | Promise<void>;

export type RemoteHttpHandler = (
    req: IncomingMessage,
    res: ServerResponse,
    resourcePath: string,
    parsedUrl: URL
) => void | Promise<void>;

class RemoteMainRegistry {
    private handlers = new Map<string, RemoteHandler>();
    private listeners = new Map<string, RemoteListener>();
    private httpHandlers = new Map<string, RemoteHttpHandler>();

    public handle(channel: string, listener: RemoteHandler) {
        if (this.handlers.has(channel)) {
            console.error(`[RemoteMain] Handle for ${channel} is already registered.`);
            return;
        }

        this.handlers.set(channel, listener);
    }

    public handleHttp(routePrefix: string, handler: RemoteHttpHandler) {
        if (this.httpHandlers.has(routePrefix)) {
            console.error(`[RemoteMain] HTTP Handle for ${routePrefix} is already registered.`);
            return;
        }
        this.httpHandlers.set(routePrefix, handler);
    }

    public on(channel: string, listener: RemoteListener) {
        if (this.listeners.has(channel)) {
            console.error(`[RemoteMain] Listener for ${channel} is already registered.`);
            return;
        }

        this.listeners.set(channel, listener);
    }

    public getHandler(channel: string) {
        return this.handlers.get(channel);
    }

    public getListener(channel: string) {
        return this.listeners.get(channel);
    }

    public getHttpHandler(resourcePath: string): { handler: RemoteHttpHandler, subPath: string } | null {
        for (const [route, handler] of this.httpHandlers.entries()) {
            if (resourcePath.startsWith(route)) {
                const subPath = resourcePath.slice(route.length);
                return {handler, subPath};
            }
        }
        return null;
    }
}

export const remoteMain = new RemoteMainRegistry();