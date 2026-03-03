import {app, dialog, ipcMain, shell} from "electron";
import path from "path";
import {IpcResponse, MediaType} from "../../types";
import {ALL_MEDIA_FILES, AUDIO_FILES, VIDEO_FILES} from "../constants";
import {cacheStore} from "../storage/cache-store";

export const setupSystemHandlers = () => {
    ipcMain.on('system:open_link', async (_, url: string) => shell.openExternal(url));

    ipcMain.handle('system:open_file_media_selector', async (_, mediaType?: MediaType): Promise<IpcResponse<string>> => {
        if (!mediaType) mediaType = 'audio';

        let filters;
        if (mediaType === 'audio') {
            filters = [
                {
                    name: 'All Media Files',
                    extensions: ALL_MEDIA_FILES
                },
                {
                    name: 'Audio Only',
                    extensions: AUDIO_FILES
                },
                {
                    name: 'Video Only',
                    extensions: VIDEO_FILES
                }
            ];
        } else {
            filters = [
                {
                    name: 'Images',
                    extensions: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'tiff']
                }
            ];
        }

        const {canceled, filePaths} = await dialog.showOpenDialog({
            title: mediaType === 'audio' ? 'Select Audio File' : 'Select Image File',
            defaultPath: cacheStore.get('audioDir') || app.getPath('documents'),
            properties: ['openFile'],
            filters: filters
        });

        if (canceled || !filePaths || filePaths.length === 0) return {success: false, error: 'canceled'};
        const filePath = filePaths[0];
        cacheStore.set('audioDir', path.dirname(filePath));
        return {success: true, data: filePath};
    });
}