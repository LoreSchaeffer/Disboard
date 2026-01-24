import {Client, GatewayIntentBits} from 'discord.js';
import {getVoiceConnection, joinVoiceChannel, VoiceConnectionStatus} from '@discordjs/voice';
import {DiscordStreamManager} from "./stream-handler";
import {settingsStore} from "../utils/store";
import {DiscordSettings} from "../../types/settings";

export class DiscordBotController {
    private client: Client;
    private streamManager: DiscordStreamManager;
    private isReady: boolean = false;

    constructor(streamManager: DiscordStreamManager) {
        this.streamManager = streamManager;

        this._createClient();

        this.setupClientEvents();
        //this.setupIpc();
    }

    private _createClient() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildVoiceStates
            ]
        });
    }

    private setupClientEvents() {
        this.client.on('clientReady', () => {
            console.log(`[Discord] Logged in as ${this.client.user?.tag}`);
            this.isReady = true;
            //this.sendUpdateToRenderer('status', {status: 'ready', user: this.client.user?.tag});
        });

        this.client.on('error', (err) => {
            console.error('[Discord] Client Error:', err);
            //this.sendUpdateToRenderer('error', err.message);
        });
    }

    public async login() {
        const settings: DiscordSettings = settingsStore.get('discord');
        const token = settings?.token;

        if (!token) {
            console.warn('[Discord] No token provided for login');
            return false;
        }

        try {
            await this.client.login(token);
            return true;
        } catch (error) {
            console.error('[Discord] Login failed:', error);
            return false;
        }
    }

    public async logout() {
        this.disconnectVoice();
        await this.client.destroy();
        this.isReady = false;
        this._createClient();
        this.setupClientEvents();
        console.log('[Discord] Logout completed');
    }


    public async joinChannel(guildId: string, channelId: string) {
        if (!this.isReady) return {success: false, error: 'bot_not_connected'};

        try {
            const guild = await this.client.guilds.fetch(guildId);
            const channel = await guild.channels.fetch(channelId);

            if (!channel || !channel.isVoiceBased()) {
                throw new Error("invalid_channel");
            }

            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: guild.id,
                adapterCreator: guild.voiceAdapterCreator,
                selfDeaf: false,
                selfMute: false
            });

            const subscription = connection.subscribe(this.streamManager.getPlayer());

            connection.on(VoiceConnectionStatus.Ready, () => {
                console.log(`[Discord] Connected to voice channel: ${channel.name}`);
                //this.sendUpdateToRenderer('voice_status', {connected: true, channel: channel.name});
            });

            connection.on(VoiceConnectionStatus.Disconnected, () => {
                console.log('[Discord] Disconnected from voice channel');
                //this.sendUpdateToRenderer('voice_status', {connected: false});
                subscription?.unsubscribe();
            });

            return {success: true};

        } catch (error) {
            console.error('[Discord] Connection error:', error);
            return {success: false, error: error instanceof Error ? error.message : 'Unknown error'};
        }
    }

    public async joinDefaultChannel() {
        const guildId = settingsStore.get('discord.defaultGuild');
        const channelId = settingsStore.get('discord.defaultChannel');

        if (!guildId || !channelId) throw new Error('Default guild or channel not set in settings');

        return await this.joinChannel(guildId, channelId);
    }

    public disconnectVoice() {
        const guilds = this.client.guilds.cache;
        guilds.forEach(guild => {
            const connection = getVoiceConnection(guild.id);
            if (connection) connection.destroy();
        });
    }

    public async shutdown() {
        console.log('[Discord] Shutdown initiated...');

        this.disconnectVoice();
        if (this.client) await this.client.destroy();

        this.isReady = false;
        console.log('[Discord] Shutdown complete. Bye!');
    }

    // private setupIpc() {
    //     // Login manuale
    //     ipcMain.handle('discord_login', async (_, token?: string) => {
    //         return await this.login(token);
    //     });
    //
    //     // Logout
    //     ipcMain.handle('discord_logout', async () => {
    //         await this.logout();
    //     });
    //
    //     // Ottieni lista server (Guilds)
    //     ipcMain.handle('discord_get_guilds', () => {
    //         if (!this.isReady) return [];
    //         return this.client.guilds.cache.map(g => ({id: g.id, name: g.name, icon: g.iconURL()}));
    //     });
    //
    //     // Ottieni canali vocali di un server
    //     ipcMain.handle('discord_get_channels', async (_, guildId: string) => {
    //         if (!this.isReady) return [];
    //         const guild = this.client.guilds.cache.get(guildId);
    //         if (!guild) return [];
    //
    //         // Forziamo il fetch per avere dati aggiornati
    //         await guild.channels.fetch();
    //
    //         return guild.channels.cache
    //             .filter(c => c.type === ChannelType.GuildVoice)
    //             .map(c => ({id: c.id, name: c.name}));
    //     });
    //
    //     // Join Voice
    //     ipcMain.handle('discord_join_voice', async (_, {guildId, channelId}) => {
    //         return await this.joinChannel(guildId, channelId);
    //     });
    //
    //     // Leave Voice
    //     ipcMain.handle('discord_leave_voice', () => {
    //         this.disconnectVoice();
    //     });
    // }

    // private sendUpdateToRenderer(channel: string, data: any) {
    //     // Nota: qui serve un riferimento alla BrowserWindow o usare webContents.getAllWebContents()
    //     // Per semplicità, in un'architettura Electron pura, potresti passare la MainWindow al costruttore
    //     // oppure usare l'approccio broadcast:
    //     const {webContents} = require('electron');
    //     webContents.getAllWebContents().forEach((wc: any) => {
    //         wc.send(`discord_event:${channel}`, data);
    //     });
    // }
}