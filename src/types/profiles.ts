import {Track} from "./track";

export type Profiles = {
    profiles: Profile[];
}

export type Profile = {
    id: string;
    name: string;
    rows: number;
    cols: number;
    buttons: SbButton[];
}

export type SbButton = {
    row: number;
    col: number;
    title: string;
    style?: SbButtonStyle;
    cropOptions?: CropOptions;
    track: Track;
}

export type SbButtonStyle = {
    text_color?: string;
    text_color_hover?: string;
    text_color_active?: string;
    background_color?: string;
    background_color_hover?: string;
    background_color_active?: string;
    border_color?: string;
    border_color_hover?: string;
    border_color_active?: string;
    auto_pick?: boolean;
}

export type CropOptions = {
    startTime?: number;
    startTimeUnit?: TimeUnit;
    endTimeType?: EndTimeType;
    endTime?: number;
    endTimeUnit?: TimeUnit;
}

export type TimeUnit = 'ms' | 's' | 'm';

export type EndTimeType = 'at' | 'after';