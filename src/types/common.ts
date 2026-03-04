import {z} from "zod";

export const BoardTypeSchema = z.enum(['music', 'sfx', 'ambient']);

export const RepeatModeSchema = z.enum(['none', 'one', 'all']);

export type RepeatMode = z.infer<typeof RepeatModeSchema>;
export type MediaType = 'audio' | 'audio/video' | 'images';
export type MediaSelectorAction = 'update_button' | 'play_now';

export type GridPos = {
    row: number;
    col: number;
}

export type ProbeResult = {
    format: string;
    codec: string;
    duration: number;
    tags: Record<string, string | number>;
}

export type IpcResponse<T> = {
    success: boolean;
    data?: T;
    error?: string;
}

export type GridMediaSelectorWin = {
    boardType: Exclude<BoardType, 'ambient'>;
    action: MediaSelectorAction;
    profileId?: string;
    buttonId?: string;
}

export type GridBtnSettingsWin = {
    boardType: Exclude<BoardType, 'ambient'>;
    profileId: string;
    buttonId: string;
}

export type BoardType = z.infer<typeof BoardTypeSchema>;