import {ipcMain} from "electron";
import {TrackSource} from "../../types/data";
import {YTSearchResult} from "../../types/music-api";
import {getPlayerTrack} from "../utils/misc";
import {state} from "../state";

export const setupPlayerHandlers = () => {
    ipcMain.on('player:play_now', async (_, source: TrackSource, media: YTSearchResult | string, customTitle: string) => {
        if (!source || !media) return;
        if (source === 'youtube' && (typeof media !== 'object' || !('id' in media))) return;
        if (source !== 'youtube' && (typeof media !== 'string' || (media as string).trim().length < 2)) return;

        const track = await getPlayerTrack(source, media);
        if (!track) return;
        track.titleOverride = customTitle !== '' ? customTitle : undefined;
        state.mainWindow.webContents.send('player:play_now', track);
    });
}