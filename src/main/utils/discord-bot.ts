import {Client, GatewayIntentBits, VoiceBasedChannel} from "discord.js";
import {AudioPlayer, AudioPlayerStatus, createAudioPlayer, createAudioResource, entersState, joinVoiceChannel, NoSubscriberBehavior, StreamType, VoiceConnection, VoiceConnectionStatus} from "@discordjs/voice";
import {PassThrough} from 'stream';
import {settingsStore} from "./store";
import {DiscordData, DiscordStatus} from "../../types/discord";

export class DiscordBot {
    private client: Client;
    private player: AudioPlayer;
    private audioStream: PassThrough;
    private connection: VoiceConnection | null = null;
    private isReady: boolean = false;
    private isConnected: boolean = false;

    constructor() {
    }

    public async login(token: string): Promise<void> {
        if (this.isReady && this.client) return;

        if (this.client) this.disconnect();

        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildVoiceStates
            ]
        });
        this._setupClientEvents();

        try {
            await this.client.login(token);
        } catch (error) {
            console.error('[Discord] Failed to login:', error);
            this.client = null;
            throw error;
        }
    }

    public disconnect(): void {
        this.leaveChannel();

        if (this.client) {
            this.client.destroy();
            this.client = null;
        }

        this.isReady = false;
        console.log('[Discord] Disconnected');
    }

    public async joinChannel(guildId: string, channelId: string): Promise<void> {
        if (!this.client) throw new Error('Discord client not initialized');

        this.leaveChannel();

        this._initAudioResources();

        let guild = this.client.guilds.cache.get(guildId);
        if (!guild) {
            try {
                guild = await this.client.guilds.fetch(guildId);
            } catch {
                throw new Error(`Guild ${guildId} not found`);
            }
        }

        const channel = guild.channels.cache.get(channelId) as VoiceBasedChannel;
        if (!channel || !channel.isVoiceBased()) throw new Error(`Channel ${channelId} not found or not a voice channel`);

        this.connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: true,
            selfMute: false
        });

        this.connection.on(VoiceConnectionStatus.Ready, () => {
            console.log('[Discord] Voice connection ready!');
            this.isConnected = true;
            this._startStreaming();
        });

        this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
            console.log('[Discord] Connection disconnected. Checking if it is a move or a close...');

            try {
                await Promise.race([
                    entersState(this.connection!, VoiceConnectionStatus.Signalling, 5_000),
                    entersState(this.connection!, VoiceConnectionStatus.Connecting, 5_000),
                ]);
                console.log('[Discord] It was a channel move/reconnect. Waiting for Ready state...');
            } catch {
                console.log('[Discord] Connection lost permanently.');
                this.leaveChannel();
            }
        });

        this.connection.on(VoiceConnectionStatus.Destroyed, () => {
            this.isConnected = false;
            this.connection = null;
            this._cleanupAudioResources();
        });
    }

    public leaveChannel(): void {
        if (this.connection) {
            this.connection.destroy();
            this.connection = null;
        }

        this.isConnected = false;
        this._cleanupAudioResources();
    }

    public writeAudioPacket(buffer: Buffer): void {
        if (
            this.isConnected &&
            this.audioStream &&
            !this.audioStream.destroyed &&
            this.connection?.state.status === VoiceConnectionStatus.Ready
        ) {
            this.audioStream.write(buffer);
        }
    }

    public getStatus(): DiscordStatus {
        return {
            ready: this.isReady,
            connected: this.isConnected
        }
    }

    public getGuilds(): DiscordData[] {
        if (!this.client) return [];
        return this.client.guilds.cache.map(g => ({id: g.id, name: g.name}));
    }

    public getChannels(guildId: string): DiscordData[] {
        if (!this.client) return [];

        const guild = this.client.guilds.cache.get(guildId);
        if (!guild) return [];

        return guild.channels.cache
            .filter(c => c.isVoiceBased())
            .sort((a, b) => a.rawPosition - b.rawPosition)
            .map(c => ({id: c.id, name: c.name}));
    }

    public init() {
        const enabled = settingsStore.get('discord.enabled');
        const token = settingsStore.get('discord.token');

        if (!enabled || !token) return;

        if (this.isReady) this.disconnect();

        console.log('[Discord] Initializing Discord Bot...');

        this.login(settingsStore.get('discord.token')).then(async () => {
            const ready = await this.waitForReady();
            if (!ready) {
                console.error('[Discord] Discord Bot failed to become ready in time.');
                return;
            }

            const guild = settingsStore.get('discord.lastGuild');
            const channel = settingsStore.get('discord.lastChannel');

            if (guild && channel) {
                console.log('[Discord] Joining voice channel...');
                this.joinChannel(guild, channel).then(() => {
                    console.log('[Discord] Joined voice channel successfully.');
                });
            }
        }).catch(err => {
            console.error('[Discord] Failed to initialize:', err);
        });
    }

    public async waitForReady(timeoutMs: number = 10000): Promise<boolean> {
        const startTime = Date.now();
        const checkInterval = 100;

        while (!this.isReady) {
            const elapsedTime = Date.now() - startTime;
            if (elapsedTime > timeoutMs) return false;

            await new Promise(resolve => setTimeout(resolve, checkInterval));
        }

        return true;
    }


    private _initAudioResources() {
        this._cleanupAudioResources();

        this.audioStream = new PassThrough({
            highWaterMark: 1024 * 1024 // 1MB buffer
        });

        this.player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Play
            }
        });

        this._setupPlayerEvents();
    }

    private _cleanupAudioResources() {
        if (this.player) {
            this.player.stop();
            this.player.removeAllListeners();
            this.player = null;
        }

        if (this.audioStream) {
            this.audioStream.destroy();
            this.audioStream.removeAllListeners();
            this.audioStream = null;
        }
    }

    private _setupClientEvents() {
        this.client.on('clientReady', () => {
            console.log(`[Discord] Logged in as ${this.client.user?.tag}`);
            this.isReady = true;
        });

        this.client.on('error', (error) => {
            console.error('[Discord] Client error:', error);
        });
    }

    private _setupPlayerEvents() {
        this.player.on('error', (error) => {
            console.error('[Discord] Audio player error:', error);
        });

        this.player.on(AudioPlayerStatus.Idle, () => {
            console.log('[Discord] Audio player is idle.');
        });

        this.player.on(AudioPlayerStatus.Playing, () => {
            console.log('[Discord] Audio player is playing.');
        });
    }

    private _startStreaming(): void {
        if (!this.connection || !this.player || !this.audioStream) return;

        const resource = createAudioResource(this.audioStream, {
            inputType: StreamType.Raw
        });

        this.connection.subscribe(this.player);
        this.player.play(resource);

        console.log('[Discord] Streaming started');
    }
}