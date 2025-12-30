export type RepeatMode = 'none' | 'one' | 'all';

export type WindowInfo = {
    parent: number | null;
    resizable: boolean;
    page: string;
}

export type IpcResponse<T> = {
    success: boolean;
    data?: T;
    error?: string;
}

export type MediaSelectorWin = {
    parent?: number;
    row?: number;
    col?: number;
}

export type ButtonSettingsWin = {
    row: number;
    col: number;
}