import {app, BrowserWindow, dialog, ipcMain, protocol, shell} from 'electron';
import path from 'path';
// eslint-disable-next-line import/no-unresolved
import {parseFile} from "music-metadata";
import fs from "fs";
import {ChildProcessWithoutNullStreams, spawn} from "child_process";
import {Store} from "./utils/store";
import {Profile, SbButton, Settings} from "./types/storage";
import {getInfo, getStream, initYouTube, search} from "./utils/youtube";
import {WindowOptions} from "./types/types";
import {Track} from "./types/track";
import {generateUUID} from "./utils/utils";
import IpcMainInvokeEvent = Electron.IpcMainInvokeEvent;

declare module 'electron' {
    interface BrowserWindow {
        options: WindowOptions;
    }
}

export const root = app.getPath('userData');
export const media = path.join(root, 'media');

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

let mainWindow: BrowserWindow | undefined;
let settings: Store<Settings>;
let profiles: Store<Profile[]>;
let epidemiology: ChildProcessWithoutNullStreams;

// High priority
// TODO Remove :root from css modules and move them like in TrackInfo.module.css
// TODO Add localization
// TODO Add optional validation in input fields
// TODO Many handle in main.ts do not have a return
// TODO Ask for YouTube cookie on first run
// TODO Move createNewProfile and settings to the mainWindow
// TODO App settings

// Mid priority
// TODO Discord bot
// TODO Add different preview output device
// TODO Register media buttons hook
// TODO Queues
// TODO Process priority
// TODO Download missing files

// Low priority
// TODO Redownload media when importing profiles
// TODO Try to redownload file if missing

// eslint-disable-next-line @typescript-eslint/no-require-imports
if (require('electron-squirrel-startup')) {
    app.quit();
}

// Register custom protocol for file access. This is used to access files on the local filesystem
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

/* ======== Initialization ======== */

const start = () => {
    settings = new Store('settings', {
        defValue: {
            width: 1366,
            height: 768,
            volume: 50,
            preview_volume: 50,
            output_device: 'default',
            preview_output_device: 'default',
            repeat: 'none',
            soundboard_mode: 'normal',
            font_size: 11,
            show_images: true,
        },
        onChange: (store) => {
            mainWindow.webContents.send('settings', store);
        },
    });

    profiles = new Store('profiles', {
        defValue: [
            {
                id: generateUUID(),
                name: 'Default',
                rows: 8,
                cols: 10,
                buttons: []
            }
        ],
        onChange: (store) => {
            mainWindow.webContents.send('profiles', store);
        },
    });

    if (settings.get().active_profile == null || profiles.get().find(p => p.id === settings.get().active_profile) == null) {
        settings.get().active_profile = profiles.get()[0].id;
        settings.save();
    }

    if (settings.get().youtube_cookie == null || settings.get().youtube_cookie.trim() == '') {
        //TODO Ask for cookie
    }

    initYouTube(settings.get().youtube_cookie)

    createMainWindow();
};

const createWindow = (options: WindowOptions): BrowserWindow => {
    const customOnLoaded = options.onLoaded;

    options = {
        ...options,
        icon: path.join('icons', 'icon.png'),
        frame: false,
        titleBarStyle: 'hidden',
        autoHideMenuBar: true,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
        onLoaded: (win) => {
            if (customOnLoaded) customOnLoaded(win);
            console.log(`Window ${win.id} (${options.page}) loaded`);
        },
        onReady: (win) => {
            win.show();
            console.log(`Window ${win.id} (${options.page}) ready`);
        },
    }

    const win = new BrowserWindow(options);
    win.options = options;

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) win.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}/index.html`);
    else win.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));

    if (options.onLoaded) win.webContents.on('did-finish-load', () => options.onLoaded(win));
    if (options.onReady) win.once('ready-to-show', () => options.onReady(win));
    if (options.onResize) win.on('resize', () => options.onResize(win));
    if (settings.get().debug) win.webContents.openDevTools();

    return win;
}

const createMainWindow = () => {
    mainWindow = createWindow({
        page: 'main',
        width: settings.get().width,
        height: settings.get().height,
        minWidth: 1080,
        minHeight: 608,
        onResize: (win) => {
            const size = win.getSize();

            settings.get().width = size[0];
            settings.get().height = size[1];
            settings.save();

            win.webContents.send('settings', settings.get());
        }
    });
}

const createButtonSettings = (parent: number, row: number, col: number): BrowserWindow => {
    return createWindow({
        page: 'button_settings',
        modal: true,
        parent: mainWindow,
        width: 500,
        height: 600,
        resizable: false,
        onLoaded: (win) => {
            win.webContents.send('button', row, col);
        }
    });
}

const createMediaSelector = (parent: number, row: number, col: number) => {
    return createWindow({
        page: 'media_selector',
        modal: true,
        parent: BrowserWindow.fromId(parent),
        width: 500,
        height: 600,
        resizable: false,
        onLoaded: (win) => {
            if (row !== null && col !== null) win.webContents.send('button', row, col);
        }
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
        newProfile.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}/index.html?page=new_profile`);
    } else {
        newProfile.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html?page=new_profile`));
    }

    newProfile.webContents.on('did-finish-load', () => {
        newProfile.webContents.send('ready', newProfile.id, mainWindow.id, false);
        newProfile.webContents.send('settings', settings.get());
        newProfile.webContents.send('profiles', profiles.get());
    });

    newProfile.once('ready-to-show', () => {
        newProfile.show();
    });
}

/* ======== App Events ======== */

app.on('ready', start);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});

app.on('before-quit', () => {
    if (epidemiology) epidemiology.kill();
});

app.whenReady().then(() => {
    protocol.registerFileProtocol('dftp', (request, response) => {
        response({path: decodeURIComponent(request.url.slice('dftp://file/'.length))})
    });
});

/* ======== Utils ======== */

function saveButton(profile: string, button: SbButton) {
    const activeProfile = profiles.get().find(p => p.id === profile);
    if (!activeProfile) return;

    const index = activeProfile.buttons.findIndex(b => b.row === button.row && b.col === button.col);
    if (index === -1) activeProfile.buttons.push(button);
    else activeProfile.buttons[index] = button;

    profiles.save();
    profiles.notifyChange();
}

function deleteButton(profile: string, row: number, col: number) {
    const activeProfile = profiles.get().find(p => p.id === profile);
    if (!activeProfile) return;

    const index = activeProfile.buttons.findIndex(b => b.row === row && b.col === col);
    if (index === -1) return;

    activeProfile.buttons.splice(index, 1);

    profiles.save();
    profiles.notifyChange();
}

/* ======== Epidemiology ======== */

const runEpidemiology = () => {
    const jar = process.env.NODE_ENV === 'development'
        ? path.resolve(process.cwd(), 'resources', 'epidemiology.jar')
        : path.join(process.resourcesPath, 'epidemiology.jar');

    const epidemiologyRoot = path.join(app.getPath('userData'), 'epidemiology');
    const command: string[] = `java -jar ${jar} -c ${path.join(epidemiologyRoot, 'chrome')} -d ${path.join(epidemiologyRoot, 'data')} -o ${media}`.split(' ');

    epidemiology = spawn(command[0], command.slice(1), {
        detached: false,
        windowsHide: true
    });

    if (settings.get().debug) {
        epidemiology.stdout.on('data', (data) => {
            console.log(`[JOUT]: ${data}`);
        });

        epidemiology.stderr.on('data', (data) => {
            console.error(`[JERR]: ${data}`);
        });

        epidemiology.on('error', (err) => {
            console.error(`[JERR]:`, err);
        });
    }

    epidemiology.unref();
}

const stopEpidemiology = () => {
    if (epidemiology) {
        epidemiology.kill();
        epidemiology = undefined;
    }
}

/* ======== IPC Handlers ======== */

// Window
ipcMain.handle('get_window', (e: IpcMainInvokeEvent) => {
    const win = BrowserWindow.fromId(e.frameId) as BrowserWindow;
    if (!win) throw new Error('Could not find the window');

    return {
        parent: win.options.parent ? win.options.parent.id : null,
        resizable: win.resizable,
        page: win.options.page,
    };
});

// Navbar
ipcMain.on('minimize', (e: IpcMainInvokeEvent) => {
    const win = BrowserWindow.fromId(e.frameId);
    if (win) win.minimize();
});

ipcMain.on('maximize', (e: IpcMainInvokeEvent) => {
    const win = BrowserWindow.fromId(e.frameId);
    if (!win || !win.isResizable()) return;

    if (win.isMaximized()) win.restore();
    else win.maximize();
});

ipcMain.on('close', (e: IpcMainInvokeEvent) => {
    const win = BrowserWindow.fromId(e.frameId);
    if (win) win.close();
});

// Store
ipcMain.handle('get_settings', () => {
    return settings.get();
});

ipcMain.on('save_settings', (_, newSettings: Settings) => {
    settings.set(newSettings);
    settings.save();
    settings.notifyChange();
});

ipcMain.on('save_profile', (_, newProfile: Profile) => {
    const index = profiles.get().findIndex(p => p.id === newProfile.id);
    if (index === -1) return;

    profiles.get()[index] = newProfile;
    profiles.save();
    profiles.notifyChange();
});

ipcMain.on('save_button', async (_, profile: string, button: SbButton) => {
    const track = button.track;

    switch (track.source) {
        case 'youtube':
            if (track.uri === null) {
                try {
                    track.uri = await getStream(track.original_url);
                    // TODO Download and update soundboard (the gui should show the download progress, at the end the button should be updated with the new uri)
                } catch (e) {
                    console.error(e.message);
                }
            }
            break;
        case 'remote':
            if (track.uri === null) {
                track.uri = track.original_url;
                // TODO Get media info
                // TODO Evaluated if download is needed
            }
            break;
        case 'local':
        case 'epidemic': {
            const meta = await parseFile(track.uri);
            track.title = meta.common.title || path.basename(track.uri);
            track.duration = meta.format.duration * 1000 || 0;
            // TODO Get media info
            break;
        }
    }

    button.track = track;
    saveButton(profile, button);
});

ipcMain.on('delete_button', (_, profile: string, row: number, col: number) => {
    deleteButton(profile, row, col);
});

// Profiles
ipcMain.handle('get_profiles', () => profiles.get());

ipcMain.handle('create_profile', (_, name: string, rows: number, cols: number) => {
    const profile = {
        id: generateUUID(),
        name: name,
        rows: rows,
        cols: cols,
        buttons: [] as SbButton[]
    };

    profiles.get().push(profile);
    profiles.save();
    profiles.notifyChange();

    settings.get().active_profile = profile.id;
    settings.save();
    settings.notifyChange();
});

ipcMain.handle('rename_profile', (_, id: string, name: string) => {
    const index = profiles.get().findIndex(p => p.id === id);
    if (index === -1) return;

    profiles.get()[index].name = name;
    profiles.save();
    profiles.notifyChange();
});

ipcMain.handle('delete_profile', (_, id: string) => {
    const index = profiles.get().findIndex(p => p.id === id);
    if (index === -1) return;

    profiles.get().splice(index, 1);
    if (profiles.get().length === 0) {
        profiles.get().push({
            id: generateUUID(),
            name: 'Default',
            rows: 8,
            cols: 10,
            buttons: []
        });
    }

    profiles.save();
    profiles.notifyChange();

    if (settings.get().active_profile === id) {
        settings.get().active_profile = profiles.get()[0].id;
        settings.save();
        settings.notifyChange();
    }
});

ipcMain.handle('import_profile', async () => {
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

        const index = profiles.get().findIndex(p => p.id === profile.id);
        if (index !== -1) profiles.get()[index] = profile;
        else profiles.get().push(profile);

        profiles.save();
        profiles.notifyChange();
    } catch (e) {
        console.error(e.message);
    }
});

ipcMain.on('export_profile', async (_, id: string) => {
    const profile = profiles.get().find(p => p.id === id);
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

ipcMain.on('export_profiles', async () => {
    if (profiles.get().length === 0) return;

    try {
        const {filePaths} = await dialog.showOpenDialog({
            title: 'Export profiles',
            defaultPath: path.join(app.getPath('documents')),
            properties: ['openDirectory', 'createDirectory'],
        });

        if (!filePaths || filePaths.length === 0) return;

        const dirPath = filePaths[0];
        profiles.get().forEach(profile => {
            const filePath = path.join(dirPath, profile.name.replace(/[^a-z0-9]/gi, '_') + '.json');
            fs.writeFileSync(filePath, JSON.stringify(profile, null, 2));
        });
    } catch (e) {
        console.error(e.message);
    }
});

// Windows
ipcMain.on('open_media_selector_win', (_, row: number, col: number, winId: number) => createMediaSelector(winId, row, col));

ipcMain.on('open_button_settings_win', (_, row: number, col: number) => createButtonSettings(mainWindow.id, row, col));

ipcMain.on('open_new_profile_win', () => createNewProfile());

// System
ipcMain.on('open_link', async (_, url: string) => shell.openExternal(url));

ipcMain.handle('open_file_media_selector', async () => {
    return await dialog.showOpenDialog({
        filters: [
            {name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg', 'flac']},
        ]
    });
});

// Audio
ipcMain.handle('search', (_, query: string) => {
    return search(query)
});

ipcMain.handle('get_video', (_, url: string) => {
    return getInfo(url)
});

ipcMain.handle('get_stream', (_, url: string) => {
    return getStream(url)
});

ipcMain.on('play_now', async (_, track: Track) => {
    switch (track.source) {
        case 'youtube':
            if (track.uri === null) {
                try {
                    track.uri = await getStream(track.original_url);
                } catch (e) {
                    console.error(e.message);
                }
            }
            break;
        case 'remote':
            if (track.uri === null) {
                track.uri = track.original_url;
                // TODO Get media info
            }
            break;
        case 'local':
        case 'epidemic': {
            const meta = await parseFile(track.uri);
            track.title = meta.common.title || path.basename(track.uri);
            track.duration = Math.floor(meta.format.duration * 1000) || 0;
            break;
        }
    }

    mainWindow.webContents.send('play_now', track);
});

ipcMain.on('pause', () => mainWindow.webContents.send('pause'));

ipcMain.on('return_track', (_, track: Track, winId: number) => {
    const win = BrowserWindow.fromId(winId);
    if (win) win.getParentWindow().webContents.send('track', track);
});

// Misc
ipcMain.handle('get_file_separator', () => path.sep);