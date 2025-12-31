// eslint-disable-next-line import/no-unresolved
import {app, BrowserWindow, dialog, ipcMain, IpcMainInvokeEvent, net, protocol, shell} from 'electron';
import path from 'path';
import {pathToFileURL} from 'url';
import {clamp, generateButtonId, generateUUID, getButtonPositionFromId, sanitizeButtons, validateProfileName} from "./utils/utils";
import {ButtonWindowData, WindowData, WindowId, WindowInfo, WindowOptions} from "./types/window";
import {cacheStore, profilesStore, settingsStore} from "./utils/store";
import {ButtonSettingsWin, IpcResponse, MediaSelectorWin} from "./types/common";
import {Settings} from "./types/settings";
import {Profile, SbButton} from "./types/profiles";
import * as fs from "node:fs";

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

// Global constants
export const root = app.getPath('userData');
export const audioDir = path.join(root, 'audio');
export const imagesDir = path.join(root, 'images');

// Global state variables
let mainWindow: BrowserWindow | undefined;
const winOptions = new Map<number, WindowOptions>();
const winData = new Map<number, WindowData<unknown>>();

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
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) win.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}/index.html${search}`).catch(e => console.log(`Failed to load URL: ${e}`));
    else win.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`), {search: search}).catch(e => console.log(`Failed to load file: ${e}`));
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
    winOptions.set(win.id, options);

    if (options.data) winData.set(win.id, options.data);

    const pageName = options.page || 'main';
    loadWindowUrl(win, pageName);

    win.webContents.on('did-finish-load', () => {
        if (customOnLoaded) customOnLoaded(win);
    });

    win.once('ready-to-show', () => {
        if (options.onReady) options.onReady(win);
        else win.show();
    });

    win.on('closed', () => {
        winOptions.delete(win.id);
        winData.delete(win.id);
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

// TODO Data should be updated manually from the main process when it's changed
const createButtonSettings = (profileId: string, buttonId: string): BrowserWindow => {
    return createWindow({
        page: 'button_settings',
        modal: true,
        parent: mainWindow,
        width: 500,
        height: 600,
        resizable: false,
        data: {
            type: 'button',
            data: {
                profileId: profileId,
                buttonId: buttonId
            } as ButtonWindowData
        }
    });
}

// TODO Update this to use new WindowData structure
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
    // createMainWindow();

    // TODO Only for development purposes
    createButtonSettings(settingsStore.get('activeProfile'), generateButtonId(0, 0));
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

/**
 * =============================================================================
 * IPC HANDLERS
 * =============================================================================
 */

// Window

ipcMain.handle('get_window', (e: IpcMainInvokeEvent): WindowInfo => {
    const win = BrowserWindow.fromWebContents(e.sender);
    if (!win) throw new Error('Could not find the window');

    const options = winOptions.get(win.id);
    if (!options) throw new Error('Could not find the window options');

    return {
        parent: options.parent ? options.parent.id : null,
        resizable: win.resizable,
        page: options.page,
        data: winData.get(win.id)
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

ipcMain.on('update_settings', (_, settings: Partial<Settings>) => {
    const currentSettings = settingsStore.store;
    const newSettings = {...currentSettings, ...settings};
    settingsStore.set(newSettings);
    broadcastSettings(newSettings);
});

// Profiles

ipcMain.handle('get_profiles', (): Profile[] => profilesStore.get('profiles'));

ipcMain.handle('get_profile', (_, id: string) => profilesStore.get('profiles').find(p => p.id === id) || null);

ipcMain.handle('create_profile', (_, profile: Partial<Profile>): IpcResponse<void> => {
    if (!profile.name) return {success: false, error: 'name_required'};
    if (!validateProfileName(profile.name)) return {success: false, error: 'name_invalid'};

    const profiles = profilesStore.get('profiles');
    if (profiles.some(p => p.name.toLowerCase() === profile.name!.toLowerCase())) return {success: false, error: 'name_exists'};

    const newProfile = {
        id: generateUUID(),
        name: profile.name,
        rows: clamp(Math.floor(profile.rows) || 8, 1, 50),
        cols: clamp(Math.floor(profile.cols) || 10, 1, 50),
        buttons: [] as SbButton[]
    }

    profiles.push(newProfile);
    profilesStore.set('profiles', profiles);
    settingsStore.set('activeProfile', newProfile.id);

    broadcastProfiles(profiles);
    broadcastSettings(settingsStore.store);
    return {success: true};
});

ipcMain.handle('update_profile', (_, id: string, profile: Partial<Profile>): IpcResponse<void> => {
    if (!id) return {success: false, error: 'id_required'};

    const profiles = profilesStore.get('profiles');
    const idx = profiles.findIndex(p => p.id === id);
    if (idx === -1) return {success: false, error: 'id_not_found'};

    const existingProfile = profiles[idx];
    const newValues: Partial<Profile> = {};

    if (profile.name) {
        if (!validateProfileName(profile.name)) return {success: false, error: 'name_invalid'};
        if (profiles.some(p => p.id !== id && p.name.toLowerCase() === profile.name!.toLowerCase())) return {success: false, error: 'name_exists'};
        newValues.name = profile.name;
    }

    if (profile.rows !== undefined) newValues.rows = clamp(Math.floor(profile.rows), 1, 50);
    if (profile.cols !== undefined) newValues.cols = clamp(Math.floor(profile.cols), 1, 50);

    profiles[idx] = {
        ...existingProfile,
        ...newValues
    };

    profilesStore.set('profiles', profiles);
    broadcastProfiles(profiles);
    return {success: true};
});

ipcMain.handle('delete_profile', (_, id: string): IpcResponse<void> => {
    if (!id) return {success: false, error: 'id_required'};

    const profiles = profilesStore.get('profiles');
    const idx = profiles.findIndex(p => p.id === id);
    if (idx === -1) return {success: false, error: 'id_not_found'};

    profiles.splice(idx, 1);
    if (profiles.length === 0) {
        profiles.push({
            id: generateUUID(),
            name: 'Default',
            rows: 8,
            cols: 10,
            buttons: []
        });
    }

    profilesStore.set('profiles', profiles);
    broadcastProfiles(profiles);

    const activeProfile = settingsStore.get('activeProfile');
    if (activeProfile === id || !profiles.find(p => p.id === activeProfile)) {
        settingsStore.set('activeProfile', profiles[0].id);
        broadcastSettings(settingsStore.store);
    }

    return {success: true};
});

ipcMain.on('import_profile', async () => {
    const defaultPath: string = cacheStore.get('profilesDir') || app.getPath('documents');

    const {canceled, filePaths} = await dialog.showOpenDialog({
        title: 'Import Profile',
        defaultPath: defaultPath,
        properties: ['openFile'],
        filters: [
            {name: 'JSON Profile', extensions: ['json']},
        ]
    });

    if (canceled || !filePaths || filePaths.length === 0) {
        console.info('Import canceled');
        return;
    }

    const filePath = filePaths[0];
    cacheStore.set('profilesDir', path.dirname(filePath));

    let rawData: Partial<Profile>;
    try {
        rawData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {
        console.error("JSON Parse Error:", e);
        return;
    }

    if (!rawData || typeof rawData !== 'object' || !rawData.name) {
        console.error('Invalid profile format');
        return;
    }

    const profiles = profilesStore.get('profiles');

    let newName = rawData.name;
    let counter = 1;
    while (profiles.some(p => p.name.toLowerCase() === newName.toLowerCase())) {
        newName = `${rawData.name} (${counter++})`;
    }

    const newProfile: Profile = {
        id: generateUUID(),
        name: newName,
        rows: clamp(Math.floor(rawData.rows || 8), 1, 50),
        cols: clamp(Math.floor(rawData.cols || 10), 1, 50),
        buttons: sanitizeButtons(rawData.buttons)
    };

    profiles.push(newProfile);
    profilesStore.set('profiles', profiles);
    broadcastProfiles(profiles);
});

ipcMain.on('export_profile', async (_, id: string) => {
    const profile = profilesStore.get('profiles').find(p => p.id === id);

    if (!profile) {
        console.error('Profile not found');
        return;
    }

    const safeFilename = profile.name.replace(/[^a-z0-9\-_]/gi, '_');

    const {canceled, filePath} = await dialog.showSaveDialog({
        title: `Export profile ${profile.name}`,
        defaultPath: path.join(
            cacheStore.get('profilesDir') || app.getPath('documents'),
            `${safeFilename}.json`
        ),
        filters: [
            {name: 'JSON', extensions: ['json']},
        ]
    });

    if (canceled || !filePath) {
        console.info('Export canceled');
        return;
    }

    cacheStore.set('profilesDir', path.dirname(filePath));

    try {
        fs.writeFileSync(filePath, JSON.stringify(profile, null, 2));
    } catch (e) {
        console.error('Error exporting profile:', e.message);
    }
});

ipcMain.on('export_profiles', async () => {
    const profiles = profilesStore.get('profiles');
    if (!profiles || profiles.length === 0) return;

    const {canceled, filePaths} = await dialog.showOpenDialog({
        title: 'Select Export Directory',
        defaultPath: cacheStore.get('profilesDir') || app.getPath('documents'),
        properties: ['openDirectory', 'createDirectory']
    });

    if (canceled || !filePaths || filePaths.length === 0) {
        console.info('Export canceled');
        return;
    }

    const exportDir = filePaths[0];

    cacheStore.set('profilesDir', exportDir);

    const usedFilenames = new Set<string>();

    for (const profile of profiles) {
        try {
            let safeName = profile.name.replace(/[^a-z0-9\-_]/gi, '_');
            if (!safeName || safeName.trim() === '') safeName = `profile_${profile.id}`;

            let filename = `${safeName}.json`;
            let counter = 1;

            while (usedFilenames.has(filename.toLowerCase()) || fs.existsSync(path.join(exportDir, filename))) {
                filename = `${safeName} (${counter++}).json`;
            }

            usedFilenames.add(filename.toLowerCase());

            const filePath = path.join(exportDir, filename);

            fs.writeFileSync(filePath, JSON.stringify(profile, null, 2));
        } catch (e) {
            console.error(`Error during profile ${profile.name} export:`, e.message);
        }
    }
});

// Buttons

ipcMain.handle('get_button', (_, profileId: string, buttonId: string): SbButton | null => {
    const profile = profilesStore.get('profiles').find(p => p.id === profileId);
    if (!profile) return null;

    const buttonPos = getButtonPositionFromId(buttonId);
    if (!buttonPos) return null;

    return profile.buttons.find(b => b.row === buttonPos.row && b.col === buttonPos.col) || null;
});

ipcMain.handle('update_button', (_, profileId: string, buttonId: string, button: Partial<SbButton>): IpcResponse<void> => {
    const profiles = profilesStore.get('profiles');

    const profileIdx = profiles.findIndex(p => p.id === profileId);
    if (profileIdx === -1) return {success: false, error: 'profile_not_found'};

    const profile = profiles[profileIdx];
    const buttonPos = getButtonPositionFromId(buttonId);
    if (!buttonPos) return {success: false, error: 'invalid_button_id'};

    const existingButtonIdx = profile.buttons.findIndex(b => b.row === buttonPos.row && b.col === buttonPos.col);
    if (existingButtonIdx === -1) return {success: false, error: 'button_not_found'};

    const existingButton = profile.buttons[existingButtonIdx];
    profile.buttons[existingButtonIdx] = {
        ...existingButton,
        ...button
    };

    profiles[profileIdx] = profile;
    profilesStore.set('profiles', profiles);
    broadcastProfiles(profiles);

    return {success: true};
});

ipcMain.handle('delete_button', (_, profileId: string, buttonId: string): IpcResponse<void> => {
    const profiles = profilesStore.get('profiles');

    const profileIdx = profiles.findIndex(p => p.id === profileId);
    if (profileIdx === -1) return {success: false, error: 'profile_not_found'};

    const profile = profiles[profileIdx];
    const buttonPos = getButtonPositionFromId(buttonId);
    if (!buttonPos) return {success: false, error: 'invalid_button_id'};

    const existingButtonIdx = profile.buttons.findIndex(b => b.row === buttonPos.row && b.col === buttonPos.col);
    if (existingButtonIdx === -1) return {success: false, error: 'button_not_found'};

    profile.buttons.splice(existingButtonIdx, 1);

    profiles[profileIdx] = profile;
    profilesStore.set('profiles', profiles);
    broadcastProfiles(profiles);

    return {success: true};
});

// Windows

ipcMain.on('open_window', (_, winId: WindowId, args?: unknown) => {
    switch (winId) {
        case 'media_selector': {
            const safeArgs = (args || {}) as MediaSelectorWin;
            createMediaSelector(safeArgs.parent, safeArgs.row, safeArgs.col);
            break;
        }
        case 'button_settings': {
            if (args && typeof args === 'object' && 'profileId' in args && 'buttonId' in args) {
                const {profileId, buttonId} = args as ButtonSettingsWin;
                createButtonSettings(profileId, buttonId);
            } else {
                console.error('Invalid arguments for button_settings window');
            }
            break;
        }
        default:
            console.error('Unknown window ID:', winId);
            break;
    }
});

// System

ipcMain.on('open_link', async (_, url: string) => shell.openExternal(url));

ipcMain.handle('open_file_media_selector', async (): Promise<IpcResponse<string>> => {
    const {canceled, filePaths} = await dialog.showOpenDialog({
        title: 'Select Audio File',
        defaultPath: cacheStore.get('audioDir') || app.getPath('documents'),
        properties: ['openFile'],
        filters: [
            {
                name: 'All Media Files',
                extensions: [
                    'mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac',
                    'mp4', 'webm', 'mkv', 'avi', 'mov', 'wmv'
                ]
            },
            {
                name: 'Audio Only',
                extensions: ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac']
            },
            {
                name: 'Video Only',
                extensions: ['mp4', 'webm', 'mkv', 'avi', 'mov', 'wmv']
            }
        ]
    });

    if (canceled || !filePaths || filePaths.length === 0) return {success: false, error: 'canceled'};
    const filePath = filePaths[0];
    cacheStore.set('audioDir', path.dirname(filePath));
    return {success: true, data: filePath};
});