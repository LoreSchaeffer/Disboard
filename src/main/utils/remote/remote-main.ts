import {RemoteEvent} from "../../../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RemoteHandler = (event: RemoteEvent, ...args: any[]) => any | Promise<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RemoteListener = (event: RemoteEvent, ...args: any[]) => void | Promise<void>;

class RemoteMainRegistry {
    private handlers = new Map<string, RemoteHandler>();
    private listeners = new Map<string, RemoteListener>();

    public handle(channel: string, listener: RemoteHandler) {
        if (this.handlers.has(channel)) {
            console.error(`[RemoteMain] Handle for ${channel} is already registered.`);
            return;
        }

        this.handlers.set(channel, listener);
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
}

export const remoteMain = new RemoteMainRegistry();