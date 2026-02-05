import {z} from "zod";

export const RepeatModeSchema = z.enum(['none', 'one', 'all']);

export type RepeatMode = z.infer<typeof RepeatModeSchema>;
export type MediaSelectorAction = 'update_button' | 'play_now';

export type IpcResponse<T> = {
    success: boolean;
    data?: T;
    error?: string;
}

export type MediaSelectorWin = {
    action: MediaSelectorAction;
    profileId?: string;
    buttonId?: string;
}

export type ButtonSettingsWin = {
    profileId: string;
    buttonId: string;
}