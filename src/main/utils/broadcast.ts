import {BrowserWindow} from "electron";
import {BoardType, PlayerTrack, SbAmbientProfile, SbGridProfile, Settings, Track} from "../../types";

export type BroadcastChannelMap = {
    'settings:changed': [settings: Settings],

    'grid_profiles:music:changed': [profiles: SbGridProfile[]],
    'grid_profiles:sfx:changed': [profiles: SbGridProfile[]],
    'ambient_profiles:changed': [profiles: SbAmbientProfile[]],

    'tracks:changed': [tracks: Track[]],

    'player:preview_stopped': [],
    'player:on_play_now': [boardType: Exclude<BoardType, 'ambient'>, track: PlayerTrack],
}

export const broadcastData = <K extends keyof BroadcastChannelMap>(
    channel: K,
    ...args: BroadcastChannelMap[K]
) => {
    BrowserWindow.getAllWindows().forEach(win => {
        if (!win.isDestroyed()) {
            win.webContents.send(channel, ...args);
        }
    });
}