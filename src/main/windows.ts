import {BoardType, GridBtnWinData, GridMediaSelectorWinData, GridPos, MediaSelectorAction, WindowOptions} from "../types";
import {BrowserWindow} from "electron";
import path from "path";
import {state} from "./state";
import os from "node:os";
import {getBoardSettings, settingsStore} from "./storage/settings-store";
import {broadcastData} from "./utils/broadcast";

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

const loadWindowUrl = (win: BrowserWindow, pageName: string, queryParams: string = '') => {
    const search = pageName !== 'main' ? `?page=${pageName}${queryParams}` : queryParams;
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) win.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}/index.html${search}`).catch(e => console.log(`[Main] Failed to load URL: ${e}`));
    else win.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`), {search: search}).catch(e => console.log(`[Main] Failed to load file: ${e}`));
};

const createWin = (options: WindowOptions): BrowserWindow => {
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

    if (options.data) state.winStaticData.set(win.id, options.data);

    const pageName = options.route || 'empty';
    loadWindowUrl(win, pageName);

    win.webContents.on('did-finish-load', () => {
        if (customOnLoaded) customOnLoaded(win);
    });

    win.once('ready-to-show', () => {
        if (options.onReady) options.onReady(win);
        win.show();
    });

    win.on('closed', () => {
        if (options.onClosed) options.onClosed(win);
        state.winOptions.delete(win.id);
        state.winStaticData.delete(win.id);
    });

    if (options.onResize) win.on('resize', () => options.onResize!(win));
    if (settingsStore.get('debug')) win.webContents.openDevTools({mode: 'detach'});

    return win;
}

// Windows specific

export const createBoardWin = (boardType: BoardType) => {
    let resizeTimeout: NodeJS.Timeout;

    const boardSettings = getBoardSettings(boardType);

    createWin({
        route: `${boardType}_board`,
        width: boardSettings.width,
        height: boardSettings.height,
        minWidth: 1080,
        minHeight: 608,
        data: {
            boardType: boardType
        },
        onResize: (win) => {
            clearTimeout(resizeTimeout);

            resizeTimeout = setTimeout(() => {
                if (win.isDestroyed()) return;

                const [width, height] = win.getSize();
                if (boardSettings.width === width && boardSettings.height === height) return;

                boardSettings.width = width;
                boardSettings.height = height;

                settingsStore.set(boardType, boardSettings);
                broadcastData('settings:changed', settingsStore.store);
            }, 250);
        },
        onReady: (win) => {
            switch (boardType) {
                case 'music':
                    state.musicBoardId = win.id;
                    break;
                case 'sfx':
                    state.sfxBoardId = win.id;
                    break;
                case 'ambient':
                    state.ambientBoardId = win.id;
                    break;
            }

            const pid = win.webContents.getOSProcessId();
            if (pid) {
                try {
                    os.setPriority(pid, os.constants.priority.PRIORITY_HIGH);
                    console.log(`[Main] Priority set to HIGH for ${boardType} window renderer process (PID: ${pid}).`);
                } catch (e) {
                    console.error(`[Main] Failed to set priority for ${boardType} window renderer process (PID: ${pid}):`, e);
                }
            }
        },
        onClosed: () => {
            switch (boardType) {
                case 'music':
                    state.musicBoardId = null;
                    break;
                case 'sfx':
                    state.sfxBoardId = null;
                    break;
                case 'ambient':
                    state.ambientBoardId = null;
                    break;
            }
        }
    });
}

export const createModalWin = (parent: number, options: WindowOptions): BrowserWindow | null => {
    const parentWin = BrowserWindow.fromId(parent);
    if (!parentWin || parentWin.isDestroyed()) {
        console.warn(`[Main] Failed to create button settings window: parent window with ID ${parent} not found or destroyed.`);
        return null;
    }

    return createWin({...options, parent: parentWin, modal: true});
}

export const createGridBtnSettingsWin = (
    boardType: Exclude<BoardType, 'ambient'>,
    parent: number,
    profileId: string,
    buttonId: string
): BrowserWindow | null => {
    return createModalWin(parent, {
        route: 'grid_btn_settings',
        width: 500,
        height: 600,
        resizable: false,
        data: {
            boardType: boardType,
            type: 'grid_btn_settings',
            data: {
                profileId,
                buttonId
            } as GridBtnWinData
        }
    });
}

export const createGridMediaSelectorWin = (
    boardType: Exclude<BoardType, 'ambient'>,
    parent: number,
    action: MediaSelectorAction,
    profileId: string,
    gridPos: GridPos
): BrowserWindow | null => {
    return createModalWin(parent, {
        route: 'grid_media_selector',
        width: 500,
        height: 600,
        resizable: false,
        data: {
            boardType: boardType,
            type: 'grid_media_selector',
            data: {
                action,
                profileId,
                gridPos
            } as GridMediaSelectorWinData
        }
    });
}