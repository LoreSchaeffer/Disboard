import {BrowserWindow} from "electron";
import {SbAmbientProfile, SbGridProfile, Settings, Track} from "../../types";

export type BroadcastChannelMap = {
    'settings:changed': Settings,

    'grid_profiles:music:changed': SbGridProfile[],
    'grid_profiles:sfx:changed': SbGridProfile[],
    'ambient_profiles:changed': SbAmbientProfile[],

    'tracks:changed': Track[],
}

export const broadcastData = <K extends keyof BroadcastChannelMap>(
    channel: K,
    ...args: BroadcastChannelMap[K] extends void ? [] : [data: BroadcastChannelMap[K]]
) => {
    const data = args[0];

    BrowserWindow.getAllWindows().forEach(win => {
        if (!win.isDestroyed()) win.webContents.send(channel, data);
    });
}