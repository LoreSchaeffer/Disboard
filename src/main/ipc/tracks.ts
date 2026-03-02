import {ipcMain} from "electron";
import {BoardType, GridProfiles, IpcResponse, PlayerTrack, Track, TrackSourceName, YTSearchResult} from "../../types";
import {tracksStore} from "../storage/tracks-store";
import {broadcastData} from "../utils/broadcast";
import {musicBoardStore, sfxBoardStore} from "../storage/profiles-store";
import Store from "electron-store";
import {convertGridProfile2SbGridProfile, createPlayerTrack} from "../utils/data-converters";
import fs from "node:fs/promises";
import path from "path";
import {THUMBNAILS_DIR, TRACKS_DIR} from "../constants";

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
        const tracks = tracksStore.get('tracks');
        const trackIndex = tracks.findIndex(t => t.id === id);
        if (trackIndex === -1) return {success: false, error: 'track_not_found'};

        tracks.splice(trackIndex, 1);
        tracksStore.set('tracks', tracks);
        broadcastData('tracks:changed', tracks);

        await fs.unlink(path.join(TRACKS_DIR, `${id}.mp3`)).catch(() => {
        });
        await fs.unlink(path.join(THUMBNAILS_DIR, `${id}.jpg`)).catch(() => {
        });

        const removeButtonsContainingTrack = (boardType: Exclude<BoardType, 'ambient'>, profilesStore: Store<GridProfiles>) => {
            const profiles = profilesStore.get('profiles');
            let profilesChanged = false;

            for (const profile of profiles) {
                const initialLength = profile.buttons.length;
                profile.buttons = profile.buttons.filter(btn => btn.track !== id);
                if (profile.buttons.length !== initialLength) profilesChanged = true;
            }

            if (profilesChanged) {
                profilesStore.set('profiles', profiles);
                broadcastData(`grid_profiles:${boardType}:changed`, profiles.map(convertGridProfile2SbGridProfile));
            }
        }

        removeButtonsContainingTrack('music', musicBoardStore);
        removeButtonsContainingTrack('sfx', sfxBoardStore);

        return {success: true};
    });
};