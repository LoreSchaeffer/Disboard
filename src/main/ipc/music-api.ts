import {ipcMain} from "electron";
import {state} from "../state";
import {getVideoId} from "../utils/music-api";
import {IpcResponse, MATrack, Playlist, PlaylistTrack, YTSearchResult} from "../../types";

export const setupMusicApiHandlers = () => {
    ipcMain.handle('musicapi:use_api', (): boolean => {
        const musicApi = state.musicApi;
        return !(!musicApi || !musicApi.isAuthenticated());
    });

    ipcMain.handle('musicapi:search', async (_, query: string): Promise<IpcResponse<YTSearchResult[]>> => {
        const musicApi = state.musicApi;

        try {
            if (!musicApi) throw new Error('not_initialized');
            if (!musicApi.isAuthenticated()) throw new Error('not_authenticated');

            const results = (await musicApi.search(query))
                .map(res => {
                    return {
                        ...res,
                        id: getVideoId(res.url)
                    }
                });
            return {success: true, data: results};
        } catch (e) {
            return {success: false, error: e.message || 'unknown_error'};
        }
    });

    ipcMain.handle('musicapi:get_playlists', async (): Promise<IpcResponse<Playlist[]>> => {
        const musicApi = state.musicApi;

        try {
            if (!musicApi) throw new Error('not_initialized');
            if (!musicApi.isAuthenticated()) throw new Error('not_authenticated');

            const results = await musicApi.getPlaylists();
            return {success: true, data: results};
        } catch (e) {
            return {success: false, error: e.message || 'unknown_error'};
        }
    });

    ipcMain.handle('musicapi:get_playlist_tracks', async (_, playlistId: string): Promise<IpcResponse<PlaylistTrack[]>> => {
        const musicApi = state.musicApi;

        try {
            if (!musicApi) throw new Error('not_initialized');
            if (!musicApi.isAuthenticated()) throw new Error('not_authenticated');

            const results = await musicApi.getPlaylistTracks(playlistId);
            return {success: true, data: results};
        } catch (e) {
            return {success: false, error: e.message || 'unknown_error'};
        }
    });

    ipcMain.handle('musicapi:get_tracks', async (_, size?: number, sort?: string, direction?: 'asc' | 'desc'): Promise<IpcResponse<MATrack[]>> => {
        const musicApi = state.musicApi;

        try {
            if (!musicApi) throw new Error('not_initialized');
            if (!musicApi.isAuthenticated()) throw new Error('not_authenticated');

            const results = await musicApi.getTracks(size, sort, direction);
            return {success: true, data: results};
        } catch (e) {
            return {success: false, error: e.message || 'unknown_error'};
        }
    });
}