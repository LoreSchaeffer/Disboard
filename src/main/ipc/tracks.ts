import {ipcMain} from "electron";
import {IpcResponse, PlayerTrack, Track, TrackSourceName, YTSearchResult} from "../../types";
import {tracksStore} from "../storage/tracks-store";
import {createPlayerTrack} from "../utils/data-converters";
import fs from "node:fs/promises";
import path from "path";
import {THUMBNAILS_DIR, TRACKS_DIR} from "../constants";
import {removeTrackFromStore} from "../utils/downloads";

export const setupTracksHandlers = () => {
    ipcMain.handle('tracks:get_all', (): Track[] => tracksStore.get('tracks'));

    ipcMain.handle('tracks:get', (_, trackId: string): Track | null => {
        const tracks = tracksStore.get('tracks');
        return tracks.find(t => t.id === trackId) || null;
    });

    ipcMain.handle('tracks:get_volatile', async (_, source: TrackSourceName, media: YTSearchResult | string): Promise<IpcResponse<PlayerTrack>> => {
        if (!source || !media) return {success: false, error: 'invalid_parameters'};
        if (source === 'youtube' && (typeof media !== 'object' || !('id' in media))) return {success: false, error: 'invalid_parameters'};
        if (source !== 'youtube' && (typeof media !== 'string' || (media as string).trim().length < 2)) return {success: false, error: 'invalid_parameters'};

        const track = await createPlayerTrack(source, media);
        if (!track) return {success: false, error: 'track_not_found'};
        return {success: true, data: track};
    });

    ipcMain.handle('tracks:delete', async (_, id: string): Promise<IpcResponse<void>> => {
        const res = removeTrackFromStore(id);
        if (!res) {
            console.warn(`[Main] Attempted to delete non-existent track with id ${id}`);
            return {success: false};
        }

        await fs.unlink(path.join(TRACKS_DIR, `${id}.mp3`)).catch(() => {
        });
        await fs.unlink(path.join(THUMBNAILS_DIR, `${id}.jpg`)).catch(() => {
        });

        return {success: true};
    });
};