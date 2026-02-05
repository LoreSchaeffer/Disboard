import {BrowserWindow, ipcMain, IpcMainInvokeEvent} from 'electron';
import {WindowInfo} from "../../types/window";
import {state} from "../state";
import {ButtonSettingsWin, MediaSelectorWin} from "../../types/common";
import {createButtonSettingsWindow, createMediaSelectorWindow} from "../windows";
import {Route} from "../../types/routes";

export const setupWindowHandlers = () => {
    ipcMain.on('minimize', (e: IpcMainInvokeEvent) => {
        const win = BrowserWindow.fromWebContents(e.sender);
        if (win) win.minimize();
    });

    ipcMain.on('maximize', (e: IpcMainInvokeEvent) => {
        const win = BrowserWindow.fromWebContents(e.sender);
        if (!win || !win.isResizable()) return;

        if (win.isMaximized()) win.restore();
        else win.maximize();
    });

    ipcMain.on('close', (e: IpcMainInvokeEvent) => {
        const win = BrowserWindow.fromWebContents(e.sender);
        if (win) win.close();
    });

    ipcMain.handle('get_window', (e: IpcMainInvokeEvent): WindowInfo => {
        const win = BrowserWindow.fromWebContents(e.sender);
        if (!win) throw new Error('Could not find the window');

        const options = state.winOptions.get(win.id);
        if (!options) throw new Error('Could not find the window options');

        return {
            parent: options.parent ? options.parent.id : null,
            resizable: win.resizable,
            route: options.route,
            data: state.winData.get(win.id)
        };
    });

    ipcMain.on('open_window', (e: IpcMainInvokeEvent, route: Route, args?: unknown) => {
        switch (route) {
            case 'media_selector': {
                const safeArgs = (args || {}) as MediaSelectorWin;
                createMediaSelectorWindow(safeArgs.action, e.frameId, safeArgs.profileId, safeArgs.buttonId);
                break;
            }
            case 'button_settings': {
                if (args && typeof args === 'object' && 'profileId' in args && 'buttonId' in args) {
                    const {profileId, buttonId} = args as ButtonSettingsWin;
                    createButtonSettingsWindow(profileId, buttonId);
                } else {
                    console.error('[Main] Invalid arguments for button_settings window');
                }
                break;
            }
            default:
                console.error('[Main] Unknown window ID:', route);
                break;
        }
    });
}