import {ipcMain} from 'electron';
import {Readable} from 'stream';
import {AudioPlayer, createAudioPlayer, createAudioResource, NoSubscriberBehavior, StreamType} from '@discordjs/voice';

export class DiscordStreamManager {
    private audioStream: Readable | null = null;
    public player: AudioPlayer;

    constructor() {
        this.player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Play,
                maxMissedFrames: 5
            },
        });
        this.setupIpc();
    }

    private setupIpc() {
        ipcMain.on('audio_stream_start', () => {
            console.log('[Main] Audio Stream Started');

            this.audioStream = new Readable({
                read() {},
                highWaterMark: 0
            });

            const resource = createAudioResource(this.audioStream, {
                inputType: StreamType.WebmOpus,
                inlineVolume: false
            });

            this.player.play(resource);
        });

        ipcMain.on('audio_stream_data', (_, buffer: ArrayBuffer) => {
            if (this.audioStream) this.audioStream.push(Buffer.from(buffer));
        });

        ipcMain.on('audio_stream_end', () => {
            console.log('[Main] Audio Stream Ended');

            if (this.audioStream) {
                this.audioStream.push(null);

                setTimeout(() => {
                    if (this.audioStream && !this.audioStream.destroyed) this.audioStream.destroy();
                    this.audioStream = null;
                }, 100);
            }
            this.player.stop();
        });
    }

    public getPlayer() {
        return this.player;
    }
}