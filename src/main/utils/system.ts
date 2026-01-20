import {app, dialog, ipcMain, shell} from "electron";
import {IpcResponse} from "../../types/common";
import {cacheStore} from "./store";
import path from "path";

export const setupSystemHandlers = () => {
    ipcMain.on('open_link', async (_, url: string) => shell.openExternal(url));

    ipcMain.handle('open_file_media_selector', async (): Promise<IpcResponse<string>> => {
        const {canceled, filePaths} = await dialog.showOpenDialog({
            title: 'Select Audio File',
            defaultPath: cacheStore.get('audioDir') || app.getPath('documents'),
            properties: ['openFile'],
            filters: [
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
            ]
        });

        if (canceled || !filePaths || filePaths.length === 0) return {success: false, error: 'canceled'};
        const filePath = filePaths[0];
        cacheStore.set('audioDir', path.dirname(filePath));
        return {success: true, data: filePath};
    });
}