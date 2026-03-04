import {ipcMain} from "electron";
import {state} from "../state";

export const setupDiscordBridgeHandlers = () => {
    ipcMain.on('discord:audio_packet', (_, playerId: string, buffer: ArrayBuffer) => {
        const nodeBuffer = Buffer.from(buffer);
        state.discordBot.writeAudioPacket(playerId, nodeBuffer);
    });

    ipcMain.handle('discord:status', () => {
        return state.discordBot.getStatus();
    });

    ipcMain.handle('discord:guilds', () => {
        return state.discordBot.getGuilds();
    });

    ipcMain.handle('discord:channels', (_, guildId: string) => {
        return state.discordBot.getChannels(guildId);
    });
}