import {Client, GatewayIntentBits} from 'discord.js';
import {Settings} from "./store/settings";
import {createAudioPlayer, createAudioResource, joinVoiceChannel, VoiceConnection, VoiceConnectionStatus} from '@discordjs/voice';
import { Readable } from 'stream';
import * as prism from 'prism-media';
import ffmpeg from "fluent-ffmpeg";

export class Bot {
    private settingsStore: Settings;
    private client: Client;

    constructor(settingsStore: Settings) {
        this.settingsStore = settingsStore;
        this.client = new Client({
            intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
        });

        this.client.once('ready', () => {
            console.log('Bot is ready');
        });
    }

    connect() {
        const token = this.settingsStore.get().bot_token;
        if (!token) return;
        this.client.login(token);
    }

    async joinChannel(guildId: string, channelId: string) {
        const guild = this.client.guilds.cache.get(guildId);
        if (!guild) return;

        const channel = await guild.channels.fetch(channelId);
        if (!channel || !channel.isVoiceBased()) return;

        const connection: VoiceConnection = joinVoiceChannel({
            guildId: guildId,
            channelId: channelId,
            adapterCreator: guild.voiceAdapterCreator as any
        });

        connection.on(VoiceConnectionStatus.Ready, () => {
            console.log('Voice connection is ready');
            this.streamAudio(connection);
        })
    }

    private streamAudio(connection: VoiceConnection) {
        const stream = ffmpeg()
            .input('default')
            .inputFormat('pulse')
            .audioChannels(2)
            .audioFrequency(48000)
            .format('s16le')
            .pipe() as Readable;

        const opusEncoder = new prism.opus.Encoder({rate: 48000, channels: 2, frameSize: 960});

        const audioPlayer = createAudioPlayer();
        const resource = createAudioResource(stream.pipe(opusEncoder));

        audioPlayer.play(resource);
        connection.subscribe(audioPlayer);
    }
}