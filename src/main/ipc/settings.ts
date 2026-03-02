import {ipcMain} from "electron";
import {Settings} from "../../types";
import {state} from "../state";
import {settingsStore} from "../storage/settings-store";
import {deepMerge} from "../utils/objects";
import {broadcastData} from "../utils/broadcast";

const handleSettingsChange = (oldSettings: Settings, newSettings: Settings) => {
    if (state.discordBot) {
        const currentDiscordSettings = oldSettings.discord;
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
}


export const setupSettingsHandlers = () => {
    ipcMain.handle('settings:get', (): Settings => {
        return settingsStore.store;
    });

    ipcMain.on('settings:set', (_, settings: Partial<Settings>) => {
        const oldSettings = settingsStore.store;
        const newSettings = deepMerge(oldSettings, settings);
        settingsStore.set(newSettings);
        broadcastData('settings:changed', settingsStore.store);
        handleSettingsChange(oldSettings, newSettings);
    });
}