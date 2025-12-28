// eslint-disable-next-line import/no-unresolved
import {app, BrowserWindow, ipcMain, IpcMainInvokeEvent, net, protocol} from 'electron';
import path from 'path';
import {pathToFileURL} from 'url';
import {generateUUID} from "./utils/utils";
import {WindowOptions} from "./types/window";
import {profilesStore, settingsStore} from "./utils/store";
import {WindowInfo} from "./types/common";
import {Settings} from "./types/settings";
import {Profile, SbButton} from "./types/profiles";

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

// Extend the Electron BrowserWindow interface to include custom options
declare module 'electron' {
    interface BrowserWindow {
        options: WindowOptions;
    }
}

// Global constants
export const root = app.getPath('userData');
export const audioDir = path.join(root, 'audio');
export const imagesDir = path.join(root, 'images');

// Global state variables
let mainWindow: BrowserWindow | undefined;

// eslint-disable-next-line @typescript-eslint/no-require-imports
if (require('electron-squirrel-startup')) app.quit();

/**
 * =============================================================================
 * PROTOCOL REGISTRATION
 * =============================================================================
 * Registers the 'music' scheme as privileged.
 * This allows fetching local resources with high performance and streaming support.
 */
protocol.registerSchemesAsPrivileged([
    {
        scheme: 'music',
        privileges: {
            secure: true,
            standard: true,
            supportFetchAPI: true,
            stream: true,
            bypassCSP: false,
            corsEnabled: true
        }
    }
]);

/**
 * =============================================================================
 * HELPER FUNCTIONS
 * =============================================================================
 */

const loadWindowUrl = (win: BrowserWindow, pageName: string, queryParams: string = '') => {
    const search = pageName !== 'main' ? `?page=${pageName}${queryParams}` : queryParams;
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) win.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}/index.html${search}`);
    else win.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`), {search: search});
};

const createWindow = (options: WindowOptions): BrowserWindow => {
    const customOnLoaded = options.onLoaded;

    const browserOptions: Electron.BrowserWindowConstructorOptions = {
        width: options.width || 1080,
        height: options.height || 608,
        minWidth: options.minWidth,
        minHeight: options.minHeight,
        x: options.x,
        y: options.y,
        resizable: options.resizable ?? true,
        modal: options.modal,
        parent: options.parent,
        icon: path.join(__dirname, '../../icons/icon.png'),
        frame: false,
        titleBarStyle: 'hidden',
        autoHideMenuBar: true,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
            webSecurity: true
        },
    };

    const win = new BrowserWindow(browserOptions);
    win.options = options;

    const pageName = options.page || 'main';
    loadWindowUrl(win, pageName);

    win.webContents.on('did-finish-load', () => {
        if (customOnLoaded) customOnLoaded(win);
    });

    win.once('ready-to-show', () => {
        if (options.onReady) options.onReady(win);
        else win.show();
    });

    if (options.onResize) win.on('resize', () => options.onResize!(win));
    if (settingsStore.get('debug')) win.webContents.openDevTools({mode: 'detach'});

    return win;
}

const handleMusicRequest = async (request: Request): Promise<Response> => {
    try {
        const parsedUrl = new URL(request.url);
        const type = parsedUrl.hostname;
        const resName = decodeURIComponent(parsedUrl.pathname.slice(1));

        let targetPath = '';
        if (type === 'audio') {
            targetPath = path.join(audioDir, `${resName}.mp3`);
        } else if (type === 'images') {
            targetPath = path.join(imagesDir, `${resName}.jpg`);
        } else {
            return new Response('Invalid resource type', {status: 400});
        }

        return net.fetch(pathToFileURL(targetPath).toString())
    } catch {
        return new Response('File not found', {status: 404});
    }
}

/**
 * =============================================================================
 * WINDOWS FUNCTIONS
 * =============================================================================
 */

let resizeTimeout: NodeJS.Timeout;
const createMainWindow = () => {
    mainWindow = createWindow({
        page: 'main',
        width: settingsStore.get('width'),
        height: settingsStore.get('height'),
        minWidth: 1080,
        minHeight: 608,
        onResize: (win) => {
            clearTimeout(resizeTimeout);

            resizeTimeout = setTimeout(() => {
                const size = win.getSize();
                settingsStore.set('width', size[0]);
                settingsStore.set('height', size[1]);
                win.webContents.send('settings', settingsStore.store);
            }, 250);
        }
    });
}

const createButtonSettings = (_: number, row: number, col: number): BrowserWindow => {
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

/**
 * =============================================================================
 * APP INITIALIZATION LOGIC
 * =============================================================================
 */

const initApp = async () => {
    // 1. Setup custom protocol handler
    protocol.handle('music', handleMusicRequest);

    // 2. Stores listeners
    settingsStore.onDidAnyChange((newValue) => {
        broadcastSettings(newValue);
    });

    profilesStore.onDidAnyChange((newValue) => {
        broadcastProfiles(newValue.profiles);
    });

    // 3. Data validation
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

    // 4. Launch main window
    createMainWindow();
};

/**
 * =============================================================================
 * ELECTRON LIFECYCLE EVENTS
 * =============================================================================
 */


app.whenReady().then(initApp);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});

/**
 * =============================================================================
 * UTILS FUNCTIONS
 * =============================================================================
 */

const broadcastSettings = (settings: Settings) => {
    BrowserWindow.getAllWindows().forEach(win => {
        if (!win.isDestroyed()) win.webContents.send('settings', settings);
    });
}

const broadcastProfiles = (profiles: Profile[]) => {
    BrowserWindow.getAllWindows().forEach(win => {
        if (!win.isDestroyed()) win.webContents.send('profiles', profiles);
    });
}

const saveButton = (profile: string, button: SbButton) => {
    const profiles = profilesStore.get('profiles');
    const activeProfile = profiles.find(p => p.id === profile);
    if (!activeProfile) return;

    const index = activeProfile.buttons.findIndex(b => b.row === button.row && b.col === button.col);
    if (index === -1) activeProfile.buttons.push(button);
    else activeProfile.buttons[index] = button;

    profilesStore.set('profiles', profiles);
}

const deleteButton = (profile: string, row: number, col: number) => {
    const profiles = profilesStore.get('profiles');
    const activeProfile = profiles.find(p => p.id === profile);
    if (!activeProfile) return;

    const index = activeProfile.buttons.findIndex(b => b.row === row && b.col === col);
    if (index === -1) return;
    activeProfile.buttons.splice(index, 1);

    profilesStore.set('profiles', profiles);
}

/**
 * =============================================================================
 * IPC HANDLERS
 * =============================================================================
 */

// Window

ipcMain.handle('get_window', (e: IpcMainInvokeEvent): WindowInfo => {
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

ipcMain.handle('get_settings', (): Settings => {
    return settingsStore.store;
});

ipcMain.on('save_settings', (_, newSettings: Settings) => {
    settingsStore.set(newSettings);
    broadcastSettings(newSettings);
});

// Profiles

ipcMain.handle('get_profiles', (): Profile[] => profilesStore.get('profiles'));

// ipcMain.on('save_profile', (_, newProfile: Profile) => {
//     const index = profiles.get().findIndex(p => p.id === newProfile.id);
//     if (index === -1) return;
//
//     profiles.get()[index] = newProfile;
//     profiles.save();
//     profiles.notifyChange();
// });

// ipcMain.on('save_button', async (_, profile: string, button: SbButton) => {
//     const track = button.track;
//
//     switch (track.source) {
//         case 'youtube':
//             if (track.uri === null) {
//                 try {
//                     track.uri = await getStream(track.original_url);
//                     // TODO Download and update soundboard (the gui should show the download progress, at the end the button should be updated with the new uri)
//                 } catch (e) {
//                     console.error(e.message);
//                 }
//             }
//             break;
//         case 'remote':
//             if (track.uri === null) {
//                 track.uri = track.original_url;
//                 // TODO Get media info
//                 // TODO Evaluated if download is needed
//             }
//             break;
//         case 'local':
//         case 'epidemic': {
//             const meta = await parseFile(track.uri);
//             track.title = meta.common.title || path.basename(track.uri);
//             track.duration = meta.format.duration * 1000 || 0;
//             // TODO Get media info
//             break;
//         }
//     }
//
//     button.track = track;
//     saveButton(profile, button);
// });

// ipcMain.on('delete_button', (_, profile: string, row: number, col: number) => {
//     deleteButton(profile, row, col);
// });

// ipcMain.handle('create_profile', (_, name: string, rows: number, cols: number) => {
//     const profile = {
//         id: generateUUID(),
//         name: name,
//         rows: rows,
//         cols: cols,
//         buttons: [] as SbButton[]
//     };
//
//     profiles.get().push(profile);
//     profiles.save();
//     profiles.notifyChange();
//
//     settings.get().activeProfile = profile.id;
//     settings.save();
//     settings.notifyChange();
// });

// ipcMain.handle('rename_profile', (_, id: string, name: string) => {
//     const index = profiles.get().findIndex(p => p.id === id);
//     if (index === -1) return;
//
//     profiles.get()[index].name = name;
//     profiles.save();
//     profiles.notifyChange();
// });

// ipcMain.handle('delete_profile', (_, id: string) => {
//     const index = profiles.get().findIndex(p => p.id === id);
//     if (index === -1) return;
//
//     profiles.get().splice(index, 1);
//     if (profiles.get().length === 0) {
//         profiles.get().push({
//             id: generateUUID(),
//             name: 'Default',
//             rows: 8,
//             cols: 10,
//             buttons: []
//         });
//     }
//
//     profiles.save();
//     profiles.notifyChange();
//
//     if (settings.get().activeProfile === id) {
//         settings.get().activeProfile = profiles.get()[0].id;
//         settings.save();
//         settings.notifyChange();
//     }
// });

// ipcMain.handle('import_profile', async () => {
//     try {
//         const {filePaths} = await dialog.showOpenDialog({
//             title: 'Import profile',
//             defaultPath: app.getPath('documents'),
//             filters: [
//                 {name: 'JSON', extensions: ['json']},
//             ]
//         });
//
//         if (!filePaths || filePaths.length === 0) return;
//
//         const profile = JSON.parse(fs.readFileSync(filePaths[0], 'utf-8')) as Profile;
//
//         const index = profiles.get().findIndex(p => p.id === profile.id);
//         if (index !== -1) profiles.get()[index] = profile;
//         else profiles.get().push(profile);
//
//         profiles.save();
//         profiles.notifyChange();
//     } catch (e) {
//         console.error(e.message);
//     }
// });

// ipcMain.on('export_profile', async (_, id: string) => {
//     const profile = profiles.get().find(p => p.id === id);
//     if (!profile) return;
//
//     try {
//         const filePath = await dialog.showSaveDialog({
//             title: `Export profile ${profile.name}`,
//             defaultPath: path.join(app.getPath('documents'), profile.name.replace(/[^a-z0-9]/gi, '_') + '.json'),
//             filters: [
//                 {name: 'JSON', extensions: ['json']},
//             ]
//         });
//
//         if (!filePath) return;
//
//         fs.writeFileSync(filePath.filePath, JSON.stringify(profile, null, 2));
//     } catch (e) {
//         console.error(e.message);
//     }
// });

// ipcMain.on('export_profiles', async () => {
//     if (profiles.get().length === 0) return;
//
//     try {
//         const {filePaths} = await dialog.showOpenDialog({
//             title: 'Export profiles',
//             defaultPath: path.join(app.getPath('documents')),
//             properties: ['openDirectory', 'createDirectory'],
//         });
//
//         if (!filePaths || filePaths.length === 0) return;
//
//         const dirPath = filePaths[0];
//         profiles.get().forEach(profile => {
//             const filePath = path.join(dirPath, profile.name.replace(/[^a-z0-9]/gi, '_') + '.json');
//             fs.writeFileSync(filePath, JSON.stringify(profile, null, 2));
//         });
//     } catch (e) {
//         console.error(e.message);
//     }
// });

// Windows
// ipcMain.on('open_media_selector_win', (_, row: number, col: number, winId: number) => createMediaSelector(winId, row, col));

// ipcMain.on('open_button_settings_win', (_, row: number, col: number) => createButtonSettings(mainWindow.id, row, col));

// ipcMain.on('open_new_profile_win', () => createNewProfile());

// System
// ipcMain.on('open_link', async (_, url: string) => shell.openExternal(url));

// ipcMain.handle('open_file_media_selector', async () => {
//     return await dialog.showOpenDialog({
//         filters: [
//             {name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg', 'flac']},
//         ]
//     });
// });

// Audio

// ipcMain.handle('search', (_, query: string) => {
//     return search(query)
// });

// ipcMain.handle('get_video', (_, url: string) => {
//     return getInfo(url)
// });

// ipcMain.handle('get_stream', (_, url: string) => {
//     return getStream(url)
// });

// ipcMain.on('play_now', async (_, track: Track) => {
//     switch (track.source) {
//         case 'youtube':
//             if (track.uri === null) {
//                 try {
//                     track.uri = await getStream(track.original_url);
//                 } catch (e) {
//                     console.error(e.message);
//                 }
//             }
//             break;
//         case 'remote':
//             if (track.uri === null) {
//                 track.uri = track.original_url;
//                 // TODO Get media info
//             }
//             break;
//         case 'local':
//         case 'epidemic': {
//             const meta = await parseFile(track.uri);
//             track.title = meta.common.title || path.basename(track.uri);
//             track.duration = Math.floor(meta.format.duration * 1000) || 0;
//             break;
//         }
//     }
//
//     mainWindow.webContents.send('play_now', track);
// });

// ipcMain.on('pause', () => mainWindow.webContents.send('pause'));

// ipcMain.on('return_track', (_, track: Track, winId: number) => {
//     const win = BrowserWindow.fromId(winId);
//     if (win) win.getParentWindow().webContents.send('track', track);
// });

// Misc

// ipcMain.handle('get_file_separator', () => path.sep);