import {BrowserWindow, BrowserWindowConstructorOptions} from "electron";
import {BoardType, MediaSelectorAction} from "./common";
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
    boardType: BoardType;
    profileId: string;
    buttonId: string;
}

export type GridMediaSelectorWindowData = {
    boardType: BoardType;
    action: MediaSelectorAction;
    profileId: string;
    buttonId: string;
}