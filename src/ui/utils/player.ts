import {Track} from "../../types/track";
import {Time} from "./time";
import {RepeatMode} from "../../types/types";
import {clamp, isRemoteUrl} from "../../utils/utils";

type PlayerStatus = {
    playing: boolean;
    paused: boolean;
    seeking: boolean;
}

type EventHandlerMap = {
    abort?: () => void;
    ended?: () => void;
    error?: () => void;
    pause?: () => void;
    resume?: () => void;
    play?: (duration: Time) => void;
    seeked?: () => void;
    timeupdate?: (currentTime: number) => void;
};

export class Player {
    private readonly eventHandlers: Partial<EventHandlerMap> = {};
    private readonly audio: HTMLAudioElement = new Audio();
    private readonly status: PlayerStatus;
    private repeat: RepeatMode = 'none';
    private queue: Track[] = [];
    private index: number = 0;
    private currentTrack: Track | null = null;
    private startTime: Time | null = null;
    private endTime: Time | null = null;

    constructor() {
        this.status = {
            playing: false,
            paused: false,
            seeking: false
        };

        this.audio.addEventListener('abort', () => {
            this.eventHandlers['abort']?.();
            console.log('Media playback aborted');
        });

        this.audio.addEventListener('ended', () => {
            this.eventHandlers['ended']?.();

            this.status.playing = false;
            this.status.seeking = false;
            this.status.paused = false;

            if (this.queue.length !== 0) {
                this._resetPlayer()

                if (this.repeat === 'one') {
                    this.currentTrack = this.queue[this.index];
                    this._play();
                } else if (this.repeat === 'none' && this.index === this.queue.length - 1) {
                    return;
                }

                this.next();
            } else {
                if (this.repeat !== 'none') {
                    this._play();
                } else {
                    this.stop();
                    this._resetPlayer();
                }
            }
        });

        this.audio.addEventListener('error', () => {
            this.eventHandlers['error']?.();
            console.error('Media playback error');
        });

        this.audio.addEventListener('pause', () => {
            if (this.status.playing) {
                this.status.paused = true;
                this.eventHandlers['pause']?.();
            }
        });

        this.audio.addEventListener('playing', () => {
            this.status.playing = true;

            if (this.status.paused) {
                this.status.paused = false;
                this.eventHandlers['resume']?.();
            } else {
                let duration: Time = new Time(this.currentTrack.duration, 'ms');
                if (this.endTime != null) duration = this.endTime.copy().convertToMs();
                if (this.startTime != null) duration.subtract(this.startTime);
                this.eventHandlers['play']?.();
            }
        });

        this.audio.addEventListener('seeked', () => {
            this.status.seeking = false;
            this.eventHandlers['seeked']?.();
        });

        this.audio.addEventListener('timeupdate', () => {
            this._timeupdate();
        });

        this.audio.addEventListener('loadedmetadata', () => {
            if (this.startTime !== null) this.audio.currentTime = this.startTime.getTimeS();
            this.audio.play().catch(e => console.error('Error playing track:', e));
        });
    }

    public on<K extends keyof EventHandlerMap>(event: K, handler: EventHandlerMap[K]) {
        this.eventHandlers[event] = handler;
    }

    public off<K extends keyof EventHandlerMap>(event: K) {
        delete this.eventHandlers[event];
    }

    public setQueue(queue: Track[]) {
        this.queue = queue;
        this.index = 0;
    }

    public addToQueue(track: Track) {
        this.queue.push(track);
    }

    public removeFromQueue(index: number) {
        if (index < 0 || index >= this.queue.length) return;
        this.queue.splice(index, 1);
        if (this.index > index) this.index--;
        if (this.index >= this.queue.length) this.index = this.queue.length - 1;
    }

    public clearQueue() {
        this.queue = [];
        this.index = 0;
    }

    public play() {
        if (this.status.playing) this.stop();
        if (this.queue.length === 0) return;

        this.currentTrack = this.queue[this.index];
        this._play();
    }

    public playNow(track: Track) {
        if (this.status.playing) this.stop();

        this.currentTrack = track;
        this._play();
    }

    public playFromQueue(index: number) {
        if (index < 0 || index >= this.queue.length) return;

        if (this.status.playing) this.stop();

        this.index = index;
        this.currentTrack = this.queue[this.index];
        this._play();
    }

    public playPause() {
        if (this.status.playing) {
            if (this.status.paused) this.resume();
            else this.pause();
        } else {
            this.play();
        }
    }

    public pause() {
        this.audio.pause();
    }

    public resume() {
        this.audio.play().catch(e => console.error('Error resuming track:', e));
    }

    public stop() {
        if (this.currentTrack === null) return;
        this._resetPlayer();
    }

    public next() {
        if (this.queue.length < 2) return;

        this.index++;
        if (this.repeat === 'all' && this.index >= this.queue.length) this.index = 0;

        this.currentTrack = this.queue[this.index];
        this._play();
    }

    public previous() {
        if (this.queue.length < 2) {
            this.audio.currentTime = 0;
            return;
        }

        this.index--;
        if (this.index < 0) this.index = this.queue.length - 1;

        this.currentTrack = this.queue[this.index];
        this._play();
    }

    public getRepeatMode(): RepeatMode {
        return this.repeat;
    }

    public setRepeatMode(mode: RepeatMode) {
        this.repeat = mode;
    }

    public seek(time: number) {
        this.status.seeking = true;

        if (this.startTime != null) time += this.startTime.getTimeMs();
        this.audio.currentTime = time / 1000;
    }

    public setVolume(volume: number) {
        this.audio.volume = clamp(volume, 0, 100) / 100;
    }

    public setOutputDevice(deviceId: string) {
        this.audio.setSinkId(deviceId).catch(e => console.error('Error setting output device', e));
    }

    public getStatus(): PlayerStatus {
        return {...this.status};
    }

    private _play() {
        if (!this.currentTrack) return;

        if (isRemoteUrl(this.currentTrack.uri)) this.audio.src = this.currentSong.uri;
        else this.audio.src = `dftp://file/${encodeURIComponent(this.currentTrack.uri)}`;

        if (this.currentTrack.start_time && this.currentTrack.start_time_unit && this.currentSong.start_time !== 0) {
            this.startTime = new Time(this.currentTrack.start_time, this.currentTrack.start_time_unit);
        }

        if (this.currentTrack.end_time && this.currentTrack.end_time_unit && this.currentTrack.end_time_type && this.currentTrack.end_time !== 0) {
            this.endTime = new Time(this.currentTrack.end_time, this.currentTrack.end_time_unit);
            if (this.currentTrack.end_time_type === 'after') this.endTime.add(this.startTime || new Time(0, 'ms'));
        }

        this.audio.preload = 'auto';
        this.audio.load();
    }

    private _timeupdate() {
        if (!this.status.playing || this.status.paused || this.status.seeking) return;

        let currentTime = Math.round(this.audio.currentTime * 1000);
        if (this.startTime) currentTime -= this.startTime.getTimeMs();

        if (this.endTime && currentTime >= this.endTime.getTimeMs()) {
            this.audio.dispatchEvent(new Event('ended'));
            return;
        }

        this.eventHandlers['timeupdate']?.(currentTime);
    }

    private _resetPlayer() {
        this.audio.pause();
        this.audio.currentTime = 0;

        this.status.playing = false;
        this.status.paused = false;
        this.status.seeking = false;

        this.currentTrack = null;
        this.startTime = null;
        this.endTime = null;
    }
}