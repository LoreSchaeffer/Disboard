import {BrowserWindow, ipcMain} from "electron";
import {DeepPartial, Settings} from "../../types";
import {state} from "../state";
import {settingsStore} from "../storage/settings-store";
import {deepMerge} from "../utils/objects";
import {broadcastData} from "../utils/broadcast";

const onSettingsChange = (oldSettings: Settings, newSettings: Settings) => {
    if (state.discordBot) state.discordBot.onSettingsUpdate(oldSettings, newSettings);
    if (state.remoteServer) state.remoteServer.onSettingsUpdate(oldSettings, newSettings);

    if (oldSettings.debug !== newSettings.debug) {
        const allWindows = BrowserWindow.getAllWindows();
        if (newSettings.debug) allWindows.forEach(win => win.webContents.openDevTools({mode: 'detach'}));
        else allWindows.forEach(win => win.webContents.closeDevTools());
    }
}

export const setupSettingsHandlers = () => {
    ipcMain.handle('settings:get', (): Settings => {
        return settingsStore.store;
    });

    ipcMain.on('settings:set', (_, settings: DeepPartial<Settings>) => {
        const oldSettings = settingsStore.store;
        const newSettings = deepMerge(oldSettings, settings);
        settingsStore.set(newSettings);
        broadcastData('settings:changed', settingsStore.store);
        onSettingsChange(oldSettings, newSettings);
    });
}