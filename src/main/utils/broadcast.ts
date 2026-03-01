import {BrowserWindow} from "electron";
import {SbGridProfile, Settings, Track} from "../../types";

export type BroadcastChannelMap = {
    'settings:change': Settings,
    'profiles:change': SbGridProfile[],
    'tracks:change': Track[],

    'player:play_now': Track,
    'player:pause': void,
    'player:play': void,
    'player:play_pause': void,
    'player:stop': void,
    'player:next': void,
    'player:prev': void
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