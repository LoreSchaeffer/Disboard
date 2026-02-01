import {Time} from "./time";
import {clamp} from "../../common/utils";
import {RepeatMode} from "../../types/common";
import {PlayerTrack} from "../../types/data";

export type PlayerStatus = {
    playing: boolean;
    paused: boolean;
    seeking: boolean;
    loading: boolean;
}

type EventHandlerMap = {
    abort?: () => void;
    ended?: () => void;
    error?: () => void;
    pause?: () => void;
    resume?: () => void;
    play?: () => void;
    trackchange?: (track: PlayerTrack) => void;
    seeked?: () => void;
    timeupdate?: (currentTime: Time, duration: Time) => void;
    repeatupdate?: (mode: RepeatMode) => void;
    queueupdate?: (queue: PlayerTrack[]) => void;
    reset?: () => void;
    loading?: (isLoading: boolean) => void;
};

export class Player {
    private readonly eventHandlers: Partial<EventHandlerMap> = {};
    private readonly audio: HTMLAudioElement = new Audio();
    private readonly status: PlayerStatus;

    private repeat: RepeatMode = 'none';
    private queue: PlayerTrack[] = [];
    private index: number = 0;

    private currentPlayerTrack: PlayerTrack | null = null;

    private startTime: Time | null = null;
    private endTime: Time | null = null;
    private duration: Time | null = null;

    private masterVolume: number = 50;

    private botMode: boolean = false;

    // Web Audio API Components
    private audioContext: AudioContext;
    private sourceNode: MediaElementAudioSourceNode;
    private masterGainNode: GainNode;
    private localGateNode: GainNode;
    private workletNode: AudioWorkletNode | null = null;
    private workletInitPromise: Promise<void> | null = null;

    constructor() {
        this.status = {
            playing: false,
            paused: false,
            seeking: false,
            loading: false
        };

        this.audio.preload = 'auto';
        this.audio.volume = 1.0;

        this._initializeWebAudioAPI();
        this._bindEvents();
    }

    private async _initializeWebAudioAPI() {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioContextClass({sampleRate: 48000});

        this.sourceNode = this.audioContext.createMediaElementSource(this.audio);
        this.masterGainNode = this.audioContext.createGain();
        this.localGateNode = this.audioContext.createGain();

        // Source -> Master Gain
        this.sourceNode.connect(this.masterGainNode);
        // Master Gain -> Local Gate -> Speakers
        this.masterGainNode.connect(this.localGateNode);
        this.localGateNode.connect(this.audioContext.destination);

        this.masterGainNode.gain.value = clamp(this.masterVolume, 0, 100) / 100;
        this.localGateNode.gain.value = 1.0;
        this.audio.crossOrigin = 'anonymous';

        try {
            this.workletInitPromise = this.audioContext.audioWorklet.addModule('/audioProcessor.js');
            await this.workletInitPromise;
        } catch (e) {
            console.error('Failed to load AudioWorklet module:', e);
        }
    }

    private _bindEvents() {
        this.audio.addEventListener('error', (e) => {
            console.error("Audio Error", e);
            this.status.loading = false;
            this.status.playing = false;
            this.eventHandlers['error']?.();
        });

        this.audio.addEventListener('abort', () => this.eventHandlers['abort']?.());

        const setLoading = (loading: boolean) => {
            if (this.status.loading !== loading) {
                this.status.loading = loading;
                this.eventHandlers['loading']?.(loading);
            }
        };

        this.audio.addEventListener('loadstart', () => setLoading(true));
        this.audio.addEventListener('waiting', () => setLoading(true));
        this.audio.addEventListener('canplay', () => setLoading(false));

        this.audio.addEventListener('playing', () => {
            setLoading(false);
            this.status.playing = true;
            if (this.status.paused) {
                this.status.paused = false;
                this.eventHandlers['resume']?.();
            } else {
                this.eventHandlers['play']?.();
            }
        });

        this.audio.addEventListener('pause', () => {
            if (this.status.playing && !this.status.seeking) {
                this.status.paused = true;
                this.eventHandlers['pause']?.();
            }
        });

        this.audio.addEventListener('ended', () => this._handleEnded());

        this.audio.addEventListener('seeking', () => this.status.seeking = true);
        this.audio.addEventListener('seeked', () => {
            this.status.seeking = false;
            this.eventHandlers['seeked']?.();
        });

        this.audio.addEventListener('timeupdate', () => this._handleTimeUpdate());

        this.audio.addEventListener('loadedmetadata', () => {
            this._applyVolume();
            if (this.startTime) this.audio.currentTime = this.startTime.getTimeS();

            this.audio.play().catch(e => {
                if (e.name !== 'AbortError') console.warn("Autoplay blocked/failed", e);
            });
        });
    }

    public on<K extends keyof EventHandlerMap>(event: K, handler: EventHandlerMap[K]) {
        this.eventHandlers[event] = handler;
    }

    public off<K extends keyof EventHandlerMap>(event: K) {
        delete this.eventHandlers[event];
    }


    public setBotMode(enabled: boolean) {
        if (this.botMode === enabled) return;
        this.botMode = enabled;

        if (this.audioContext.state === 'suspended') this.audioContext.resume();

        if (enabled) {
            this.localGateNode.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.1);
            this._startRecording().catch(e => console.error('Failed to start recording:', e));
        } else {
            this._stopRecording();
            this.localGateNode.gain.setTargetAtTime(1, this.audioContext.currentTime, 0.1);
        }
    }


    public addToQueue(track: PlayerTrack) {
        this.queue.push(track);
        this.eventHandlers['queueupdate']?.([...this.queue]);
        if (this.queue.length === 1 && !this.currentPlayerTrack) {
            this.index = 0;
        }
    }

    public removeFromQueue(index: number) {
        if (index < 0 || index >= this.queue.length) return;
        this.queue.splice(index, 1);

        if (this.index > index) this.index--;
        else if (this.index >= this.queue.length) this.index = Math.max(0, this.queue.length - 1);

        this.eventHandlers['queueupdate']?.([...this.queue]);
    }

    public clearQueue() {
        this.stop();
        this.queue = [];
        this.index = 0;
        this.eventHandlers['queueupdate']?.([...this.queue]);
    }


    public play() {
        if (this.audioContext.state === 'suspended') this.audioContext.resume();

        if (this.status.paused && this.currentPlayerTrack) {
            this.resume();
            return;
        }

        if (this.queue.length === 0) return;
        if (this.index >= this.queue.length) this.index = 0;

        this.currentPlayerTrack = this.queue[this.index];
        this._loadAndPlay();
    }

    public playNow(track: PlayerTrack) {
        if (this.status.playing) this.stop();
        this.currentPlayerTrack = track;
        this._loadAndPlay();
    }

    public playFromQueue(index: number) {
        if (index < 0 || index >= this.queue.length) return;
        this.stop();
        this.index = index;
        this.currentPlayerTrack = this.queue[this.index];
        this._loadAndPlay();
    }

    public playPause() {
        if (this.status.playing || (this.status.paused && this.currentPlayerTrack)) {
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
        if (this.audioContext.state === 'suspended') this.audioContext.resume();
        this.audio.play().catch(console.error);
    }

    public stop() {
        this._resetPlayer();
    }

    public next() {
        if (this.queue.length === 0) return;

        let nextIndex = this.index + 1;
        if (nextIndex >= this.queue.length) {
            if (this.repeat === 'all') nextIndex = 0;
            else {
                this.stop();
                return;
            }
        }
        this.index = nextIndex;
        this.currentPlayerTrack = this.queue[this.index];
        this._loadAndPlay();
    }

    public previous() {
        if (this.queue.length === 0) return;

        let prevIndex = this.index - 1;
        if (prevIndex < 0) {
            if (this.repeat === 'all') prevIndex = this.queue.length - 1;
            else {
                this.seek(0);
                return;
            }
        }

        this.index = prevIndex;
        this.currentPlayerTrack = this.queue[this.index];
        this._loadAndPlay();
    }

    public seek(timeMs: number) {
        if (!this.currentPlayerTrack) return;
        this.status.seeking = true;

        let absoluteTimeS = timeMs / 1000;

        if (this.startTime) absoluteTimeS += this.startTime.getTimeS();
        if (this.endTime && absoluteTimeS > this.endTime.getTimeS()) absoluteTimeS = this.endTime.getTimeS();

        this.audio.currentTime = absoluteTimeS;
    }


    public setVolume(volume: number) {
        this.masterVolume = clamp(volume, 0, 100);
        this.masterGainNode.gain.setTargetAtTime(this.masterVolume / 100, this.audioContext.currentTime, 0.1);
    }

    public async setOutputDevice(deviceId: string) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (typeof (this.audioContext as any).setSinkId === 'function') {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (this.audioContext as any).setSinkId(deviceId);
            } catch (e) {
                console.error('Failed to set output device on AudioContext', e);
            }
        } else {
            console.warn('setSinkId not supported on AudioContext. Default device will be used instead.');
        }
    }

    public setRepeatMode(mode: RepeatMode) {
        this.repeat = mode;
        this.eventHandlers['repeatupdate']?.(mode);
    }

    public getStatus(): PlayerStatus {
        return {...this.status};
    }

    public getCurrentPlayerTrack(): PlayerTrack | null {
        return this.currentPlayerTrack;
    }

    public getQueue(): PlayerTrack[] {
        return [...this.queue];
    }

    public getRepeatMode(): RepeatMode {
        return this.repeat;
    }

    public getDuration(): Time | null {
        return this.duration ? this.duration.copy() : null;
    }

    public getIndex(): number {
        return this.index;
    }


    private _loadAndPlay() {
        if (!this.currentPlayerTrack) return;

        this.eventHandlers['trackchange']?.(this.currentPlayerTrack);
        this._calculateCropsAndDuration();

        if (this.currentPlayerTrack.directStream) {
            if (this.currentPlayerTrack.source.type === 'youtube' || this.currentPlayerTrack.source.type === 'url') this.audio.src = this.currentPlayerTrack.source.src;
            else this.audio.src = `music://file/${encodeURIComponent(this.currentPlayerTrack.source.src)}`;
        } else {
            this.audio.src = `music://audio/${encodeURIComponent(this.currentPlayerTrack.id)}`;
        }

        this.audio.load();
    }

    private _calculateCropsAndDuration() {
        this.startTime = null;
        this.endTime = null;
        this.duration = null;

        if (!this.currentPlayerTrack) return;

        const crops = this.currentPlayerTrack.cropOptions;

        if (crops?.startTime && crops?.startTimeUnit && crops.startTime > 0) this.startTime = new Time(crops.startTime, crops.startTimeUnit);

        if (crops?.endTime && crops?.endTimeUnit && crops?.endTimeType) {
            if (crops.endTimeType === 'after') {
                const durationAfter = new Time(crops.endTime, crops.endTimeUnit);
                this.endTime = durationAfter.copy();
                if (this.startTime) this.endTime.add(this.startTime);
            } else {
                this.endTime = new Time(crops.endTime, crops.endTimeUnit);
            }
        }

        let totalFileDuration: Time;
        if (this.endTime) totalFileDuration = this.endTime.copy();
        else totalFileDuration = Time.fromMs(this.currentPlayerTrack.duration || 0);

        this.duration = totalFileDuration.copy();

        if (this.startTime) this.duration.subtract(this.startTime);
    }

    private _handleTimeUpdate() {
        if (this.status.seeking || !this.status.playing) return;

        let currentTimeMs = this.audio.currentTime * 1000;
        if (this.startTime) currentTimeMs -= this.startTime.getTimeMs();

        if (this.endTime) {
            const absoluteMs = this.audio.currentTime * 1000;
            if (absoluteMs >= this.endTime.getTimeMs()) {
                this._forceEnd();
                return;
            }
        }

        const durationMs = this.duration ? this.duration.getTimeMs() : 0;
        this.eventHandlers['timeupdate']?.(
            Time.fromMs(Math.max(0, Math.round(currentTimeMs))),
            Time.fromMs(durationMs)
        );
    }

    private _forceEnd() {
        this.audio.pause();
        this.audio.currentTime = this.endTime ? this.endTime.getTimeS() : this.audio.duration;
        this.audio.dispatchEvent(new Event('ended'));
    }

    private _handleEnded() {
        this.status.playing = false;
        this.status.paused = false;
        this.eventHandlers['ended']?.();

        if (this.queue.length === 0) {
            if (this.repeat === 'one') {
                this.audio.currentTime = this.startTime ? this.startTime.getTimeS() : 0;
                this.audio.play().catch(console.error);
            } else {
                this._resetPlayer();
            }
            return;
        }

        if (this.repeat === 'one') {
            this.audio.currentTime = this.startTime ? this.startTime.getTimeS() : 0;
            this.audio.play().catch(console.error);
        } else {
            this.next();
        }
    }

    private _applyVolume() {
        let finalVolume: number;

        if (this.currentPlayerTrack && this.currentPlayerTrack.volumeOverride !== undefined && this.currentPlayerTrack.volumeOverride !== null) {
            finalVolume = this.currentPlayerTrack.volumeOverride;
        } else {
            finalVolume = this.masterVolume;
        }

        this.masterGainNode.gain.setTargetAtTime(clamp(finalVolume, 0, 100) / 100, this.audioContext.currentTime, 0.1);
    }

    private _resetPlayer() {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.audio.removeAttribute('src');

        this.masterGainNode.gain.setTargetAtTime(clamp(this.masterVolume, 0, 100) / 100, this.audioContext.currentTime, 0.1);

        this.status.playing = false;
        this.status.paused = false;
        this.status.seeking = false;
        this.status.loading = false;

        this.currentPlayerTrack = null;
        this.startTime = null;
        this.endTime = null;
        this.duration = null;

        this.eventHandlers['trackchange']?.(null);
        this.eventHandlers['reset']?.();
        this.eventHandlers['timeupdate']?.(Time.fromMs(0), Time.fromMs(0));
    }

    private async _startRecording() {
        if (this.workletNode) return;

        try {
            if (this.audioContext.state === 'suspended') await this.audioContext.resume();
            if (this.workletInitPromise) await this.workletInitPromise;

            this.workletNode = new AudioWorkletNode(this.audioContext, 'pcm-processor', {
                outputChannelCount: [2],
                numberOfInputs: 1,
                numberOfOutputs: 1,
                processorOptions: {}
            });

            this.workletNode.port.onmessage = (event) => {
                window.electron.sendAudioPacket(event.data);
            };

            this.workletNode.onprocessorerror = (err) => console.error("Worklet Error:", err);
            this.masterGainNode.connect(this.workletNode);

            console.log("Sending audio stream to Discord.");
        } catch (error) {
            console.error("Error starting Discord audio stream:", error);
        }
    }

    private _stopRecording() {
        if (!this.workletNode) return;

        this.masterGainNode.disconnect(this.workletNode);
        this.workletNode.disconnect();
        this.workletNode.port.close();
        this.workletNode = null;

        console.log("Audio stream to Discord stopped.");
    }
}