export type RepeatMode = 'none' | 'one' | 'all';

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
    profileId: string;
    buttonId: string;
}