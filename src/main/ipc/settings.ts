import {ipcMain} from "electron";
import {Settings} from "../../types/settings";
import {broadcastSettings} from "../utils";
import {settingsStore} from "../utils/store";

export const setupSettingsHandlers = () => {
    ipcMain.handle('get_settings', (): Settings => {
        return settingsStore.store;
    });

    ipcMain.on('update_settings', (_, settings: Partial<Settings>) => {
        const currentSettings = settingsStore.store;
        const newSettings = {...currentSettings, ...settings};
        settingsStore.set(newSettings);

        broadcastSettings(newSettings);
    });
}