import {app, BrowserWindow, ipcMain, net, protocol} from 'electron';
import path from 'path';
import {Settings, SettingsData} from './utils/store/settings';
import {Profile, Profiles} from './utils/store/profiles';
import {search, download, initYouTube} from './utils/youtube';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

let mainWindow: BrowserWindow | undefined;
let settingsStore: Settings;
let profilesStore: Profiles;

// TODO Missing disabled buttons
// TODO Missing disabled inputs
// TODO Font size
// TODO Movable buttons

if (require('electron-squirrel-startup')) {
    app.quit();
}

protocol.registerSchemesAsPrivileged([
    {
        scheme: 'dftp',
        privileges: {
            secure: true,
            standard: true,
            bypassCSP: true,
            stream: true,
            supportFetchAPI: true,
        }
    }
]);

const start = () => {
    initYouTube();

    settingsStore = new Settings(() => mainWindow.webContents.send('settings', settingsStore.get()));
    profilesStore = new Profiles(() => mainWindow.webContents.send('profiles', profilesStore.get()));

    const settings: SettingsData = settingsStore.get();
    const profiles: Profile[] = profilesStore.get();

    if (settings.active_profile == null || profiles.find(p => p.id === settings.active_profile) == null) {
        settings.active_profile = profiles[0].id;
        settingsStore.save();
    }

    createMainWindow();
};

const createMainWindow = () => {
    mainWindow = new BrowserWindow({
        icon: path.join('icons', 'icon.png'),
        width: settingsStore.get().width,
        height: settingsStore.get().height,
        minWidth: 1080,
        minHeight: 608,
        frame: false,
        titleBarStyle: 'hidden',
        autoHideMenuBar: true,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
        mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
    }

    mainWindow.webContents.on('did-finish-load', () => mainWindow.webContents.send('ready', mainWindow.id, null, true));
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('resize', () => {
        const size = mainWindow.getSize();
        settingsStore.get().width = size[0];
        settingsStore.get().height = size[1];
        settingsStore.save();
        mainWindow.webContents.send('settings', settingsStore.get());
    });
};

const createButtonSettings = (parent: number, row: number, col: number) => {
    const buttonSettings = new BrowserWindow({
        modal: true,
        parent: mainWindow,
        icon: path.join('icons', 'icon.png'),
        width: 500,
        height: 600,
        resizable: false,
        frame: false,
        titleBarStyle: 'hidden',
        autoHideMenuBar: true,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        buttonSettings.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}/button_settings.html`);
    } else {
        buttonSettings.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/button_settings.html`));
    }

    buttonSettings.webContents.on('did-finish-load', () => {
        buttonSettings.webContents.send('ready', buttonSettings.id, parent, false);
        buttonSettings.webContents.send('button', row, col);
    });

    buttonSettings.once('ready-to-show', () => {
        buttonSettings.show();
    });
}

app.on('ready', start);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});

app.whenReady().then(() => {
    protocol.handle('dftp', (request) => {
        try {
            const filePath = decodeURIComponent(request.url.slice('dftp://file/'.length));
            return net.fetch(filePath);
        } catch (e) {
            return new Response('File not found', {status: 404});
        }
    });
});

function getWindowById(winId: number) {
    return BrowserWindow.fromId(winId);
}

// Navbar
ipcMain.on('minimize', (event: any, winId: number) => {
    const win = getWindowById(winId);
    if (win) win.minimize();
});

ipcMain.on('maximize', (event: any, winId: number) => {
    const win = getWindowById(winId);
    if (win) {
        if (!win.isResizable()) return;

        if (win.isMaximized()) win.restore();
        else win.maximize();
    }
});

ipcMain.on('close', (event: any, winId: number) => {
    const win = getWindowById(winId);
    if (win) win.close();
});

// Store
ipcMain.handle('get_settings', () => settingsStore.get());

ipcMain.handle('get_profiles', () => profilesStore.get());

ipcMain.on('save_settings', (event: any, settings: SettingsData) => {
    settingsStore.set(settings);
    settingsStore.save();
});

ipcMain.on('save_button', (event: any, profile: string, button: any) => {
    const profiles: Profile[] = profilesStore.get();

    const activeProfile = profiles.find(p => p.id === profile);
    if (activeProfile) {
        const index = activeProfile.buttons.findIndex(b => b.row === button.row && b.col === button.col);
        if (index === -1) activeProfile.buttons.push(button);
        else activeProfile.buttons[index] = button;
        profilesStore.set(profiles);
        profilesStore.save();
    }

    mainWindow.webContents.send('profiles', profiles);
});

// Windows
ipcMain.on('open_button_settings_win', (event: any, row: number, col: number) => {
    createButtonSettings(mainWindow.id, row, col);
});

// Audio
ipcMain.handle('search', (event: any, query: string) => search(query));