import {ChildProcess, spawn} from 'child_process';
import path from 'path';
import {app} from 'electron';
import {settingsStore} from "../utils/store";
import os from "node:os";
import axios, {isAxiosError} from "axios";
import {DiscordData} from "../../types/discord";
import {state} from "../state";

export class DiscordBridge {
    private readonly MAX_RETRIES = 10;
    private readonly BASE_RETRY_DELAY = 1000;
    private readonly jarPath: string;
    private readonly net;
    private process: ChildProcess | null = null;
    private restPort: number;
    private udpPort: number;

    private isIntentionalStop: boolean = false;
    private restartAttempts: number = 0;
    private restartTimer: NodeJS.Timeout | null = null;

    constructor() {
        const fileName = 'discord-bridge.jar';
        if (app.isPackaged) this.jarPath = path.join(process.resourcesPath, 'bin', fileName);
        else this.jarPath = path.join(__dirname, '../../resources/bin', fileName);

        this.restPort = settingsStore.get('discord.restPort');
        this.udpPort = settingsStore.get('discord.udpPort');

        this.net = axios.create({
            baseURL: 'http://127.0.0.1:' + this.restPort,
            timeout: 5000,
        });
    }

    public start() {
        if (this.restartTimer) clearTimeout(this.restartTimer);

        if (this.process) {
            console.log('[Discord-Bridge] is already running, terminating existing process...');
            stop();
        }

        console.log(`[Discord-Bridge] Starting Discord Bridge process at ${this.jarPath}...`);
        console.log(`[Discord-Bridge] Using REST port: ${this.restPort}, UDP port: ${this.udpPort}`);

        this.isIntentionalStop = false;

        const args = ['-Xmx512M', '-jar', this.jarPath, '-r', this.restPort.toString(), '-u', this.udpPort.toString(), '-p', process.pid.toString()];
        this.process = spawn('java', args, {
            stdio: 'ignore',
            detached: false
        });

        this._setHighPriority();
        this._setIOListeners();

        console.log('[Discord-Bridge] Process started.');

        setTimeout(() => {
            if (this.process && !this.process.killed) this.restartAttempts = 0;
        }, 10000);
    }

    public stop() {
        this.isIntentionalStop = true;

        if (this.restartTimer) {
            clearTimeout(this.restartTimer);
            this.restartTimer = null;
        }

        if (!this.process) return;

        console.log('[Discord-Bridge] Stopping Discord Bridge process...');
        this.process.kill('SIGINT');
        this.process = null;
        console.log('[Discord-Bridge] Process stopped.');
    }

    public updateRestPort(port: number) {
        if (this.restPort === port) return;
        this._setRestPort(port);
    }

    public updateUdpPort(port: number) {
        if (this.udpPort === port) return;
        this._setUdpPort(port);
    }

    public async waitForReady(maxRetries: number = 20, intervalMs: number = 500): Promise<boolean> {
        for (let i = 0; i < maxRetries; i++) {
            const isReady = await this.ping();
            if (isReady) return true;

            await new Promise(resolve => setTimeout(resolve, intervalMs));
        }

        return false;
    }

    public async waitForConnected(maxRetries: number = 20, intervalMs: number = 500): Promise<boolean> {
        for (let i = 0; i < maxRetries; i++) {
            const isConnected = await this.getStatus();
            if (isConnected) return true;

            await new Promise(resolve => setTimeout(resolve, intervalMs));
        }

        return false;
    }

    public async ping(): Promise<boolean> {
        if (!this.process) {
            console.log('[Discord-Bridge] Process is not running.');
            return;
        }

        try {
            const res = await this.net.get('/ping');
            return res.status === 200;
        } catch {
            return false;
        }
    }

    public async connect(token: string): Promise<boolean> {
        if (!this.process) {
            console.log('[Discord-Bridge] Process is not running.');
            return;
        }

        try {
            const res = await this.net.post('/connect', {token: token});
            return res.status === 200;
        } catch (e) {
            if (isAxiosError(e) && e.response) console.warn(`[Discord-Bridge] Connection failed with code ${e.response.status}. Method: connect, Error:`, e.response.data);
            else console.warn(`[Discord-Bridge] Connection failed.`);
            return false;
        }
    }

    public async disconnect(): Promise<boolean> {
        if (!this.process) {
            console.log('[Discord-Bridge] Process is not running.');
            return;
        }

        try {
            const res = await this.net.post('/disconnect');
            return res.status === 200;
        } catch (e) {
            if (isAxiosError(e) && e.response) console.warn(`[Discord-Bridge] Connection failed with code ${e.response.status}. Method: disconnect, Error:`, e.response.data);
            else console.warn(`[Discord-Bridge] Connection failed.`);
            return false;
        }
    }

    public async joinChannel(guildId: string, channelId: string): Promise<boolean> {
        if (!this.process) {
            console.log('[Discord-Bridge] Process is not running.');
            return;
        }

        try {
            const res = await this.net.post('/join', {guild: guildId, channel: channelId});
            return res.status === 200;
        } catch (e) {
            if (isAxiosError(e) && e.response) console.warn(`[Discord-Bridge] Connection failed with code ${e.response.status}. Method: join, Error:`, e.response.data);
            else console.warn(`[Discord-Bridge] Connection failed.`);
            return false;
        }
    }

    public async leaveChannel(): Promise<boolean> {
        if (!this.process) {
            console.log('[Discord-Bridge] Process is not running.');
            return;
        }

        try {
            const res = await this.net.post('/leave');
            return res.status === 200;
        } catch (e) {
            if (isAxiosError(e) && e.response) console.warn(`[Discord-Bridge] Connection failed with code ${e.response.status}. Method: leave, Error:`, e.response.data);
            else console.warn(`[Discord-Bridge] Connection failed.`);
            return false;
        }
    }

    public async getStatus(): Promise<boolean> {
        if (!this.process) {
            console.log('[Discord-Bridge] Process is not running.');
            return false;
        }

        try {
            const res = await this.net.get('/status');
            return (res.data as { connected: boolean }).connected;
        } catch (e) {
            if (isAxiosError(e) && e.response) console.warn(`[Discord-Bridge] Connection failed with code ${e.response.status}. Method: status, Error:`, e.response.data);
            else console.warn(`[Discord-Bridge] Connection failed.`);
            return false;
        }
    }

    public async getGuilds(): Promise<DiscordData[]> {
        if (!this.process) {
            console.log('[Discord-Bridge] Process is not running.');
            return;
        }

        try {
            const res = await this.net.get('/guilds');
            return res.data;
        } catch (e) {
            if (isAxiosError(e) && e.response) console.warn(`[Discord-Bridge] Connection failed with code ${e.response.status}. Method: guilds, Error:`, e.response.data);
            else console.warn(`[Discord-Bridge] Connection failed.`);
            return [];
        }
    }

    public async getVoiceChannels(guildId: string): Promise<DiscordData[]> {
        if (!this.process) {
            console.log('[Discord-Bridge] Process is not running.');
            return;
        }

        try {
            const res = await this.net.get(`/channels?guild=${guildId}`);
            return res.data;
        } catch (e) {
            if (isAxiosError(e) && e.response) console.warn(`[Discord-Bridge] Connection failed with code ${e.response.status}. Method: channels, Error:`, e.response.data);
            else console.warn(`[Discord-Bridge] Connection failed.`);
            return [];
        }
    }

    public async getVoiceStatus(guildId: string): Promise<{ connected: boolean }> {
        if (!this.process) {
            console.log('[Discord-Bridge] Process is not running.');
            return;
        }

        try {
            const res = await this.net.get(`/status/voice?guild=${guildId}`);
            return res.data;
        } catch (e) {
            if (isAxiosError(e) && e.response) console.warn(`[Discord-Bridge] Connection failed with code ${e.response.status}. Method: status/voice, Error:`, e.response.data);
            else console.warn(`[Discord-Bridge] Connection failed.`);
            return {connected: false};
        }
    }

    private async _setRestPort(port: number) {
        if (!this.process) {
            console.log('[Discord-Bridge] Process is not running.');
            return;
        }

        try {
            const res = await this.net.post('/port/rest', {port: port});
            if (res.status === 200) {
                this.restPort = port;
                this.net.defaults.baseURL = `http://127.0.0.1:${this.restPort}`;
                console.log(`[Discord-Bridge] REST port updated to ${port}`);
            }
        } catch (e) {
            console.warn('[Discord-Bridge] Failed to set REST port:', e);
        }
    }

    private async _setUdpPort(port: number) {
        if (!this.process) {
            console.log('[Discord-Bridge] Process is not running.');
            return;
        }

        try {
            const res = await this.net.post('/port/udp', {port: port});
            if (res.status === 200) {
                this.udpPort = port;
                console.log(`[Discord-Bridge] UDP port updated to ${port}`);
            }
        } catch (e) {
            console.warn('[Discord-Bridge] Failed to set UDP port:', e);
        }
    }

    private _setHighPriority() {
        if (!this.process || !this.process.pid) return;

        try {
            os.setPriority(this.process.pid, os.constants.priority.PRIORITY_HIGH);
            console.log('[Discord-Bridge] Process priority set to HIGH.');
        } catch (e) {
            console.warn('[Discord-Bridge] Failed to set process priority to high (requires Admin/Root?):', e);
        }
    }

    private _setIOListeners() {
        if (!this.process) return;

        this.process.on('close', (code) => {
            this.process = null;
            if (code) console.log(`[Discord-Bridge] Exited with code ${code}.`);
            else console.log(`[Discord-Bridge] Exited.`)

            if (!this.isIntentionalStop) this._handleCrash();
        });
    }

    private _handleCrash() {
        console.warn(`[Discord-Bridge] Process crashed unexpectedly.`);

        if (this.restartAttempts >= this.MAX_RETRIES) {
            console.error(`[Discord-Bridge] Max restart attempts reached (${this.MAX_RETRIES}). Giving up.`);
            // TODO Send notification to user
            return;
        }

        this.restartAttempts++;

        const delay = this.BASE_RETRY_DELAY * Math.pow(2, this.restartAttempts - 1);
        console.log(`[Discord-Bridge] Restarting in ${delay}ms (Attempt ${this.restartAttempts}/${this.MAX_RETRIES})...`);

        this.restartTimer = setTimeout(() => {
            this.start();
        }, delay);
    }
}

export const initDiscord = () => {
    state.discordBridge.start();
    state.discordBridge.waitForReady().then((isReady) => {
        if (!isReady) {
            console.error('[Main] Discord Bridge is not ready, cannot join voice channel.');
            return;
        }

        state.discordBridge.connect(settingsStore.get('discord.token'));
        state.discordBridge.waitForConnected().then((isConnected) => {
            if (!isConnected) {
                console.error('[Main] Discord bot is not connected to Discord.');
                return;
            }

            const guildId = settingsStore.get('discord.lastGuild');
            const channelId = settingsStore.get('discord.lastChannel');

            if (guildId && channelId) {
                console.log('[Main] Joining last voice channel...');
                state.discordBridge!.joinChannel(guildId, channelId);
            }
        });
    });
}