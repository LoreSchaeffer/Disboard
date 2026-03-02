import {BrowserWindow, ipcMain, IpcMainEvent, IpcMainInvokeEvent} from 'electron';
import {GridBtnSettingsWin, GridMediaSelectorWin, Route, WindowInfo} from "../../types";
import {state} from "../state";
import {createGridBtnSettingsWin, createGridMediaSelectorWin} from "../windows";

export const setupWindowHandlers = () => {
    ipcMain.on('window:minimize', (e: IpcMainEvent) => {
        const win = BrowserWindow.fromWebContents(e.sender);
        if (win) win.minimize();
    });

    ipcMain.on('window:maximize', (e: IpcMainEvent) => {
        const win = BrowserWindow.fromWebContents(e.sender);
        if (!win || !win.isResizable()) return;

        if (win.isMaximized()) win.restore();
        else win.maximize();
    });

    ipcMain.on('window:close', (e: IpcMainEvent) => {
        const win = BrowserWindow.fromWebContents(e.sender);
        if (win) win.close();
    });

    ipcMain.handle('window:info', (e: IpcMainInvokeEvent): WindowInfo => {
        const win = BrowserWindow.fromWebContents(e.sender);
        if (!win) throw new Error('Could not find the window'); // This should never happen in a normal context

        const options = state.winOptions.get(win.id);
        if (!options) throw new Error('Could not find the window options');  // This should never happen in a normal context

        return {
            parent: options.parent ? options.parent.id : null,
            resizable: win.resizable,
            route: options.route,
            data: state.winStaticData.get(win.id)
        };
    });

    ipcMain.on('window:open', (e: IpcMainEvent, route: Route, args?: unknown) => {
        const win = BrowserWindow.fromWebContents(e.sender);
        if (!win) return;
        const parentId = win.id;

        switch (route) {
            case 'grid_media_selector': {
                const {boardType, action, profileId, buttonId} = (args || {}) as GridMediaSelectorWin;
                createGridMediaSelectorWin(boardType, parentId, action, profileId, buttonId);
                break;
            }
            case 'grid_btn_settings': {
                const {boardType, profileId, buttonId} = (args || {}) as GridBtnSettingsWin;
                createGridBtnSettingsWin(boardType, parentId, profileId, buttonId);
                break;
            }
            default:
                console.error('[Main] Unknown window ID:', route);
                break;
        }
    });
}