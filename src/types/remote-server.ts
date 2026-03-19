import {WebSocket} from "ws";

export type RemoteMessage = {
    op: string;
    username?: string;
    password?: string;
    [key: string]: unknown
}

export type RemoteCommand = {
    op: string;
    handler: (ws: WebSocket, msg: RemoteMessage) => void;
}