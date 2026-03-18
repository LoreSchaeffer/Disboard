import {WebSocket} from "ws";
import {BoardType} from "../../types";
import {RemoteMessage} from "./remote-server";

export const sendMessage = (ws: WebSocket, msg: RemoteMessage) => {
    ws.send(JSON.stringify(msg));
}

export const sendError = (ws: WebSocket, error: string) => {
    sendMessage(ws, {op: 'Error', error});
}

export const sendCommandAck = (ws: WebSocket, command: string, success: boolean, info?: string) => {
    sendMessage(ws, {op: 'CommandAck', command: command, success: success, info: info});
}

export const getBoardType = (ws: WebSocket, msg: RemoteMessage): BoardType | null => {
    const boardType: BoardType = msg.boardType as BoardType;

    if (!boardType) {
        sendError(ws, 'Missing field "boardType"');
        return null;
    }

    if (boardType !== 'music' && boardType !== 'sfx' && boardType !== 'ambient') {
        sendError(ws, 'Invalid boardType. Expected "music", "sfx", or "ambient".');
        return null;
    }

    return boardType;
}