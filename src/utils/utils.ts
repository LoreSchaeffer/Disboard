import * as crypto from 'crypto';

export const generateUUID = (): string => {
    return crypto.randomUUID();
}

export const clamp = (num: number, min: number, max: number): number => {
    return Math.min(Math.max(num, min), max);
}