import {ElementType} from "react";
import {PiSpeakerHighBold, PiSpeakerLowBold, PiSpeakerNoneBold} from "react-icons/pi";
import {PlayerTrack, SbBtn} from "../../types/data";

export const hexToHsl = (hex: string): { h: number; s: number; l: number } | null => {
    let cleanHex = hex.replace(/^#/, '');
    if (cleanHex.length === 3) cleanHex = cleanHex.split('').map(char => char + char).join('');
    if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) return null;

    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
};

export const hslToHex = ({h, s, l}: { h: number; s: number; l: number }): string => {
    const sNorm = s / 100;
    const lNorm = l / 100;

    const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = lNorm - c / 2;

    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) {
        r = c;
        g = x;
        b = 0;
    } else if (60 <= h && h < 120) {
        r = x;
        g = c;
        b = 0;
    } else if (120 <= h && h < 180) {
        r = 0;
        g = c;
        b = x;
    } else if (180 <= h && h < 240) {
        r = 0;
        g = x;
        b = c;
    } else if (240 <= h && h < 300) {
        r = x;
        g = 0;
        b = c;
    } else if (300 <= h && h < 360) {
        r = c;
        g = 0;
        b = x;
    }

    const toHex = (n: number) => {
        const hex = Math.round((n + m) * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

export const getAudioDevices = async (): Promise<MediaDeviceInfo[]> => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(d =>
        d.kind === 'audiooutput' &&
        d.label !== '' &&
        d.deviceId !== 'communications'
    );
}

export const getVolumeIcon = (volume: number): ElementType => {
    if (volume < 15) return PiSpeakerNoneBold;
    if (volume < 50) return PiSpeakerLowBold;
    return PiSpeakerHighBold;
}

export const generateButtonId = (row: number, col: number): string => {
    return `btn_${row}_${col}`;
}

export const playerTrackFromBtn = (btn: SbBtn): PlayerTrack => {
    return {
        ...btn.track,
        cropOptions: btn.cropOptions || undefined,
        titleOverride: btn.title || undefined,
        volumeOverride: btn.volumeOverride || undefined
    }
}