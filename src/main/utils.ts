import {BrowserWindow, net} from "electron";
import {state} from "./state";
import path from "path";
import fs from "node:fs";
import {AUDIO_DIR, IMAGES_DIR} from "./constants";
import {Settings} from "../types/settings";
import {Profile, Source, Track} from "../types/data";
import {determineTitle, extractCoverImage, processAudio} from "./utils/ffmpeg";
import {profilesStore, settingsStore, tracksStore} from "./utils/store";
import axios from "axios";
import {convertProfileToSbProfile} from "./utils/data-converters";
import {generateUUID} from "./utils/misc";
import sharp from "sharp";

export const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36';

const ytStreamCache = new Map<string, string>();

const downloadImageFromUrl = async (url: string, outputDir: string, trackId: string): Promise<boolean> => {
    if (!url || !url.startsWith('http')) return false;

    const outputPath = path.join(outputDir, `${trackId}.jpg`);

    try {
        fs.mkdirSync(outputDir, {recursive: true});
        console.log(`[Main] Downloading image for ${trackId} from ${url}...`);

        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': USER_AGENT
            },
            timeout: 20000
        });

        const image = sharp(response.data);
        const metadata = await image.metadata();
        const width = metadata.width;
        const height = metadata.height;

        if (!width || !height) throw new Error("Cannot determine image dimensions");

        const minDimension = Math.min(width, height);
        const leftOffset = Math.round((width - minDimension) / 2);
        const topOffset = Math.round((height - minDimension) / 2);

        console.log(`[Main] Cropping image for ${trackId} to ${minDimension}x${minDimension} square.`);

        await image
            .extract({
                left: leftOffset,
                top: topOffset,
                width: minDimension,
                height: minDimension
            })
            .jpeg({quality: 90, mozjpeg: true})
            .toFile(outputPath);

        return true;

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn(`[Main] Failed to download or process cover for ${trackId}: ${errorMessage}`);

        try {
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        } catch {
            // Ignored
        }

        return false;
    }
}

export const getYoutubeStream = async (videoId: string): Promise<string> => {
    const cachedStream = ytStreamCache.get(videoId);

    if (cachedStream) {
        try {
            const response = await net.fetch(cachedStream, {method: 'HEAD'});

            if (response.status >= 200 && response.status < 400) {
                return cachedStream;
            } else ytStreamCache.delete(videoId);
        } catch {
            ytStreamCache.delete(videoId);
        }
    }

    if (!state.musicApi) throw new Error('not_initialized');
    if (!state.musicApi.isAuthenticated()) throw new Error('not_authenticated');

    const result = await state.musicApi.getStream(videoId);
    ytStreamCache.set(videoId, result);

    return result;
}

export const downloadTrack = async (id: string, uri: string, source: Source, title?: string, cover?: string): Promise<Track> => {
    const audioTask = processAudio(uri, AUDIO_DIR, id);
    const titleTask = determineTitle(uri, title);

    let coverTask: Promise<boolean>;
    if (source.type === 'youtube' && cover) {
        coverTask = downloadImageFromUrl(cover, IMAGES_DIR, id)
            .catch(err => {
                console.warn('[Downloader] Failed to download YT cover:', err);
                return false;
            });
    } else {
        coverTask = extractCoverImage(uri, IMAGES_DIR, id);
    }

    try {
        const [duration, finalTitle] = await Promise.all([
            audioTask,
            titleTask,
            coverTask
        ]);

        const track: Track = {
            id: id,
            source: source,
            title: finalTitle,
            duration: duration
        };

        const tracks = tracksStore.get('tracks') || [];
        tracks.push(track);
        tracksStore.set('tracks', tracks);

        return track;
    } catch (error) {
        console.error(`[Downloader] Critical error for ${id}:`, error);

        const audioFile = path.join(AUDIO_DIR, `${id}.mp3`);
        try {
            fs.unlinkSync(audioFile);
        } catch {
            // Ignored
        }

        const tracks = tracksStore.get('tracks') || [];
        if (tracks.some(t => t.id === id)) {
            tracksStore.set('tracks', tracks.filter(t => t.id !== id));
        }

        throw new Error(error.message || 'download_error');
    }
};

export const getDefProfile = (): Profile => ({
    id: generateUUID(),
    name: 'Default',
    rows: 8,
    cols: 10,
    buttons: []
});

export const fixActiveProfile = () => {
    const profiles = profilesStore.get('profiles') || [];
    const activeProfileId = settingsStore.get('activeProfile');

    if (profiles.length === 0) {
        console.log('[Main] No profiles found, creating default profile...');

        profiles.push(getDefProfile());
        profilesStore.set('profiles', profiles);
    }

    if (!activeProfileId || !profiles.find(p => p.id === activeProfileId)) {
        console.log('[Main] Active profile not set or invalid, setting to first profile...');
        settingsStore.set('activeProfile', profiles[0].id);
        console.log(`[Main] Active profile set to: ${profilesStore.get('profiles')[0].name}`);
    }
}

export const broadcastSettings = (settings: Settings) => {
    BrowserWindow.getAllWindows().forEach(win => {
        if (!win.isDestroyed()) win.webContents.send('settings', settings);
    });
}

export const broadcastProfiles = (profiles: Profile[]) => {
    const sbProfiles = profiles.map(profile => convertProfileToSbProfile(profile));
    BrowserWindow.getAllWindows().forEach(win => {
        if (!win.isDestroyed()) win.webContents.send('profiles', sbProfiles);
    });
}