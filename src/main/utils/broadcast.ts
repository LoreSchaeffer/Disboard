import {BrowserWindow} from "electron";
import {BoardType, PlayerTrack, SbAmbientProfile, SbGridProfile, Settings, Track} from "../../types";
import {state} from "../state";

export type BroadcastChannelMap = {
    'settings:changed': [settings: Settings],

    'grid_profiles:music:changed': [profiles: SbGridProfile[]],
    'grid_profiles:sfx:changed': [profiles: SbGridProfile[]],
    'ambient_profiles:changed': [profiles: SbAmbientProfile[]],

    'tracks:changed': [tracks: Track[]],

    'player:preview_stopped': [],
    'player:on_play_now': [boardType: Exclude<BoardType, 'ambient'>, track: PlayerTrack],
    'player:on_play_button': [buttonId: string],
    'player:on_stop_sfx': [buttonId: string],
    'player:on_play': [],
    'player:on_pause': [],
    'player:on_stop': [],
    'player:on_next': [],
    'player:on_previous': [],
}

export const broadcastData = <K extends keyof BroadcastChannelMap>(
    channel: K,
    ...args: BroadcastChannelMap[K]
) => {
    BrowserWindow.getAllWindows().forEach(win => {
        if (!win.isDestroyed()) win.webContents.send(channel, ...args);
    });

    if (state.remoteServer) state.remoteServer.broadcast(channel, ...args);
}