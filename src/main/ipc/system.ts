import {app, dialog, ipcMain, shell} from "electron";
import path from "path";
import {cacheStore} from "../utils/store";
import {IpcResponse, MediaType} from "../../types/common";

export const setupSystemHandlers = () => {
    ipcMain.on('open_link', async (_, url: string) => shell.openExternal(url));

    ipcMain.handle('open_file_media_selector', async (_, mediaType?: MediaType): Promise<IpcResponse<string>> => {
        if (!mediaType) mediaType = 'audio';

        let filters;
        if (mediaType === 'audio') {
            filters = [
                {
                    name: 'All Media Files',
                    extensions: [
                        'mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac',
                        'mp4', 'webm', 'mkv', 'avi', 'mov', 'wmv'
                    ]
                },
                {
                    name: 'Audio Only',
                    extensions: ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac']
                },
                {
                    name: 'Video Only',
                    extensions: ['mp4', 'webm', 'mkv', 'avi', 'mov', 'wmv']
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