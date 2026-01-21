import {ipcMain} from "electron";
import {state} from "../state";
import {IpcResponse} from "../../types/common";
import {YTSearchResult} from "../../types/music-api";
import {getVideoId} from "../utils/music-api";
import {getYoutubeStream} from "../utils";

export const setupMusicApiHandlers = () => {

    ipcMain.handle('use_music_api', (): boolean => {
        const musicApi = state.musicApi;
        return !(!musicApi || !musicApi.isAuthenticated());
    });

    ipcMain.handle('search_music', async (_, query: string): Promise<IpcResponse<YTSearchResult[]>> => {
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

    ipcMain.handle('get_video_stream', async (_, videoId: string): Promise<IpcResponse<string>> => {
        try {
            const result = await getYoutubeStream(videoId);
            if (!result) throw new Error('stream_not_found');

            return {success: true, data: result};
        } catch (e) {
            return {success: false, error: e.message || 'unknown_error'};
        }
    });
}