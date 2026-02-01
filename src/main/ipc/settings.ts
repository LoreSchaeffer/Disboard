import {ipcMain} from "electron";
import {Settings} from "../../types/settings";
import {broadcastSettings} from "../utils";
import {settingsStore} from "../utils/store";
import {state} from "../state";
import {initDiscord} from "../components/discord-bridge";

export const setupSettingsHandlers = () => {
    ipcMain.handle('get_settings', (): Settings => {
        return settingsStore.store;
    });

    ipcMain.on('update_settings', (_, settings: Partial<Settings>) => {
        const currentSettings = settingsStore.store;
        const newSettings = {...currentSettings, ...settings};
        settingsStore.set(newSettings);

        if (state.discordBridge) {
            if (currentSettings.discord.restPort !== newSettings.discord.restPort) state.discordBridge.updateRestPort(newSettings.discord.restPort);
            if (currentSettings.discord.udpPort !== newSettings.discord.udpPort) state.discordBridge.updateUdpPort(newSettings.discord.udpPort);

            if (currentSettings.discord.enabled !== newSettings.discord.enabled) {
                if (newSettings.discord.enabled) {
                    initDiscord();
                } else {
                    state.discordBridge.disconnect().then(() => {
                        state.discordBridge.stop();
                    });
                }
            }

            if (currentSettings.discord.token !== newSettings.discord.token) {
                state.discordBridge.disconnect().then(() => {
                    state.discordBridge.connect(newSettings.discord.token || '');
                });
            }
        }

        broadcastSettings(newSettings);
    });
}