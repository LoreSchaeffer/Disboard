import path from "path";
import fs from "node:fs/promises";
import axios, {isAxiosError} from "axios";
import {THUMBNAILS_DIR, TRACKS_DIR, USER_AGENT} from "../constants";
import sharp from "sharp";
import {determineTitle, downloadAudio, extractCoverImage} from "./ffmpeg";
import {BoardType, GridProfiles, Track, TrackSourceName, YTSearchResult} from "../../types";
import {tracksStore} from "../storage/tracks-store";
import {getBestThumbnail, getVideoId, getYoutubeStream} from "./music-api";
import {getGridProfilesStore, musicBoardStore, sfxBoardStore} from "../storage/profiles-store";
import {broadcastData} from "./broadcast";
import {convertGridProfile2SbGridProfile} from "./data-converters";
import Store from "electron-store";
import {cacheStore} from "../storage/cache-store";

const updateTracksStore = (track: Track) => {
    const tracks = tracksStore.get('tracks') || [];
    const idx = tracks.findIndex(t => t.id === track.id);

    if (idx !== -1) tracks[idx] = track;
    else tracks.push(track);

    tracksStore.set('tracks', tracks);
    broadcastData('tracks:changed', tracks);
    broadcastData(`grid_profiles:${track.board}:changed`, getGridProfilesStore(track.board).get('profiles')?.map(convertGridProfile2SbGridProfile) || []);
}

export const removeTrackFromStore = (id: string): boolean => {
    const tracks = tracksStore.get('tracks') || [];

    const idx = tracks.findIndex(t => t.id === id);
    if (idx === -1) return false;
    tracks.splice(idx, 1);

    tracksStore.set('tracks', tracks);
    broadcastData('tracks:changed', tracks);

    const cleanButtonsContainingTrack = (boardType: Exclude<BoardType, 'ambient'>, profilesStore: Store<GridProfiles>) => {
        const profiles = profilesStore.get('profiles') || [];

        let profilesChanged = false;
        for (const profile of profiles) {
            const len = profile.buttons.length;
            profile.buttons = profile.buttons.filter(btn => btn.track !== id);
            if (len !== profile.buttons.length) profilesChanged = true;
        }

        if (profilesChanged) {
            profilesStore.set('profiles', profiles);
            broadcastData(`grid_profiles:${boardType}:changed`, profiles.map(convertGridProfile2SbGridProfile));
        }
    }

    cleanButtonsContainingTrack('music', musicBoardStore);
    cleanButtonsContainingTrack('sfx', sfxBoardStore);

    return true;
}

const downloadTrack = async (track: Track): Promise<void> => {
    try {
        const uri = track.source.type === 'youtube'
            ? await getYoutubeStream(getVideoId(track.source.src))
            : track.source.src;

        track.duration = await downloadAudio(uri, TRACKS_DIR, track.id);
        track.downloading = false;

        updateTracksStore(track);
    } catch (e) {
        console.error(`[Downloader] Download of track ${track.title} (${track.id}) failed:`, e);

        const audioFile = path.join(TRACKS_DIR, `${track.id}.mp3`);
        await fs.unlink(audioFile).catch(() => {
            // Ignored
        });

        removeTrackFromStore(track.id);

        const errorMessage = e instanceof Error ? e.message : 'track_download_error';
        throw new Error(errorMessage);
    }
}

const downloadImage = async (track: Track, url?: string): Promise<void> => {
    const dstFile = path.join(THUMBNAILS_DIR, `${track.id}.jpg`);

    try {
        let data: Buffer;

        if (track.source.type !== 'youtube') {
            await extractCoverImage(track.source.src, THUMBNAILS_DIR, track.id);
            data = await fs.readFile(dstFile);
        } else {
            if (!url || !url.startsWith('http')) throw new Error('The url of the best thumbnail should be provided');

            const response = await axios({
                method: 'GET',
                url: url,
                responseType: 'arraybuffer',
                headers: {'User-Agent': USER_AGENT},
                timeout: 20000
            });
            data = response.data;
        }

        const image = sharp(data);
        const metadata = await image.metadata();
        const width = metadata.width;
        const height = metadata.height;

        if (!width || !height) throw new Error("Cannot determine image dimensions");

        const minDimension = Math.min(width, height);
        const leftOffset = Math.round((width - minDimension) / 2);
        const topOffset = Math.round((height - minDimension) / 2);

        await image
            .extract({
                left: leftOffset,
                top: topOffset,
                width: minDimension,
                height: minDimension
            })
            .jpeg({quality: 90, mozjpeg: true})
            .toFile(dstFile);

    } catch (e) {
        if (isAxiosError(e) && url) {
            const unreachableUrls = cacheStore.get('unreachableUrls') || [];
            if (!unreachableUrls.includes(url)) cacheStore.set('unreachableUrls', [...unreachableUrls, url]);
        }

        const errMsg = e instanceof Error ? e.message : String(e);
        console.warn(`[Main] Thumbnail not generated for ${track.title} (${track.id}): ${errMsg}`);

        await fs.unlink(dstFile).catch(() => {
            // Ignored
        });
        throw e;
    }
}

export const createAndDownloadTrack = async (
    boardType: Exclude<BoardType, 'ambient'>,
    trackId: string,
    source: Exclude<TrackSourceName, 'list'>,
    media: YTSearchResult | string,
    customTitle?: string
): Promise<Track> => {
    const track: Track = {
        id: trackId,
        source: {
            type: source,
            src: source === 'youtube' ? (media as YTSearchResult).url : (media as string)
        },
        title: customTitle || (source === 'youtube' ? (media as YTSearchResult).name : undefined),
        duration: undefined,
        board: boardType,
        downloading: true
    };

    if (!track.title && source !== 'youtube') track.title = await determineTitle(track);

    updateTracksStore(track);

    try {
        const thumbUrl = source === 'youtube' ? getBestThumbnail((media as YTSearchResult).thumbnails) : undefined;
        await downloadImage(track, thumbUrl);
    } catch {
        // Ignored
    }

    try {
        await downloadTrack(track);
    } catch (e) {
        await fs.unlink(path.join(THUMBNAILS_DIR, `${track.id}.jpg`)).catch(() => {
            // Ignored
        });

        throw e;
    }

    return track;
};

const getFallbackThumbnailUrl = (track: Track): string | undefined => {
    if (track.source.type === 'youtube') {
        try {
            const videoId = getVideoId(track.source.src);
            return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        } catch {
            return undefined;
        }
    }
    return undefined;
}

const downloadMissingTrack = async (track: Track, downloadThumb: boolean) => {
    track.downloading = true;
    updateTracksStore(track);

    if (downloadThumb) {
        try {
            await downloadImage(track, getFallbackThumbnailUrl(track));
        } catch (e) {
            console.warn(`[Main] Could not restore thumbnail for ${track.title} (${track.id}):`, e.message);
        }
    }

    await downloadTrack(track);
}

const checkFileExists = async (filePath: string): Promise<boolean> => {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
};

export const fixMissingTracks = async () => {
    const tracks: Track[] = tracksStore.get('tracks') || [];

    for (const track of tracks) {
        const trackFile = path.join(TRACKS_DIR, `${track.id}.mp3`);
        const thumbFile = path.join(THUMBNAILS_DIR, `${track.id}.jpg`);

        const trackExists = await checkFileExists(trackFile);
        const thumbExists = await checkFileExists(thumbFile);

        if (trackExists && thumbExists) continue;

        if (!trackExists) {
            console.warn(`[Main] Track audio ${track.title} (${track.id}) is missing...`);

            const unreachableUrls = cacheStore.get('unreachableUrls') || [];

            try {
                if (!unreachableUrls.includes(track.source.src)) {
                    await downloadMissingTrack(track, !thumbExists);
                    console.info(`[Main] Track audio ${track.title} (${track.id}) restored.`)
                }
            } catch (e) {
                console.error(`[Main] Failed to restore audio for ${track.id}`, e);
            }
        } else if (!thumbExists) {
             try {
                const unreachableUrls = cacheStore.get('unreachableUrls') || [];
                const fallbackThumbnailUrl = getFallbackThumbnailUrl(track) || '';

                if (fallbackThumbnailUrl !== '' && !unreachableUrls.includes(fallbackThumbnailUrl)) {
                    await downloadImage(track, fallbackThumbnailUrl);
                    console.info(`[Main] Thumbnail for ${track.title} (${track.id}) restored.`)
                }
            } catch (e) {
                console.warn(`[Main] Failed to restore thumbnail for ${track.id}`, e.message);
            }
        }
    }
}