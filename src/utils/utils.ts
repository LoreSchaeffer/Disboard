import * as crypto from 'crypto';
import {SbButton, SbButtonStyle} from "../types/profiles";
import {Track} from "../types/track";

export const generateUUID = (): string => {
    return crypto.randomUUID();
}

export const clamp = (num: number, min: number, max: number): number => {
    return Math.min(Math.max(num, min), max);
}

const profileNameRegex = /^[a-zA-Z0-9 \-_/]+$/;
export const validateProfileName = (name: string) => {
    if (!name || name.trim().length === 0) return false;
    if (name.length < 3 || name.length > 32) return false;
    return profileNameRegex.test(name);
}

export const generateButtonId = (row: number, col: number) => {
    return `btn_${row}_${col}`;
}

export const getButtonPositionFromId = (buttonId: string): {row: number, col: number} | null => {
    const match = buttonId.match(/^btn_(\d+)_(\d+)$/);
    if (!match) return null;
    const row = parseInt(match[1], 10);
    const col = parseInt(match[2], 10);
    return {row, col};
}

const sanitizeButtonStyle = (rawStyle: unknown): SbButtonStyle | undefined => {
    if (typeof rawStyle !== 'object' || rawStyle === null) return undefined;

    const validKeys: (keyof SbButtonStyle)[] = [
        'text_color',
        'text_color_hover',
        'text_color_active',
        'background_color',
        'background_color_hover',
        'background_color_active',
        'border_color',
        'border_color_hover',
        'border_color_active'
    ];

    const cleanStyle: SbButtonStyle = {};
    const styleObj = rawStyle as Record<string, unknown>;
    let hasProperties = false;

    validKeys.forEach(key => {
        if (typeof styleObj[key] === 'string') {
            cleanStyle[key] = styleObj[key] as string;
            hasProperties = true;
        }
    });

    return hasProperties ? cleanStyle : undefined;
};

const sanitizeTrack = (rawTrack: unknown): Track | null => {
    if (typeof rawTrack !== 'object' || rawTrack === null) return null;

    const t = rawTrack as Partial<Track>;
    if (!t.id || typeof t.id !== 'string') return null;

    return {
        id: t.id,
        title: typeof t.title === 'string' ? t.title : 'Unknown Track',
    } as Track;
};

export const sanitizeButtons = (rawButtons: unknown): SbButton[] => {
    if (!Array.isArray(rawButtons)) return [];

    return rawButtons
        .map((btn): SbButton | null => {
            if (typeof btn !== 'object' || btn === null) return null;

            const b = btn as Partial<SbButton>;
            const row = Number(b.row);
            const col = Number(b.col);

            if (isNaN(row) || row < 0 || isNaN(col) || col < 0) return null;

            const cleanTrack = sanitizeTrack(b.track);
            if (!cleanTrack) return null;

            return {
                row: Math.floor(row),
                col: Math.floor(col),
                title: typeof b.title === 'string' ? b.title.slice(0, 50) : '',
                style: sanitizeButtonStyle(b.style),
                track: cleanTrack
            };
        })
        .filter((b): b is SbButton => b !== null);
};