import {ipcMain} from "electron";
import {Settings} from "../../types/settings";
import {broadcastSettings} from "../utils";
import {settingsStore} from "../utils/store";
import {state} from "../state";

export const setupSettingsHandlers = () => {
    ipcMain.handle('get_settings', (): Settings => {
        return settingsStore.store;
    });

    ipcMain.on('update_settings', (_, settings: Partial<Settings>) => {
        const currentSettings = settingsStore.store;
        const newSettings = {...currentSettings, ...settings};
        settingsStore.set(newSettings);
        broadcastSettings(newSettings);

        if (state.discordBot) {
            const currentDiscordSettings = currentSettings.discord;
            const newDiscordSettings = newSettings.discord;

            if (currentDiscordSettings.enabled !== newDiscordSettings.enabled) {
                if (newDiscordSettings.enabled) state.discordBot.init();
                else state.discordBot.disconnect();
            }

            if (currentDiscordSettings.token !== newDiscordSettings.token) {
                console.log('[Main] Discord token changed, restarting bot...');
                state.discordBot.disconnect();

                if (newDiscordSettings.token && newDiscordSettings.token.length > 1) {
                    state.discordBot.init();
                    return;
                }
            }

            if (newDiscordSettings.enabled && state.discordBot.getStatus().ready) {
                const guildChanged = currentDiscordSettings.lastGuild !== newDiscordSettings.lastGuild;
                const channelChanged = currentDiscordSettings.lastChannel !== newDiscordSettings.lastChannel;

                if (guildChanged || channelChanged) {
                    console.log('[Main] Discord guild/channel changed, switching...');
                    if (newDiscordSettings.lastGuild && newDiscordSettings.lastChannel) {
                        state.discordBot.joinChannel(newDiscordSettings.lastGuild, newDiscordSettings.lastChannel);
                    }
                }
            }
        }
    });
}