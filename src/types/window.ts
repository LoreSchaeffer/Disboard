import {BrowserWindow, BrowserWindowConstructorOptions} from "electron";

export type WindowId = 'media_selector' | 'button_settings';

export type WindowOptions = BrowserWindowConstructorOptions & {
    page: string;
    onLoaded?: (win: BrowserWindow) => void;
    onReady?: (win: BrowserWindow) => void;
    onResize?: (win: BrowserWindow) => void;
    data?: WindowData<unknown>;
}

export type WindowInfo = {
    parent: number | null;
    resizable: boolean;
    page: string;
    data?: WindowData<unknown>;
}

export type WindowData<T> = {
    type: 'button'
    data: T;
}

// Window Data
export type ButtonWindowData = {
    profileId: string;
    buttonId: string;
}