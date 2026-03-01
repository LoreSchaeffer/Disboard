import * as crypto from 'crypto';
import {PlayerTrack, Profile, Profiles, SfxProfile, SfxProfiles, TrackSource} from "../../types/data";
import {YTSearchResult} from "../../types/music-api";
import {getProfileStore, settingsStore, tracksStore} from "./store";
import os from "node:os";
import {probeMedia} from "./ffmpeg";
import {getYoutubeStream} from "./music-api";
import {SoundboardType} from "../../types/common";
import Store from "electron-store";
import {SoundboardSettings} from "../../types/settings";
import {act} from "react";

export const generateUUID = (): string => {
    return crypto.randomUUID();
}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isObject = (item: any): boolean => {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

export function deepMerge<T extends object>(target: T, source: Partial<T>): T {
    const output = {...target};

    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            const k = key as keyof T;
            const sourceValue = source[k];
            const targetValue = target[k];

            if (isObject(sourceValue) && isObject(targetValue)) {
                // @ts-expect-error: TS can't infer this correctly
                output[k] = deepMerge(targetValue, sourceValue);
            } else {
                if (sourceValue !== undefined) output[k] = sourceValue;
            }
        });
    }

    return output;
}

export function pruneNulls<T>(obj: T): T {
    if (Array.isArray(obj)) return obj.map(v => pruneNulls(v)).filter(v => v !== null) as unknown as T;

    if (obj !== null && typeof obj === 'object') {
        const target = {...obj};

        Object.keys(target).forEach(key => {
            const k = key as keyof typeof target;
            const value = target[k];

            if (value === null) {
                delete target[k];
            } else if (typeof value === 'object') {
                const cleanedValue = pruneNulls(value);

                if (cleanedValue && Object.keys(cleanedValue).length === 0) delete target[k];
                else target[k] = cleanedValue;
            }
        });

        return target;
    }

    return obj;
}


export const getPlayerTrack = async (source: TrackSource, media: YTSearchResult | string): Promise<PlayerTrack | null> => {
    if (!source || !media) return null;

    let track: PlayerTrack;

    switch (source) {
        case 'list': {
            track = tracksStore.get('tracks').find(t => t.id === media as string) || null;
            break;
        }
        case 'youtube': {
            const ytResult = media as YTSearchResult;

            try {
                const stream = await getYoutubeStream(ytResult.id);
                if (!stream) return null;

                track = {
                    id: generateUUID(),
                    source: {
                        type: 'youtube',
                        src: stream
                    },
                    title: ytResult.name,
                    duration: ytResult.duration * 1000,
                    directStream: true
                }

                console.log(track);
            } catch {
                return null;
            }
            break;
        }
        case 'file':
        case 'url': {
            const uri = media as string;

            let duration = 0;
            let title = source === 'file'
                ? uri.split(/[/\\]/).pop() || uri
                : uri;

            try {
                const probe = await probeMedia(uri);
                duration = Math.round((probe.duration || 0) * 1000);
                if (probe.tags?.title) title = probe.tags.title as string;
            } catch {
                // Ignored
            }

            track = {
                id: generateUUID(),
                source: {
                    type: source,
                    src: uri
                },
                title: title,
                duration: duration,
                directStream: true
            };
            break;
        }
    }

    return track;
}

export const setAppPriority = () => {
    try {
        os.setPriority(process.pid, os.constants.priority.PRIORITY_HIGH);
        console.log(`[Main] Priority set to HIGH for main process (PID: ${process.pid}).`);
    } catch (e) {
        console.warn(`[Main] Failed to set priority for main process (PID: ${process.pid}):`, e);
    }
}


export const getDefProfile = (): Profile => ({
    id: generateUUID(),
    name: 'Default',
    rows: 8,
    cols: 10,
    buttons: []
});

export const getDefSfxProfile = (): SfxProfile => ({
    id: generateUUID(),
    name: 'Default',
    sfxs: []
});


export const fixActiveProfile = (sbType: SoundboardType) => {
    const sbSettings: SoundboardSettings = settingsStore.get(`${sbType}Soundboard`);
    if (!sbSettings) throw new Error(`Settings for ${sbType} soundboard not found`);

    const profilesStore: Store<Profiles> | Store<SfxProfiles> = getProfileStore(sbType);

    if (sbType === 'sfx') {
        const sfxProfiles: SfxProfile[] = (profilesStore as Store<SfxProfiles>).get('profiles') || [];

        if (sfxProfiles.length === 0) {
            console.log(`[Main] No profiles found for ${sbType} soundboard, creating default profile...`);

            sfxProfiles.push(getDefSfxProfile());
            (profilesStore as Store<SfxProfiles>).set('profiles', sfxProfiles);
        }

        const activeProfileId = sbSettings.activeProfile;
        if (!activeProfileId || !sfxProfiles.find(p => p.id === activeProfileId)) {
            console.log(`[Main] Active profile for ${sbType} soundboard not set or invalid, setting to first profile...`);
            settingsStore.set(`${sbType}Soundboard.activeProfile`, sfxProfiles[0].id);
            console.log(`[Main] Active profile for ${sbType} soundboard set to: ${sfxProfiles[0].name}`);
        }
    } else {
        const profiles: Profile[] = (profilesStore as Store<Profiles>).get('profiles') || [];

        if (profiles.length === 0) {
            console.log(`[Main] No profiles found for ${sbType} soundboard, creating default profile...`);

            profiles.push(getDefProfile());
            (profilesStore as Store<Profiles>).set('profiles', profiles);
        }

        const activeProfileId = sbSettings.activeProfile;
        if (!activeProfileId || !profiles.find(p => p.id === activeProfileId)) {
            console.log(`[Main] Active profile for ${sbType} soundboard not set or invalid, setting to first profile...`);
            settingsStore.set(`${sbType}Soundboard.activeProfile`, profiles[0].id);
            console.log(`[Main] Active profile for ${sbType} soundboard set to: ${profiles[0].name}`);
        }
    }

    // eslint-disable-next-line no-control-regex
    const fileNameInvalidCharsRegex = /[<>:"/\\|?*\x00-\x1F]/g;
    export const generateValidFileName = (name: string, def?: string, ext: string = '.json') => {
        if (name.toLowerCase().endsWith(ext.toLowerCase())) name = name.substring(0, name.length - ext.length);

        let validName = name.replace(fileNameInvalidCharsRegex, '_').trim();
        if (validName.length === 0) validName = def || 'Untitled';
        if (validName.length > 64) validName = validName.substring(0, 64);
        return validName + ext;
    }
}