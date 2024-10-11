import {Song} from "../utils/store/profiles";
import {isRemoteUrl} from "./utils";

export type RepeatMode = 'none' | 'one' | 'all';

type EventHandler = (...args: any[]) => void;

export class Player {
    private eventHandlers: { [key: string]: EventHandler[] } = {};
    private audio: HTMLAudioElement = new Audio();
    private queue: Song[] = [];
    private index = 0;
    private currentSong: Song | null = null;
    private playingQueue = false;
    private isPlaying = false;
    private isPaused = false;
    private isSeeking = false;
    private startTime = 0;
    private endTime = 0;
    private repeat: RepeatMode = 'none';

    constructor() {
        // Event listeners
        this.audio.addEventListener('abort', () => {
            console.log('abort');
        });

        this.audio.addEventListener('ended', () => {
            this.dispatchEvent('ended');
            this.isPlaying = false;

            if (this.queue.length !== 0) {
                this._clearSong();

                if (this.repeat === 'one') {
                    this.currentSong = this.queue[this.index];
                    this._play();
                } else if (this.repeat === 'none' && this.index === this.queue.length - 1) {
                    // Do nothing
                } else {
                    this.next();
                }
            } else {
                if (this.repeat === 'all' || this.repeat === 'one') {
                    this._play();
                } else {
                    this._clearSong();
                }
            }

            if (this.isPaused) this.isPaused = false;
        });

        this.audio.addEventListener('error', () => {
            console.log('error');
        });

        this.audio.addEventListener('pause', () => {
            if (this.isPlaying) {
                this.isPaused = true;
                this.dispatchEvent('pause');
            }
        });

        this.audio.addEventListener('playing', () => {
            this.isPlaying = true;

            if (this.isPaused) {
                this.isPaused = false;
                this.dispatchEvent('resume');
            } else {
                const duration = this.currentSong?.duration || 0;
                this.dispatchEvent('play', this.currentSong, duration);
            }
        });

        this.audio.addEventListener('seeked', () => {
            this.isSeeking = false;
        });

        this.audio.addEventListener('timeupdate', () => {
            this._timeupdate();
        });
    }

    addToQueue(song: Song) {
        this.queue.push(song);
        this.dispatchEvent('queued', this.queue);
    }

    removeFromQueue(index: number) {
        if (index >= this.queue.length) return;

        if (this.queue.length < 2) {
            this.clearQueue();
        } else {
            if (index < this.index) this.index--;
            this.queue.splice(index, 1);
        }
    }

    clearQueue() {
        this.queue = [];
        this.index = 0;
        this.playingQueue = false;
    }

    next() {
        if (this.queue.length < 2) return;

        this.index++;
        if (this.repeat === 'all' && this.index >= this.queue.length) this.index = 0;

        this.playingQueue = true;
        this.currentSong = this.queue[this.index];
        this._play();
    }

    previous() {
        if (this.queue.length < 2) return;

        this.index--;
        if (this.index < 0) this.index = this.queue.length - 1;

        this.playingQueue = true;
        this.currentSong = this.queue[this.index];
        this._play();
    }

    loop(mode: RepeatMode) {
        this.repeat = mode;
    }

    play() {
        if (this.isPlaying) this.stop();

        if (this.queue.length === 0) return;

        this.currentSong = this.queue[this.index];
        this.playingQueue = true;
        this._play();
    }

    playNow(song: Song) {
        if (this.isPlaying) this.stop();

        this.playingQueue = false;
        this.currentSong = song;
        this._play();
    }

    playNowFromQueue(index: number) {
        if (index >= this.queue.length) return;

        if (this.isPlaying) this.stop();
        this.index = index;
        this.currentSong = this.queue[this.index];
        this.playingQueue = true;
        this._play();
    }

    stop() {
        if (this.currentSong == null) return;

        this.isPlaying = false;
        this.isPaused = false;
        this.audio.pause();
        this._clearSong();

        this.dispatchEvent('stop', this.queue);
    }

    playPause() {
        if (this.isPlaying) {
            if (this.isPaused) this.resume();
            else this.pause();
        } else {
            this.play();
        }
    }

    pause() {
        this.audio.pause();
    }

    resume() {
        this.audio.play();
    }

    seekTo(time: number) {
        this.isSeeking = true;
        this.audio.currentTime = time / 1000;
    }

    setVolume(volume: number) {
        this.audio.volume = volume / 100;
    }

    setOutputDevice(deviceId: string) {
        (this.audio as any).setSinkId(deviceId).catch((e: any) => {
            console.error(e);
        });
    }

    private _play() {
        if (this.currentSong) {
            if (isRemoteUrl(this.currentSong.uri)) this.audio.src = this.currentSong.uri;
            else this.audio.src = `dftp://file/${encodeURIComponent(this.currentSong.uri)}`;
            this.audio.load();
            this.audio.play();
        }
    }

    private _timeupdate() {
        if (!this.isPlaying || this.isPaused || this.isSeeking) return;

        const currentTime = Math.round(this.audio.currentTime * 1000);

        if (this.endTime !== 0 && currentTime >= this.endTime) {
            this.audio.dispatchEvent(new Event('ended'));
            return;
        }

        this.dispatchEvent('timeupdate', currentTime - this.startTime);
    }

    private _clearSong() {
        this.audio.currentTime = 0;
        this.currentSong = null;
        this.startTime = 0;
        this.endTime = 0;
    }

    addEventListener(eventName: string, handler: EventHandler) {
        if (!this.eventHandlers[eventName]) {
            this.eventHandlers[eventName] = [];
        }
        this.eventHandlers[eventName].push(handler);
    }

    removeEventListener(eventName: string, handler: EventHandler) {
        if (this.eventHandlers[eventName]) {
            const index = this.eventHandlers[eventName].indexOf(handler);
            if (index !== -1) {
                this.eventHandlers[eventName].splice(index, 1);
            }
        }
    }

    dispatchEvent(eventName: string, ...eventData: any[]) {
        if (this.eventHandlers[eventName]) {
            this.eventHandlers[eventName].forEach(handler => {
                handler(...eventData);
            });
        }
    }
}