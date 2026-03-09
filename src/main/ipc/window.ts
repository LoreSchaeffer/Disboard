import {BrowserWindow, ipcMain, IpcMainEvent, IpcMainInvokeEvent} from 'electron';
import {BoardType, GridBtnSettingsWin, GridMediaSelectorWin, Route, WindowInfo} from "../../types";
import {isBoardOpen, state} from "../state";
import {createBoardWin, createGridBtnSettingsWin, createGridMediaSelectorWin} from "../windows";

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
                const {boardType, action, profileId, gridPos} = (args || {}) as GridMediaSelectorWin;
                createGridMediaSelectorWin(boardType, parentId, action, profileId, gridPos);
                break;
            }
            case 'grid_btn_settings': {
                const {boardType, profileId, buttonId} = (args || {}) as GridBtnSettingsWin;
                createGridBtnSettingsWin(boardType, parentId, profileId, buttonId);
                break;
            }
            case 'music_board':
                if (isBoardOpen('music')) break;
                createBoardWin('music');
                break;
            case 'sfx_board':
                if (isBoardOpen('sfx')) break;
                createBoardWin('sfx');
                break;
            case 'ambient_board':
                if (isBoardOpen('ambient')) break;
                createBoardWin('ambient');
                break;
            default:
                console.error('[Main] Unknown window ID:', route);
                break;
        }
    });

    ipcMain.handle('window:is_board_open', (_, boardType: BoardType): boolean => {
        return isBoardOpen(boardType);
    });
}