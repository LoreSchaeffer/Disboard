import {ipcMain} from "electron";
import {state} from "../state";
import {getVideoId} from "../utils/music-api";
import {IpcResponse, YTSearchResult} from "../../types";

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
}