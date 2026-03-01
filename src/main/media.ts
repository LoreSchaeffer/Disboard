import {state} from "./state";
import {globalShortcut} from "electron";

export const registerMediaShortcuts = () => {
    if (!state.mainWindow) return;
    const mainWindow = state.mainWindow;

    const shortcuts = [
        {key: 'MediaPlayPause', channel: 'player:play_pause'},
        {key: 'MediaNextTrack', channel: 'player:next'},
        {key: 'MediaPreviousTrack', channel: 'player:prev'},
        {key: 'MediaStop', channel: 'player:stop'}
    ];

    shortcuts.forEach(({key, channel}) => {
        const success = globalShortcut.register(key, () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send(channel);
            }
        });

        if (!success) console.warn(`[Main] Registration of shortcut ${key} failed.`);
    });
}