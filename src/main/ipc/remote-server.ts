import {ipcMain} from "electron";
import {state} from "../state";
import {RemoteMessage} from "../../types";

export const setupRemoteServerHandlers = () => {
    ipcMain.on('remote-server:broadcast', (_, payload: RemoteMessage) => {
        if (!state.remoteServer) return;
        state.remoteServer.broadcast(payload);
    });
}