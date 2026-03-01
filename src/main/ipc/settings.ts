import {ipcMain} from "electron";
import {Settings} from "../../types/settings";
import {state} from "../state";
import {broadcastSettings} from "../utils/broadcast";
import {deepMerge} from "../utils/misc";

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
        broadcastSettings(newSettings);
        handleSettingsChange(oldSettings, newSettings);
    });
}