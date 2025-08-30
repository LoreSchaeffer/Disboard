import {BrowserWindow, BrowserWindowConstructorOptions} from 'electron';

export type RepeatMode = 'none' | 'one' | 'all';

export type SoundboardMode = 'normal' | 'bot';

export type WindowOptions = BrowserWindowConstructorOptions & {
    page: string;
    onLoaded?: (win: BrowserWindow) => void;
    onReady?: (win: BrowserWindow) => void;
    onResize?: (win: BrowserWindow) => void;
}