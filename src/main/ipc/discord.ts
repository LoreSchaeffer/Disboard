import {ipcMain} from "electron";
import {state} from "../state";

export const setupDiscordBridgeHandlers = () => {
    ipcMain.on('discord_stream_packet', (_, buffer: ArrayBuffer) => {
        const nodeBuffer = Buffer.from(buffer);
        state.discordBot.writeAudioPacket(nodeBuffer);
    });

    ipcMain.handle('discord_status', () => {
        return state.discordBot.getStatus();
    });

    ipcMain.handle('discord_guilds', () => {
        return state.discordBot.getGuilds();
    });

    ipcMain.handle('discord_channels', (_, guildId: string) => {
        return state.discordBot.getChannels(guildId);
    });
}