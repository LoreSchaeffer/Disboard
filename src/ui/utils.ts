import {SbButton, Profile} from "../utils/store/profiles";

export function getButton(profile: Profile, row: number, col: number): SbButton | null {
    if (!profile) return null;
    return profile.buttons.find(b => b.row === row && b.col === col);
}

export function isRemoteUrl(uri: string): boolean {
    return uri.startsWith('https://');
}

export function formatTime(time: number): string {
    time = Math.floor(time / 1000);

    const hours = Math.floor(time / 3600);
    const minutes = Math.floor(time / 60) % 60;
    const seconds = time % 60;

    let formatted = '';
    if (hours > 0) formatted += hours + ':';
    formatted += minutes.toString().padStart(2, '0') + ':';
    formatted += seconds.toString().padStart(2, '0');

    return formatted;
}

export function validateHexColor(color: string): boolean {
    return /^#[0-9A-F]{6}$/i.test(color) || /^#[0-9A-F]{3}$/i.test(color);
}