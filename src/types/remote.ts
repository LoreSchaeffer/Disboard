import {WebSocket} from "ws";

export type RemoteMessage = {
    op: string;
    nonce?: string | number;
    success?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any;
    error?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args?: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
};

export type RemoteWebSocket = WebSocket & {
    isAuthenticated: boolean;
    authTimeout?: NodeJS.Timeout;
    authToken?: string;
}

export type RemoteEvent = {
    ws: RemoteWebSocket;
    nonce?: string | number;
    reply: (op: string, data?: Record<string, unknown>) => void;
}