import {app, BrowserWindow, ipcMain, net, protocol, shell, dialog} from 'electron';
import path from 'path';
import {Settings, SettingsData} from './utils/store/settings';
import {Profile, Profiles, SbButton, Song} from './utils/store/profiles';
import {search, getInfo, download, initYouTube, getStream} from './utils/youtube';
import {YouTubeVideo} from "play-dl";
import {parseFile} from "music-metadata";
import {generateUUID} from "./utils/utils";

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

let mainWindow: BrowserWindow | undefined;
let settingsStore: Settings;
let profilesStore: Profiles;

// TODO Add different preview output device

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
    settingsStore = new Settings(() => mainWindow.webContents.send('settings', settingsStore.get()));
    profilesStore = new Profiles(() => mainWindow.webContents.send('profiles', profilesStore.get()));

    const settings: SettingsData = settingsStore.get();
    const profiles: Profile[] = profilesStore.get();

    if (settings.active_profile == null || profiles.find(p => p.id === settings.active_profile) == null) {
        settings.active_profile = profiles[0].id;
        settingsStore.save();
    }

    if (settings.youtube_cookie === null || settings.youtube_cookie === '') {
        // TODO Ask for cookie
    }

    initYouTube(settings.youtube_cookie);

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

    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('ready', mainWindow.id, null, true);
        mainWindow.webContents.send('settings', settingsStore.get());
        mainWindow.webContents.send('profiles', profilesStore.get());
    });
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
        buttonSettings.webContents.send('settings', settingsStore.get());
        buttonSettings.webContents.send('profiles', profilesStore.get());
        buttonSettings.webContents.send('button', row, col);
    });

    buttonSettings.once('ready-to-show', () => {
        buttonSettings.show();
    });
}

const createMediaSelector = (parent: number, row: number, col: number) => {
    const mediaSelector = new BrowserWindow({
        modal: true,
        parent: getWindowById(parent),
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
        mediaSelector.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}/media_selector.html`);
    } else {
        mediaSelector.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/media_selector.html`));
    }

    mediaSelector.webContents.on('did-finish-load', () => {
        mediaSelector.webContents.send('ready', mediaSelector.id, parent, false);
        mediaSelector.webContents.send('settings', settingsStore.get());
        mediaSelector.webContents.send('profiles', profilesStore.get());
        if (row !== undefined && col !== undefined) mediaSelector.webContents.send('button', row, col);
    });

    mediaSelector.once('ready-to-show', () => {
        mediaSelector.show();
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

function saveButton(profile: string, button: SbButton): Profile[] {
    const profiles: Profile[] = profilesStore.get();
    const activeProfile = profiles.find(p => p.id === profile);

    if (activeProfile) {
        const index = activeProfile.buttons.findIndex(b => b.row === button.row && b.col === button.col);
        if (index === -1) activeProfile.buttons.push(button);
        else activeProfile.buttons[index] = button;

        profilesStore.set(profiles);
        profilesStore.save();
    }

    return profiles;
}

function downloadAndUpdateSoundboard(profile: string, button: SbButton) {
    download(button.song.title, button.song.id, button.song.original_url).then((filePath) => {
        button.song.uri = filePath;
        mainWindow.webContents.send('profiles', saveButton(profile, button));
    }).catch((e) => {
        console.error(e);
    });
}

// Navbar
ipcMain.on('minimize', (event: unknown, winId: number) => {
    const win = getWindowById(winId);
    if (win) win.minimize();
});

ipcMain.on('maximize', (event: unknown, winId: number) => {
    const win = getWindowById(winId);
    if (win) {
        if (!win.isResizable()) return;

        if (win.isMaximized()) win.restore();
        else win.maximize();
    }
});

ipcMain.on('close', (event: unknown, winId: number) => {
    const win = getWindowById(winId);
    if (win) win.close();
});

// Store
ipcMain.on('save_settings', (event: unknown, settings: SettingsData) => {
    settingsStore.set(settings);
    settingsStore.save();
});

ipcMain.on('save_profile', (event: unknown, profile: Profile) => {
    const profiles: Profile[] = profilesStore.get();
    const index = profiles.findIndex(p => p.id === profile.id);
    if (index !== -1) {
        profiles[index] = profile;
        profilesStore.set(profiles);
        profilesStore.save();
        mainWindow.webContents.send('profiles', profiles);
    }
});

ipcMain.on('save_button', async (event: unknown, profile: string, button: SbButton) => {
    const song = button.song;
    if (song.source === 'youtube') {
        if (song.uri === null) {
            try {
                song.uri = await getStream(song.original_url);
                downloadAndUpdateSoundboard(profile, button);
            } catch (e) {
                console.error(e.message);
            }
        }
    } else if (song.source === 'remote') {
        if (song.uri === null) {
            song.uri = song.original_url;
            // TODO Get media info
            // TODO Evaluated if download is needed
        }
    } else {
        const meta = await parseFile(song.uri);
        song.title = meta.common.title || path.basename(song.uri);
        song.duration = meta.format.duration * 1000 || 0;
        // TODO Get media info
    }

    button.song = song;

    mainWindow.webContents.send('profiles', saveButton(profile, button));
});

// Profiles
ipcMain.handle('create_profile', (event: unknown, name: string, rows: number, cols: number) => {
    const profile = {
        id: generateUUID(),
        name: name,
        rows: rows,
        cols: cols,
        buttons: [] as SbButton[]
    };

    const profiles: Profile[] = profilesStore.get();
    profiles.push(profile);
    profilesStore.set(profiles);
    profilesStore.save();
});

ipcMain.handle('rename_profile', (event: unknown, id: string, name: string) => {
    const profiles: Profile[] = profilesStore.get();
    const index = profiles.findIndex(p => p.id === id);
    if (index !== -1) {
        profiles[index].name = name;
        profilesStore.set(profiles);
        profilesStore.save();
    }
});

ipcMain.handle('delete_profile', (event: unknown, id: string) => {
    const profiles: Profile[] = profilesStore.get();
    const index = profiles.findIndex(p => p.id === id);
    if (index !== -1) {
        profiles.splice(index, 1);
        profilesStore.set(profiles);
        profilesStore.save();
    }
});

ipcMain.handle('import_profile', (event: unknown) => {
    // TODO Implement
});

ipcMain.on('export_profile', (event: unknown, id: string) => {
    // TODO Implement
});

ipcMain.on('export_profiles', (event: unknown) => {
    // TODO Implement
});

// Windows
ipcMain.on('open_media_selector_win', (event: unknown, row: number, col: number, winId: number) => createMediaSelector(winId, row, col));

ipcMain.on('open_button_settings_win', (event: unknown, row: number, col: number) => createButtonSettings(mainWindow.id, row, col));

// System
ipcMain.on('open_link', async (event: unknown, url: string) => shell.openExternal(url));

ipcMain.handle('open_file_media_selector', async () => {
    return await dialog.showOpenDialog({
        filters: [
            {name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg', 'flac']},
        ]
    });
});

// Audio
ipcMain.handle('search', (event: unknown, query: string) => search(query));

ipcMain.handle('get_video', (event: unknown, url: string) => getInfo(url));

ipcMain.handle('get_stream', (event: unknown, result: YouTubeVideo) => getStream(result.url));

ipcMain.handle('play_now', (event: unknown, song: Song) => mainWindow.webContents.send('play_now', song));

ipcMain.on('pause', () => mainWindow.webContents.send('pause'));

ipcMain.on('return_song', (event: unknown, song: Song, winId: number) => {
    const win = getWindowById(winId);
    if (win) win.getParentWindow().webContents.send('song', song);
});