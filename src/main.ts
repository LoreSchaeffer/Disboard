import {app, BrowserWindow, session} from 'electron';
import {registerProtocols, setupProtocolHandlers} from "./main/protocol";
import {registerIpcHandlers} from "./main/ipc";
import {state} from "./main/state";
import {fixActiveProfile, setAppPriority} from "./main/utils/misc";
import {MusicApi} from "./main/utils/music-api";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import {DiscordBot} from "./main/utils/discord-bot";
import {settingsStore} from "./main/storage/settings-store";
import {createBoardWin} from "./main/windows";
import {BoardType} from "./types";
import {setupLogger} from "./main/utils/logger";
import {fixMissingTracks} from "./main/utils/downloads";
import {RemoteServer} from "./main/utils/remote/remote-server";
import {registerRemoteServerHandlers} from "./main/utils/remote/rsc";

registerProtocols();

const setupCorsHandler = () => {
    const filter = {
        urls: ['http://*/*', 'https://*/*']
    };

    session.defaultSession.webRequest.onHeadersReceived(filter, (details, callback) => {
        const {responseHeaders} = details;
        if (responseHeaders) {
            responseHeaders['Access-Control-Allow-Origin'] = ['*'];
            responseHeaders['Access-Control-Allow-Headers'] = ['*'];
            responseHeaders['Access-Control-Allow-Methods'] = ['GET, HEAD, OPTIONS'];
        }

        callback({
            responseHeaders,
            statusLine: details.statusLine
        });
    });
};

const initApp = async () => {
    setupLogger();

    console.log('[Main] Running initialization sequence...');
    setAppPriority();

    setupCorsHandler();

    // 1. Setup protocol handlers
    console.log('[Main] Setting up protocol handlers...');
    setupProtocolHandlers();

    // 2. Register IPC Handlers
    console.log('[Main] Registering IPC handlers...');
    registerIpcHandlers();

    // 3. Data validation / Initialization
    console.log('[Main] Validating data stores...');
    fixActiveProfile('music');
    fixActiveProfile('sfx');
    fixActiveProfile('ambient');

    // 4. Initialize Music API
    const musicApiEndpoint = settingsStore.get('musicApi');
    const musicApiCredentials = settingsStore.get('musicApiCredentials');
    if (musicApiEndpoint && musicApiCredentials && musicApiCredentials.clientId && musicApiCredentials.clientSecret) {
        console.log('[Main] Initializing Music API...');
        state.musicApi = new MusicApi(musicApiEndpoint, musicApiCredentials);
    } else {
        console.log('[Main] Music API not configured.');
    }

    // 5. Init FFMpeg
    console.log('[Main] Initializing FFMpeg...');
    ffmpeg.setFfmpegPath(ffmpegPath.path.replace('app.asar', 'app.asar.unpacked'));

    // 6. Init discord
    state.discordBot = new DiscordBot();
    state.discordBot.init();

    // 7. Init Remote Server
    registerRemoteServerHandlers();
    state.remoteServer = new RemoteServer();
    state.remoteServer.init();

    // 8. Launch board
    console.log('[Main] Launching renderer...');
    const startupBoards: BoardType[] = settingsStore.get('openOnStartup') || ['music'];
    const boardsToOpen: BoardType[] = startupBoards.length > 0 ? startupBoards : ['music'];
    boardsToOpen.forEach(boardType => {
        console.log(`[Main] Opening ${boardType} board on startup...`);
        createBoardWin(boardType);
    });

    // 9. Fix missing tracks
    fixMissingTracks().catch(e => {
        console.error('[Main] Critical error during background track fix:', e);
    });
};

// Lifecycle events

app.whenReady().then(initApp);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        const startupBoards: BoardType[] = settingsStore.get('openOnStartup') || ['music'];
        const boardsToOpen: BoardType[] = startupBoards.length > 0 ? startupBoards : ['music'];
        boardsToOpen.forEach(board => createBoardWin(board));
    }
});

app.on('will-quit', async () => {
    if (state.discordBot) state.discordBot.disconnect();
});