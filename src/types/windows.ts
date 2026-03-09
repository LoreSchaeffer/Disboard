import {BrowserWindow, BrowserWindowConstructorOptions} from "electron";
import {BoardType, GridPos, MediaSelectorAction} from "./common";
import {Route} from "./routes";

export type WindowOptions = BrowserWindowConstructorOptions & {
    route: Route;
    onLoaded?: (win: BrowserWindow) => void;
    onReady?: (win: BrowserWindow) => void;
    onResize?: (win: BrowserWindow) => void;
    onClosed?: (win: BrowserWindow) => void;
    data?: StaticWinData<unknown>;
}

export type WindowInfo = {
    parent: number | null;
    resizable: boolean;
    route: Route;
    data?: StaticWinData<unknown>;
}

export type StaticWinData<T> = {
    type?: Route;
    boardType?: BoardType;
    data?: T;
}

// Open Window Data
export type GridMediaSelectorWin = {
    boardType: Exclude<BoardType, 'ambient'>;
    action: MediaSelectorAction;
    profileId?: string;
    gridPos?: GridPos;
}

export type GridBtnSettingsWin = {
    boardType: Exclude<BoardType, 'ambient'>;
    profileId: string;
    buttonId: string;
}

// Static Window Data
export type GridBtnWinData = {
    profileId: string;
    buttonId: string;
}

export type GridMediaSelectorWinData = {
    action: MediaSelectorAction;
    profileId: string;
    gridPos: GridPos;
}