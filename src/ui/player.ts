import {Song} from "../utils/store/profiles";
import {isRemoteUrl} from "./utils";
import {RepeatMode} from "../utils/store/settings";
import {Time} from "./time";

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
    private startTime: Time = null;
    private endTime: Time = null;
    private repeat: RepeatMode = 'none';

    constructor() {
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
                    this.stop();
                    this._clearSong();
                }
            }

            if (this.isPaused) this.isPaused = false;
        });

        this.audio.addEventListener('error', () => {
            console.error('Audio error');
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
                let duration = this.currentSong.duration;
                if (this.endTime != null) duration = this.endTime.convertToMilliseconds();
                if (this.startTime != null) duration -= this.startTime.convertToMilliseconds();

                this.dispatchEvent('play', this.currentSong, duration);
            }
        });

        this.audio.addEventListener('seeked', () => {
            this.isSeeking = false;
        });

        this.audio.addEventListener('timeupdate', () => {
            this._timeupdate();
        });

        this.audio.addEventListener('loadedmetadata', () => {
            if (this.startTime) this.audio.currentTime = this.startTime.toSeconds();
            this.audio.play();
        });
    }

    setQueue(queue: Song[]) {
        this.queue = queue;
        if (queue.length === 0) this.clearQueue();
        else this.playingQueue = true;
    }

    clearQueue() {
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

        if (this.startTime != null) time += this.startTime.convertToMilliseconds();
        this.audio.currentTime = time / 1000;
    }

    setVolume(volume: number) {
        this.audio.volume = volume / 100;
    }

    setOutputDevice(deviceId: string) {
        (this.audio as any).setSinkId(deviceId).catch((e: Error) => {
            console.error(e.message);
        });
    }

    getLoopMode(): RepeatMode {
        return this.repeat;
    }

    isPlayerPlaying(): boolean {
        return this.isPlaying;
    }

    private _play() {
        if (this.currentSong) {
            if (isRemoteUrl(this.currentSong.uri)) this.audio.src = this.currentSong.uri;
            else this.audio.src = `dftp://file/${encodeURIComponent(this.currentSong.uri)}`;

            if (this.currentSong.start_time && this.currentSong.start_time_unit && this.currentSong.start_time !== 0) {
                this.startTime = new Time(this.currentSong.start_time, this.currentSong.start_time_unit);
            }

            if (this.currentSong.end_time_type && this.currentSong.end_time && this.currentSong.end_time_unit && this.currentSong.end_time !== 0) {
                this.endTime = new Time(this.currentSong.end_time, this.currentSong.end_time_unit);
                if (this.currentSong.end_time_type === 'after') this.endTime.add(this.startTime);
            }

            this.audio.preload = 'auto';
            this.audio.load();
        }
    }

    private _timeupdate() {
        if (!this.isPlaying || this.isPaused || this.isSeeking) return;

        let currentTime = Math.round(this.audio.currentTime * 1000);
        if (this.startTime) currentTime -= this.startTime.convertToMilliseconds();

        if (this.endTime != null && currentTime >= this.endTime.convertToMilliseconds()) {
            this.audio.dispatchEvent(new Event('ended'));
            return;
        }

        this.dispatchEvent('timeupdate', currentTime);
    }

    private _clearSong() {
        this.audio.currentTime = 0;
        this.currentSong = null;
        this.startTime = null;
        this.endTime = null;
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