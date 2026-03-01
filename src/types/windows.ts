import {BrowserWindow, BrowserWindowConstructorOptions} from "electron";
import {MediaSelectorAction} from "./common";
import {Route} from "./routes";

export type WindowOptions = BrowserWindowConstructorOptions & {
    route: Route;
    onLoaded?: (win: BrowserWindow) => void;
    onReady?: (win: BrowserWindow) => void;
    onResize?: (win: BrowserWindow) => void;
    data?: WindowData<unknown>;
}

export type WindowInfo = {
    parent: number | null;
    resizable: boolean;
    route: Route;
    data?: WindowData<unknown>;
}

export type WindowData<T> = {
    type: Route;
    data: T;
}

// Window Data
export type ButtonWindowData = {
    profileId: string;
    buttonId: string;
}

export type MediaSelectorWindowData = {
    action: MediaSelectorAction;
    profileId: string;
    buttonId: string;
}