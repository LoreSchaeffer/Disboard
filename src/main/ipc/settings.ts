import {ipcMain} from "electron";
import {DeepPartial, Settings} from "../../types";
import {state} from "../state";
import {settingsStore} from "../storage/settings-store";
import {deepMerge} from "../utils/objects";
import {broadcastData} from "../utils/broadcast";

export const setupSettingsHandlers = () => {
    ipcMain.handle('settings:get', (): Settings => {
        return settingsStore.store;
    });

    ipcMain.on('settings:set', (_, settings: DeepPartial<Settings>) => {
        const oldSettings = settingsStore.store;
        const newSettings = deepMerge(oldSettings, settings);
        settingsStore.set(newSettings);
        broadcastData('settings:changed', settingsStore.store);
        if (state.discordBot) state.discordBot.onSettingsUpdate(oldSettings, newSettings);
    });
}