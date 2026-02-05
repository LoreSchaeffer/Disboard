import {app, BrowserWindow, session} from 'electron';
import {registerProtocols, setupProtocolHandlers} from "./main/protocol";
import {registerIpcHandlers} from "./main/ipc";
import {broadcastProfiles, broadcastSettings, fixActiveProfile} from "./main/utils";
import {state} from "./main/state";
import {createMainWindow} from "./main/windows";
import {profilesStore, settingsStore} from "./main/utils/store";
import {generateUUID, setAppPriority} from "./main/utils/utils";
import {MusicApi} from "./main/utils/music-api";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import {DiscordBot} from "./main/utils/discord-bot";

// eslint-disable-next-line @typescript-eslint/no-require-imports
if (require('electron-squirrel-startup')) app.quit();

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
    fixActiveProfile();

    // 4. Initialize Music API
    const musicApiEndpoint = settingsStore.get('musicApi');
    const musicApiCredentials = settingsStore.get('musicApiCredentials');
    if (musicApiEndpoint && musicApiCredentials && musicApiCredentials.clientId && musicApiCredentials.clientSecret) {
        console.log('[Main] Initializing Music API...');
        setTimeout(() => state.musicApi = new MusicApi(musicApiEndpoint, musicApiCredentials), 0);
    } else {
        console.log('[Main] Music API not configured.');
    }

    // 5. Init FFMpeg
    console.log('[Main] Initializing FFMpeg...');
    ffmpeg.setFfmpegPath(ffmpegPath.path.replace('app.asar', 'app.asar.unpacked'));

    // 6. Init discord
    state.discordBot = new DiscordBot();
    state.discordBot.init();

    // 7. Launch main window
    console.log('[Main] Launching renderer...');
    createMainWindow();
};

// Lifecycle events

app.whenReady().then(initApp);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});

app.on('will-quit', async () => {
    if (state.discordBot) state.discordBot.disconnect();
});
