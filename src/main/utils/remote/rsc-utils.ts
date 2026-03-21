import {WebSocket} from "ws";
import {RemoteMessage} from "../../../types";

export const sendMessage = (ws: WebSocket, msg: RemoteMessage) => {
    ws.send(JSON.stringify(msg));
}

export const sendError = (ws: WebSocket, error: string) => {
    sendMessage(ws, {op: 'Error', error});
}