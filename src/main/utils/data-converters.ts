import {AmbientBtn, AmbientProfile, GridBtn, GridProfile, PlayerTrack, SbAmbientBtn, SbAmbientProfile, SbGridBtn, SbGridProfile, Track, TrackSourceName, YTSearchResult} from "../../types";
import {tracksStore} from "../storage/tracks-store";
import {getYoutubeStream} from "./music-api";
import {generateUUID} from "./misc";
import {probeMedia} from "./ffmpeg";

const getTracksRecord = (): Record<string, Track> => {
    const record: Record<string, Track> = {};
    tracksStore.get('tracks').forEach(track => record[track.id] = track);
    return record;
}

const buildSbGridBtn = (gridBtn: GridBtn, track?: Track): SbGridBtn => {
    return {
        ...gridBtn,
        track: track,
        title: gridBtn.title || track?.title,
    };
};

export const convertGridBtn2SbGridBtn = (gridBtn: GridBtn): SbGridBtn => {
    const track = (tracksStore.get('tracks') || []).find(t => t.id === gridBtn.track) || null;
    return buildSbGridBtn(gridBtn, track);
};

export const convertGridBtns2SbGridBtns = (gridBtns: GridBtn[]): SbGridBtn[] => {
    const tracks: Record<string, Track> = getTracksRecord();

    return gridBtns.map(btn => {
        const track = tracks[btn.track];
        return buildSbGridBtn(btn, track);
    });
}

export const convertGridProfile2SbGridProfile = (gridProfile: GridProfile): SbGridProfile => {
    return {
        ...gridProfile,
        buttons: convertGridBtns2SbGridBtns(gridProfile.buttons)
    }
}

export const convertAmbientBtn2SbAmbientBtn = (ambientBtn: AmbientBtn): SbAmbientBtn => {
    return null;
}

export const convertAmbientBtns2SbAmbientBtns = (ambientBtns: AmbientBtn[]): SbAmbientBtn[] => {
    return null;
}

export const convertAmbientProfile2SbAmbientProfile = (ambientProfile: AmbientProfile): SbAmbientProfile => {
    return {
        ...ambientProfile,
        // TODO
    }
}

export const createPlayerTrack = async (source: TrackSourceName, media: YTSearchResult | string): Promise<PlayerTrack | null> => {
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
                    directStream: true,
                    board: undefined
                }
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
                directStream: true,
                board: undefined
            };
            break;
        }
    }

    return track;
}