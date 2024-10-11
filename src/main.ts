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

    settingsStore = new Settings();
    profilesStore = new Profiles();

    const settings : SettingsData = settingsStore.get();
    const profiles : Profile[] = profilesStore.get();

    if (settings.active_profile == null || profiles.find(p => p.id === settings.active_profile) == null) {
        settings.active_profile = profiles[0].id;
        settingsStore.save();
    }

    createWindow();
};

const createWindow = () => {
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

    mainWindow.webContents.openDevTools();
};

app.on('ready', start);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
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

// Audio
ipcMain.handle('search', (event: any, query: string) => search(query));