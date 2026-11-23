import {ipcMain} from "electron";
import {broadcastData} from "../utils/broadcast";
import {BoardType, IpcResponse, MATrack, PlayerTrack, TrackSourceName, YTSearchResult} from "../../types";
import {createPlayerTrack} from "../utils/data-converters";
import {state} from "../state";

export const setupPlayerHandlers = () => {
    ipcMain.on('player:stop_preview', () => {
        broadcastData('player:preview_stopped');
    });

    ipcMain.handle('player:play_now', async (_, boardType: Exclude<BoardType, 'ambient'>, source: TrackSourceName, media: YTSearchResult | string | MATrack, customTitle?: string): Promise<IpcResponse<void>> => {
        if (!boardType || !source || !media) return {success: false, error: 'invalid_parameters'};
        if (source === 'youtube' && (typeof media !== 'object' || !('id' in media))) return {success: false, error: 'invalid_parameters'};
        if (source !== 'youtube' && source !== 'music_api' && (typeof media !== 'string' || (media as string).trim().length < 2)) return {success: false, error: 'invalid_parameters'};

        const track = await createPlayerTrack(source, media, customTitle);
        if (!track) return {success: false, error: 'track_not_found'};

        broadcastData('player:on_play_now', boardType, track);

        return {success: true};
    });

    ipcMain.on('player:update_current_track', (_, track: PlayerTrack) => {
        state.currentMusicTrack = track;
    });
}