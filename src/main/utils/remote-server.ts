import {WebSocket, WebSocketServer} from "ws";
import {settingsStore} from "../storage/settings-store";
import {Settings, WebsocketSettings} from "../../types";
import {sendError, sendMessage} from "./rsc-utils";
import {rscCommands} from "./rsc";

export type RemoteMessage = {
    op: string;
    username?: string;
    password?: string;
    [key: string]: unknown
}

export type RemoteCommand = {
    op: string;
    handler: (ws: WebSocket, msg: RemoteMessage) => void;
}

export class RemoteServer {
    private wss: WebSocketServer | null = null;
    private isRunning: boolean = false;
    private port: number = 4466;
    private authEnabled: boolean = false;
    private username?: string;
    private password?: string;
    private commandRegistry: Map<string, RemoteCommand['handler']> = new Map<string, RemoteCommand['handler']>();

    constructor() {
        for (const cmd of rscCommands) {
            this.commandRegistry.set(cmd.op, cmd.handler);
        }
    }

    public init() {
        const wsSettings = settingsStore.get('remoteServer');
        if (!wsSettings) return;

        this._updateInternalCache(wsSettings);

        if (wsSettings.enabled) {
            console.log('[RemoteServer] Initializing Remote Server...');
            this.start();
        }
    }

    public start() {
        if (this.isRunning || this.wss) this.stop();

        try {
            this.wss = new WebSocketServer({port: this.port});

            this.wss.on('connection', (ws) => {
                console.log('[RemoteServer] New client connected.');

                let isAuthenticated = !this.authEnabled;

                ws.on('message', (rawMsg) => {
                    try {
                        const msg = JSON.parse(rawMsg.toString()) as RemoteMessage;

                        if (typeof msg !== 'object' || msg === null || !msg.op) {
                            sendError(ws, 'Invalid message format. Expected an object with an "op" field.');
                            return;
                        }

                        if (!isAuthenticated) {
                            if (msg.op === 'Identify') {
                                const validUser = !this.username || msg.username === this.username;
                                const validPass = !this.password || msg.password === this.password;

                                if (validUser && validPass) {
                                    isAuthenticated = true;
                                    sendMessage(ws, {op: 'Identified', success: true});
                                    console.log('[RemoteServer] Client authenticated successfully.');
                                } else {
                                    sendMessage(ws, {op: 'Identified', success: false, error: 'Invalid Credentials'});
                                    ws.close(1008, 'invalid_credentials');
                                }
                            } else {
                                sendError(ws, 'Authentication needed. Please send an Identify command with valid credentials.');
                            }
                            return;
                        }

                        this._handleCommand(ws, msg);
                    } catch (e) {
                        console.error('[RemoteServer] Error parsing or managing message:', e);
                    }
                });

                ws.on('close', () => {
                    console.log('[RemoteServer] Client disconnected.');
                });
            });

            this.wss.on('error', (error) => {
                console.error('[RemoteServer] Critical server error:', error);
                this.isRunning = false;
            });

            this.isRunning = true;
            console.log(`[RemoteServer] Listening on port ${this.port}`);

        } catch (error) {
            console.error('[RemoteServer] Cannot start server:', error);
            this.isRunning = false;
        }
    }

    public stop() {
        if (this.wss) {
            console.log('[RemoteServer] Closing Remote Server...');

            for (const client of this.wss.clients) {
                client.close(1001, 'Closing Server');
            }

            this.wss.close();
            this.wss = null;
        }
        this.isRunning = false;
    }

    public onSettingsUpdate(oldSettings: Settings, newSettings: Settings) {
        const oldWs = oldSettings.remoteServer;
        const newWs = newSettings.remoteServer;

        let needsRestart = false;

        if (oldWs.enabled !== newWs.enabled) {
            if (newWs.enabled) {
                needsRestart = true;
            } else {
                this.stop();
                return;
            }
        }

        if (newWs.enabled && oldWs.port !== newWs.port) needsRestart = true;

        this._updateInternalCache(newWs);

        if (this.isRunning && !needsRestart) {
            const authChanged = oldWs.authEnabled !== newWs.authEnabled ||
                oldWs.username !== newWs.username ||
                oldWs.password !== newWs.password;

            if (authChanged) {
                console.log('[RemoteServer] Security settings changed. Disconnecting all clients...');
                for (const client of this.wss!.clients) {
                    client.close(1001, 'Security settings changed. Please reconnect.');
                }
            }
        }

        if (needsRestart) {
            this.stop();
            setTimeout(() => {
                if (newWs.enabled) this.start();
            }, 500);
        }
    }

    public broadcast(op: string, data: RemoteMessage) {
        if (!this.wss || !this.isRunning) return;

        const payload = JSON.stringify({op, data});
        for (const client of this.wss.clients) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(payload);
            }
        }
    }

    public getStatus() {
        return {
            running: this.isRunning,
            port: this.port,
            clientsConnected: this.wss ? this.wss.clients.size : 0
        };
    }

    private _updateInternalCache(wsSettings: WebsocketSettings) {
        this.port = wsSettings.port;
        this.authEnabled = wsSettings.authEnabled;
        this.username = wsSettings.username;
        this.password = wsSettings.password;
    }

    private _handleCommand(ws: WebSocket, msg: RemoteMessage) {
        if (settingsStore.get('debug')) console.log('[RemoteServer] Received command:', msg);

        const handler = this.commandRegistry.get(msg.op);
        if (handler) handler(ws, msg);
        else sendError(ws, `Unknown command: ${msg.op}`);
    }
}