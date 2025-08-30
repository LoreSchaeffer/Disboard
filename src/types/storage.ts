import {SoundboardMode, RepeatMode} from "./types";
import {Track} from "./track";

export type Settings = {
    width: number;
    height: number;
    volume: number;
    preview_volume: number;
    output_device: string;
    preview_output_device: string;
    loop: RepeatMode;
    active_profile?: string;
    soundboard_mode: SoundboardMode;
    font_size: number;
    show_images: boolean;
    youtube_cookie?: string;
    bot_token?: string;
    debug?: boolean;
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
    track: Track;
}

export type SbButtonStyle = {
    text_color?: string;
    text_color_hover?: string;
    background_color?: string;
    background_color_hover?: string;
    border_color?: string;
    border_color_hover?: string;
}