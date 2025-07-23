import {app, BrowserWindow, dialog, ipcMain, protocol, shell} from 'electron';
import path from 'path';
import {Settings, SettingsData} from './utils/store/settings';
import {Profile, Profiles, SbButton, Song} from './utils/store/profiles';
import {download, getInfo, getStream, initYouTube, search} from './utils/youtube';
// eslint-disable-next-line import/no-unresolved
import {parseFile} from "music-metadata";
import {generateUUID} from "./utils/utils";
import fs from "fs";
import {Bot} from "./utils/discord";

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

let mainWindow: BrowserWindow | undefined;
let settingsStore: Settings;
let profilesStore: Profiles;
let discordBot: Bot;

// High priority
// TODO App settings

// Mid priority
// TODO Discord bot
// TODO Add different preview output device
// TODO Register media buttons hook
// TODO Queues
// TODO Process priority

// Low priority
// TODO Redownload media when importing profiles
// TODO Try to redownload file if missing

if (require('electron-squirrel-startup')) {
    app.quit();
}

protocol.registerSchemesAsPrivileged([
    {
        scheme: 'dftp',
        privileges: {
            secure: true,
            bypassCSP: true,
            stream: true
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

    //downloadMissingFiles();

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
        if (row !== null && col !== null) mediaSelector.webContents.send('button', row, col);
    });

    mediaSelector.once('ready-to-show', () => {
        mediaSelector.show();
    });
}

const createNewProfile = () => {
    const newProfile = new BrowserWindow({
        modal: true,
        parent: mainWindow,
        icon: path.join('icons', 'icon.png'),
        width: 350,
        height: 180,
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
        newProfile.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}/new_profile.html`);
    } else {
        newProfile.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/new_profile.html`));
    }

    newProfile.webContents.on('did-finish-load', () => {
        newProfile.webContents.send('ready', newProfile.id, mainWindow.id, false);
        newProfile.webContents.send('settings', settingsStore.get());
        newProfile.webContents.send('profiles', profilesStore.get());
    });

    newProfile.once('ready-to-show', () => {
        newProfile.show();
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
    protocol.registerFileProtocol('dftp', (request, response) => {
        response({path: decodeURIComponent(request.url.slice('dftp://file/'.length))})
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
        saveButton(profile, button);
        mainWindow.webContents.send('profiles', saveButton(profile, button));
    }).catch((e) => {
        console.error(e);
    });
}

function downloadMissingFiles() {
    const songs: Song[] = [];

    const profiles: Profile[] = profilesStore.get();
    profiles.forEach((profile) => {
        profile.buttons.forEach((button) => {
            if (button.song.source !== 'youtube') return;
            songs.push(button.song);
        });
    });

    const downloadMissing = async (index: number) => {
        const song = songs[index];
        if (!song) return;
        
        await download(song.title, song.id, song.original_url)
            .then(async () => {
                await downloadMissing(index + 1);
            });
    }

    downloadMissing(0);
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

    settingsStore.get().active_profile = profile.id;
    settingsStore.save();

    mainWindow.webContents.send('profiles', profiles);
    mainWindow.webContents.send('settings', settingsStore.get());
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

    if (profiles.length === 1) return;

    const index = profiles.findIndex(p => p.id === id);
    if (index !== -1) {
        profiles.splice(index, 1);
        profilesStore.set(profiles);
        profilesStore.save();
    }

    if (settingsStore.get().active_profile === id) {
        settingsStore.get().active_profile = profiles[0].id;
        settingsStore.save();
        mainWindow.webContents.send('settings', settingsStore.get());
        mainWindow.webContents.send('profiles', profiles);
    }
});

ipcMain.handle('import_profile', async (event: unknown) => {
    try {
        const {filePaths} = await dialog.showOpenDialog({
            title: 'Import profile',
            defaultPath: app.getPath('documents'),
            filters: [
                {name: 'JSON', extensions: ['json']},
            ]
        });

        if (!filePaths || filePaths.length === 0) return;

        const profile = JSON.parse(fs.readFileSync(filePaths[0], 'utf-8')) as Profile;

        const profiles: Profile[] = profilesStore.get();
        profiles.push(profile);
        profilesStore.set(profiles);
        profilesStore.save();
        mainWindow.webContents.send('profiles', profiles);
    } catch (e) {
        console.error(e.message);
    }
});

ipcMain.on('export_profile', async (event: unknown, id: string) => {
    const profile = profilesStore.get().find(p => p.id === id);
    if (!profile) return;

    try {
        const filePath = await dialog.showSaveDialog({
            title: `Export profile ${profile.name}`,
            defaultPath: path.join(app.getPath('documents'), profile.name.replace(/[^a-z0-9]/gi, '_') + '.json'),
            filters: [
                {name: 'JSON', extensions: ['json']},
            ]
        });

        if (!filePath) return;

        fs.writeFileSync(filePath.filePath, JSON.stringify(profile, null, 2));
    } catch (e) {
        console.error(e.message);
    }
});

ipcMain.on('export_profiles', async (event: unknown) => {
    const profiles: Profile[] = profilesStore.get();
    if (profiles.length === 0) return;

    try {
        const {filePaths} = await dialog.showOpenDialog({
            title: 'Export profiles',
            defaultPath: path.join(app.getPath('documents')),
            properties: ['openDirectory', 'createDirectory'],
        });

        if (!filePaths || filePaths.length === 0) return;

        const dirPath = filePaths[0];
        profiles.forEach(profile => {
            const filePath = path.join(dirPath, profile.name.replace(/[^a-z0-9]/gi, '_') + '.json');
            fs.writeFileSync(filePath, JSON.stringify(profile, null, 2));
        });
    } catch (e) {
        console.error(e.message);
    }
});

// Windows
ipcMain.on('open_media_selector_win', (event: unknown, row: number, col: number, winId: number) => createMediaSelector(winId, row, col));

ipcMain.on('open_button_settings_win', (event: unknown, row: number, col: number) => createButtonSettings(mainWindow.id, row, col));

ipcMain.on('open_new_profile_win', () => createNewProfile());

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
ipcMain.handle('search', (event: unknown, query: string) => {
    return search(query)
});

ipcMain.handle('get_video', (event: unknown, url: string) => {
    return getInfo(url)
});

ipcMain.handle('get_stream', (event: unknown, url: string) => {
    return getStream(url)
});

ipcMain.on('play_now', async (event: unknown, song: Song) => {
    if (song.source === 'youtube') {
        if (song.uri === null) {
            try {
                song.uri = await getStream(song.original_url);
            } catch (e) {
                console.error(e.message);
            }
        }
    } else if (song.source === 'remote') {
        if (song.uri === null) {
            song.uri = song.original_url;
            // TODO Get media info
        }
    } else {
        const meta = await parseFile(song.uri);
        song.title = meta.common.title || song.title;
        song.duration = Math.floor(meta.format.duration * 1000) || 0;
    }

    mainWindow.webContents.send('play_now', song);
});

ipcMain.on('pause', () => mainWindow.webContents.send('pause'));

ipcMain.on('return_song', (event: unknown, song: Song, winId: number) => {
    const win = getWindowById(winId);
    if (win) win.getParentWindow().webContents.send('song', song);
});

// Misc
ipcMain.handle('get_file_separator', () => path.sep);