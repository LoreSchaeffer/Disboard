import {WebSocket, WebSocketServer} from "ws";
import {settingsStore} from "../../storage/settings-store";
import {RemoteEvent, RemoteMessage, RemoteWebSocket, Settings, WebsocketSettings} from "../../../types";
import {remoteMain} from "./remote-main";
import {createServer} from "node:http";
import {generateUUID} from "../misc";
import {net} from "electron";
import {Readable} from "node:stream";

const TIMEOUT = 15;

export class RemoteServer {
    private wss: WebSocketServer | null = null;
    private httpServer: ReturnType<typeof createServer> | null = null;
    private isRunning: boolean = false;
    private port: number = 4466;
    private authEnabled: boolean = false;
    private validTokens: Set<string> = new Set();

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
        if (this.isRunning || this.wss || this.httpServer) this.stop();

        try {
            this.httpServer = createServer(async (req, res) => {
                res.setHeader('Access-Control-Allow-Origin', '*');
                if (req.method === 'OPTIONS') {
                    res.writeHead(204);
                    res.end();
                    return;
                }

                try {
                    const parsedUrl = new URL(req.url || '', `http://localhost`);
                    const pathname = parsedUrl.pathname;

                    if (pathname.startsWith('/api/')) {
                        if (this.authEnabled) {
                            const providedToken = parsedUrl.searchParams.get('token');
                            if (!providedToken || !this.validTokens.has(providedToken)) {
                                res.writeHead(401);
                                res.end('Unauthorized');
                                return;
                            }
                        }

                        const resourcePath = pathname.slice(5);

                        const fetchHeaders = new Headers();
                        if (req.headers.range) {
                            fetchHeaders.set('Range', req.headers.range);
                        }

                        const fetchOptions: RequestInit = {
                            method: req.method,
                            headers: fetchHeaders
                        };

                        const intRes = await net.fetch(`disboard://${resourcePath}`, fetchOptions);
                        res.statusCode = intRes.status;

                        intRes.headers.forEach((value, key) => res.setHeader(key, value));

                        if (intRes.body) {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const nodeStream = Readable.fromWeb(intRes.body as any);
                            nodeStream.pipe(res);
                        } else {
                            res.end();
                        }
                    } else {
                        res.writeHead(404);
                        res.end();
                    }
                } catch (error) {
                    console.error('[RemoteServer] Proxy Handler Error:', error);
                    res.writeHead(500);
                    res.end('Internal Server Error');
                }
            });

            this.wss = new WebSocketServer({server: this.httpServer});

            this.wss.on('connection', (socket) => {
                const ws = socket as RemoteWebSocket;

                ws.isAuthenticated = !this.authEnabled;

                if (this.authEnabled) {
                    ws.authTimeout = setTimeout(() => {
                        if (!ws.isAuthenticated && ws.readyState === WebSocket.OPEN) {
                            this.sendError(ws, `Authentication timeout (${TIMEOUT}s).`);
                            ws.close(1008, 'auth_timeout');
                        }
                    }, TIMEOUT * 1000);
                }

                ws.on('message', (rawMsg) => {
                    try {
                        const msg = JSON.parse(rawMsg.toString()) as RemoteMessage;

                        if (typeof msg !== 'object' || msg === null || !msg.op) {
                            this.sendError(ws, 'Invalid message format.');
                            return;
                        }

                        if (!ws.isAuthenticated && msg.op !== 'auth:identify') {
                            console.warn(`[RemoteServer] Unauthenticated client attempted to use ${msg.op}. Disconnecting.`);
                            this.sendError(ws, 'Authentication required as the very first message.');
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
                    if (ws.authTimeout) clearTimeout(ws.authTimeout);

                    if (ws.authToken) this.validTokens.delete(ws.authToken);
                });
            });

            this.httpServer.listen(this.port, () => {
                this.isRunning = true;
                console.log(`[RemoteServer] HTTP + WS Server listening on port ${this.port}`);
            });
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

        if (this.httpServer) {
            this.httpServer.close();
            this.httpServer = null;
        }

        this.validTokens.clear();
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

    public send(ws: WebSocket, msg: RemoteMessage) {
        ws.send(JSON.stringify(msg));
    }

    public sendError(ws: RemoteWebSocket, error: string) {
        this.send(ws, {
            op: 'error',
            success: false,
            error: error
        });
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

    public generateToken() {
        const token = generateUUID();
        this.validTokens.add(token);
        return token;
    }

    private _updateInternalCache(wsSettings: WebsocketSettings) {
        this.port = wsSettings.port;
        this.authEnabled = wsSettings.authEnabled;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async _handleCommand(ws: RemoteWebSocket, msg: RemoteMessage & { args?: any[] }) {
        if (settingsStore.get('debug')) console.log('[RemoteServer] Received:', msg);

        const event: RemoteEvent = {
            ws,
            nonce: msg.nonce,
            reply: (op: string, data: Record<string, unknown> = {}) => {
                this.send(ws, {op: op, ...data})
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

            this.sendError(ws, `Unknown command: ${msg.op}`);
        } catch (error) {
            console.error(`[RemoteServer] Error processing ${msg.op}:`, error);

            const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';

            if (remoteMain.getHandler(msg.op)) {
                ws.send(JSON.stringify({
                    op: `${msg.op}:response`,
                    nonce: msg.nonce,
                    success: false,
                    error: errorMessage
                }));
            } else {
                this.sendError(ws, `Error processing ${msg.op}`);
            }
        }
    }
}