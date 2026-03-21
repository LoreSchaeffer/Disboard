import {WebSocket, WebSocketServer} from "ws";
import {settingsStore} from "../../storage/settings-store";
import {RemoteEvent, RemoteMessage, RemoteWebSocket, Settings, WebsocketSettings} from "../../../types";
import {sendError} from "./rsc-utils";
import {remoteMain} from "./remote-main";

const TIMEOUT = 15;

export class RemoteServer {
    private wss: WebSocketServer | null = null;
    private isRunning: boolean = false;
    private port: number = 4466;
    private authEnabled: boolean = false;

    constructor() {
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

            this.wss.on('connection', (socket) => {
                const ws = socket as RemoteWebSocket;

                console.log('[RemoteServer] New client connected.');

                ws.isAuthenticated = !this.authEnabled;

                let authTimeout: NodeJS.Timeout | null = null;

                if (this.authEnabled) {
                    authTimeout = setTimeout(() => {
                        if (!ws.isAuthenticated && ws.readyState === WebSocket.OPEN) {
                            console.log(`[RemoteServer] Client failed to authenticate within ${TIMEOUT} seconds. Disconnecting.`);
                            sendError(ws, `Authentication timeout (${TIMEOUT}s).`);
                            ws.close(1008, 'auth_timeout');
                        }
                    }, TIMEOUT * 1000);
                }

                ws.on('message', (rawMsg) => {
                    try {
                        const msg = JSON.parse(rawMsg.toString()) as RemoteMessage;

                        if (typeof msg !== 'object' || msg === null || !msg.op) {
                            sendError(ws, 'Invalid message format.');
                            return;
                        }

                        if (!ws.isAuthenticated && msg.op !== 'auth:identify') {
                            console.warn(`[RemoteServer] Unauthenticated client attempted to use ${msg.op}. Disconnecting.`);
                            sendError(ws, 'Authentication required as the very first message.');
                            ws.close(1008, 'auth_required');
                            return;
                        }

                        this._handleCommand(ws, msg);
                    } catch (e) {
                        console.error('[RemoteServer] Error parsing message:', e);
                    }
                });

                ws.on('close', () => {
                    console.log('[RemoteServer] Client disconnected.');
                    if (authTimeout) clearTimeout(authTimeout);
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public broadcast(channel: string, ...args: any[]) {
        if (!this.wss || !this.isRunning) return;

        const payload = {
            op: channel,
            args: args
        };

        for (const client of this.wss.clients) {
            if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify(payload));
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
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async _handleCommand(ws: RemoteWebSocket, msg: RemoteMessage & { args?: any[] }) {
        if (settingsStore.get('debug')) console.log('[RemoteServer] Received:', msg.op);

        const event: RemoteEvent = {
            ws,
            nonce: msg.nonce,
            reply: (op: string, data: Record<string, unknown> = {}) => {
                ws.send(JSON.stringify({op, ...data}));
            }
        };

        const args = Array.isArray(msg.args) ? msg.args : [];

        try {
            const handler = remoteMain.getHandler(msg.op);
            if (handler) {
                const result = await handler(event, ...args);

                const response = {
                    op: `${msg.op}:response`,
                    nonce: msg.nonce,
                    success: true,
                    data: result
                };

                ws.send(JSON.stringify(response));
                return;
            }

            const listener = remoteMain.getListener(msg.op);
            if (listener) {
                await listener(event, ...args);
                return;
            }

            sendError(ws, `Unknown command: ${msg.op}`);
        } catch (error) {
            console.error(`[RemoteServer] Error processing ${msg.op}:`, error);

            if (remoteMain.getHandler(msg.op)) {
                ws.send(JSON.stringify({
                    op: `${msg.op}:response`,
                    nonce: msg.nonce,
                    success: false,
                    error: error.message || 'Internal Server Error'
                }));
            } else {
                sendError(ws, `Error processing ${msg.op}`);
            }
        }
    }
}