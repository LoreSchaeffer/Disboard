import {ipcMain} from "electron";
import {state} from "../state";

export const setupRemoteServerHandlers = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ipcMain.on('remote-server:broadcast', (_, channel: string, ...args: any[]) => {
        if (!state.remoteServer) return;
        state.remoteServer.broadcast(channel, ...args);
    });
}