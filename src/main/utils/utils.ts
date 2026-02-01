import * as crypto from 'crypto';
import {PlayerTrack, TrackSource} from "../../types/data";
import {YTSearchResult} from "../../types/music-api";
import {tracksStore} from "./store";
import {state} from "../state";
import os from "node:os";

export const generateUUID = (): string => {
    return crypto.randomUUID();
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
            const musicApi = state.musicApi;
            if (!musicApi) return null;

            try {
                const stream = await musicApi.getStream(ytResult.id);
                if (!stream) return null;

                track = {
                    id: generateUUID(),
                    source: {
                        type: 'youtube',
                        src: stream
                    },
                    title: ytResult.name,
                    duration: ytResult.duration,
                    directStream: true
                }
            } catch {
                return null;
            }
            break;
        }
        case 'file': {
            track = {
                id: generateUUID(),
                source: {
                    type: 'file',
                    src: media as string
                },
                title: (media as string).split('/').pop(),
                duration: 0,
                directStream: true
            };
            break;
        }
        case 'url': {
            track = {
                id: generateUUID(),
                source: {
                    type: 'url',
                    src: media as string
                },
                title: media as string,
                duration: 0,
                directStream: true
            }
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