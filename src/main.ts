import {app, BrowserWindow} from 'electron';
import {registerProtocols, setupProtocolHandlers} from "./main/protocol";
import {registerIpcHandlers} from "./main/ipc";
import {broadcastProfiles, broadcastSettings} from "./main/utils";
import {state} from "./main/state";
import {createMainWindow, createMediaSelectorWindow} from "./main/windows";
import {profilesStore, settingsStore} from "./main/utils/store";
import {generateUUID} from "./main/utils/utils";
import {MusicApi} from "./main/utils/music-api";

// eslint-disable-next-line @typescript-eslint/no-require-imports
if (require('electron-squirrel-startup')) app.quit();

registerProtocols();

const initApp = async () => {
    // 1. Setup protocol handlers
    setupProtocolHandlers();

    // 2. Register IPC Handlers
    registerIpcHandlers();

    // 3. Setup sore change listeners
    settingsStore.onDidAnyChange((newValue) => broadcastSettings(newValue));
    profilesStore.onDidAnyChange((newValue) => broadcastProfiles(newValue.profiles));

    // 4. Data validation / Initialization
    if (profilesStore.get('profiles').length === 0) {
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
        if (profilesStore.get('profiles').length > 0) {
            settingsStore.set('activeProfile', profilesStore.get('profiles')[0].id);
        } else {
            console.error('No profile found');
        }
    }

    // 5. Initialize Music API
    const musicApiEndpoint = settingsStore.get('musicApi');
    const musicApiCredentials = settingsStore.get('musicApiCredentials');
    if (musicApiEndpoint && musicApiCredentials.clientId && musicApiCredentials.clientSecret) {
        console.log('Initializing Music API...');
        setTimeout(() => state.musicApi = new MusicApi(musicApiEndpoint, musicApiCredentials), 0);
    }

    // 6. Launch main window
    // createMainWindow();

    // TODO Only for development purposes
    //createButtonSettings(settingsStore.get('activeProfile'), generateButtonId(0, 0));
    createMediaSelectorWindow('play_now');
};

// Lifecycle events

app.whenReady().then(initApp);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});

