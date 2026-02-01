import {ipcMain} from "electron";
import {state} from "../state";
import {settingsStore} from "../utils/store";
import {DiscordStatus} from "../../types/common";
import {DiscordData} from "../../types/discord";

export const setupDiscordBridgeHandlers = () => {

    ipcMain.handle('ds_status', async (): Promise<DiscordStatus> => {
        if (!state.discordBridge) return 'stopped';
        if (!await state.discordBridge.ping()) return 'stopped';
        if (!await state.discordBridge.getStatus()) return 'offline';

        const guild = settingsStore.get('discord.lastGuild');
        if (guild && await state.discordBridge.getVoiceStatus(guild)) return 'connected';
        return 'offline';
    });

    ipcMain.handle('ds_guilds', async (): Promise<DiscordData[]> => {
        if (!state.discordBridge) return [];
        return state.discordBridge.getGuilds();
    });

    ipcMain.handle('ds_channels', async (_, guildId: string): Promise<DiscordData[]> => {
        if (!state.discordBridge) return [];
        return state.discordBridge.getVoiceChannels(guildId);
    });
}