import * as crypto from 'crypto';
import {PlayerTrack, TrackSource} from "../../types/data";
import {YTSearchResult} from "../../types/music-api";
import {tracksStore} from "./store";
import os from "node:os";
import {getYoutubeStream} from "../utils";
import {probeMedia} from "./ffmpeg";

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