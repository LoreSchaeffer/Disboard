import {app, BrowserWindow} from 'electron';
import {registerProtocols, setupProtocolHandlers} from "./main/protocol";
import {registerIpcHandlers} from "./main/ipc";
import {broadcastProfiles, broadcastSettings} from "./main/utils";
import {state} from "./main/state";
import {createMainWindow} from "./main/windows";
import {profilesStore, settingsStore} from "./main/utils/store";
import {generateUUID} from "./main/utils/utils";
import {MusicApi} from "./main/utils/music-api";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from '@ffmpeg-installer/ffmpeg';

// eslint-disable-next-line @typescript-eslint/no-require-imports
if (require('electron-squirrel-startup')) app.quit();

registerProtocols();

const initApp = async () => {
    // 1. Setup protocol handlers
    console.log('Setting up protocol handlers...');
    setupProtocolHandlers();

    // 2. Register IPC Handlers
    console.log('Registering IPC handlers...');
    registerIpcHandlers();

    // 3. Setup sore change listeners
    console.log('Setting up store listeners...');
    settingsStore.onDidAnyChange((newValue) => broadcastSettings(newValue));
    profilesStore.onDidAnyChange((newValue) => broadcastProfiles(newValue.profiles));

    // 4. Data validation / Initialization
    console.log('Validating data stores...');
    if (profilesStore.get('profiles').length === 0) {
        console.log('No profiles found, creating default profile...');
        profilesStore.set('store', [
            {
                id: generateUUID(),
                name: 'Default',
                rows: 8,
                cols: 10,
                buttons: []
            }
        ]);
    }

    if (!settingsStore.get('activeProfile') || !profilesStore.get('profiles').find(p => p.id === settingsStore.get('activeProfile'))) {
        console.log('Active profile not set or invalid, setting to first profile...');

        if (profilesStore.get('profiles').length > 0) {
            console.log(`Setting active profile to: ${profilesStore.get('profiles')[0].name}`);
            settingsStore.set('activeProfile', profilesStore.get('profiles')[0].id);
        } else {
            console.error('No profile found');
        }
    }

    // 5. Initialize Music API
    const musicApiEndpoint = settingsStore.get('musicApi');
    const musicApiCredentials = settingsStore.get('musicApiCredentials');
    if (musicApiEndpoint && musicApiCredentials && musicApiCredentials.clientId && musicApiCredentials.clientSecret) {
        console.log('Initializing Music API...');
        setTimeout(() => state.musicApi = new MusicApi(musicApiEndpoint, musicApiCredentials), 0);
    } else {
        console.log('Music API not configured.');
    }

    // 6. Init FFMpeg
    console.log('Initializing FFMpeg...');
    ffmpeg.setFfmpegPath(ffmpegPath.path.replace('app.asar', 'app.asar.unpacked'));

    // 7. Launch main window
    console.log('Launching renderer...');
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

