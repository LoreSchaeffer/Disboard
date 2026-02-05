import {ButtonWindowData, MediaSelectorWindowData, WindowOptions} from "../types/window";
import {BrowserWindow} from "electron";
import path from "path";
import {state} from "./state";
import {MediaSelectorAction} from "../types/common";
import {settingsStore} from "./utils/store";
import {registerMediaShortcuts} from "./media";
import os from "node:os";

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

const loadWindowUrl = (win: BrowserWindow, pageName: string, queryParams: string = '') => {
    const search = pageName !== 'main' ? `?page=${pageName}${queryParams}` : queryParams;
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) win.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}/index.html${search}`).catch(e => console.log(`[Main] Failed to load URL: ${e}`));
    else win.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`), {search: search}).catch(e => console.log(`[Main] Failed to load file: ${e}`));
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
            webSecurity: true,
            backgroundThrottling: false,
        },
    };

    const win = new BrowserWindow(browserOptions);
    state.winOptions.set(win.id, options);

    if (options.data) state.winData.set(win.id, options.data);

    const pageName = options.page || 'main';
    loadWindowUrl(win, pageName);

    win.webContents.on('did-finish-load', () => {
        if (customOnLoaded) customOnLoaded(win);
    });

    win.once('ready-to-show', () => {
        if (options.onReady) options.onReady(win);
        win.show();
    });

    win.on('closed', () => {
        state.winOptions.delete(win.id);
        state.winData.delete(win.id);
    });

    if (options.onResize) win.on('resize', () => options.onResize!(win));
    if (settingsStore.get('debug')) win.webContents.openDevTools({mode: 'detach'});

    return win;
}

let resizeTimeout: NodeJS.Timeout;
export const createMainWindow = () => {
    state.mainWindow = createWindow({
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
        },
        onReady: (win) => {
            const pid = win.webContents.getOSProcessId();
            if (pid) {
                try {
                    os.setPriority(pid, os.constants.priority.PRIORITY_HIGH);
                    console.log(`[Main] Priority set to HIGH for main window renderer process (PID: ${pid}).`);
                } catch (e) {
                    console.error(`[Main] Failed to set priority for main window renderer process (PID: ${pid}):`, e);
                }
            }
        }
    });

    registerMediaShortcuts();
}

// TODO Data should be updated manually from the main process when it's changed
export const createButtonSettingsWindow = (profileId: string, buttonId: string): BrowserWindow => {
    return createWindow({
        page: 'button_settings',
        modal: true,
        parent: state.mainWindow,
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

export const createMediaSelectorWindow = (action: MediaSelectorAction, parent?: number, profileId?: string, buttonId?: string) => {
    return createWindow({
        page: 'media_selector',
        modal: true,
        parent: parent ? BrowserWindow.fromId(parent) : undefined,
        width: 500,
        height: 600,
        resizable: false,
        data: {
            type: 'media_selector',
            data: {
                action: action,
                profileId: profileId,
                buttonId: buttonId
            } as MediaSelectorWindowData
        }
    });
}