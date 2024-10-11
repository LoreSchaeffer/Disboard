import {Button, Profile} from "../utils/store/profiles";

export function getButton(profile: Profile, row: number, col: number): Button | null {
    if (!profile) return null;
    return profile.buttons.find(b => b.row === row && b.col === col);
}

export function isRemoteUrl(uri: string): boolean {
    return uri.startsWith('https://');
}