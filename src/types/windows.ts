import {BrowserWindow, BrowserWindowConstructorOptions} from "electron";
import {BoardType, GridPos, MediaSelectorAction} from "./common";
import {Route} from "./routes";

export type WindowOptions = BrowserWindowConstructorOptions & {
    route: Route;
    onLoaded?: (win: BrowserWindow) => void;
    onReady?: (win: BrowserWindow) => void;
    onResize?: (win: BrowserWindow) => void;
    data?: StaticWindowData<unknown>;
}

export type WindowInfo = {
    parent: number | null;
    resizable: boolean;
    route: Route;
    data?: StaticWindowData<unknown>;
}

export type StaticWindowData<T> = {
    type?: Route;
    boardType?: BoardType;
    data?: T;
}

// Static Window Data
export type GridBtnWindowData = {
    boardType: Exclude<BoardType, 'ambient'>;
    profileId: string;
    buttonId: string;
}

export type GridMediaSelectorWindowData = {
    boardType: Exclude<BoardType, 'ambient'>;
    action: MediaSelectorAction;
    profileId: string;
    buttonId?: string;
    gridPos: GridPos;
}