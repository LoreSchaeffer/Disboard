import {BrowserWindow, net} from "electron";
import {state} from "./state";
import path from "path";
import fs from "node:fs";
import {AUDIO_DIR, IMAGES_DIR} from "./constants";
import {Settings} from "../types/settings";
import {Profile, Source, Track} from "../types/data";
import {extractCoverImage, fetchTitle, saveAsMp3} from "./utils/ffmpeg";
import {tracksStore} from "./utils/store";
import axios from "axios";
import {pipeline} from 'stream/promises';
import {convertProfileToSbProfile} from "./utils/data";

const ytStreamCache = new Map<string, string>();

const downloadImageFromUrl = async (url: string, outputDir: string, trackId: string): Promise<boolean> => {
    if (!url || !url.startsWith('http')) return false;

    try {
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, {recursive: true});

        const outputPath = path.join(outputDir, `${trackId}.jpg`);
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'
            },
            timeout: 20000
        });

        const fileWriter = fs.createWriteStream(outputPath);
        await pipeline(response.data, fileWriter);

        return true;
    } catch (error) {
        console.warn(`Failed to download cover for ${trackId}:`, error instanceof Error ? error.message : error);

        const outputPath = path.join(outputDir, `${trackId}.jpg`);
        if (fs.existsSync(outputPath)) {
            try {
                fs.unlinkSync(outputPath);
            } catch {
                // Ignore
            }
        }

        return false;
    }
}

export const getYoutubeStream = async (videoId: string): Promise<string> => {
    const cachedStream = ytStreamCache.get(videoId);

    if (cachedStream) {
        try {
            const response = await net.fetch(cachedStream, {method: 'HEAD'});

            if (response.status >= 200 && response.status < 400) return cachedStream;
            else ytStreamCache.delete(videoId);
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
    let duration = 0;

    try {
        duration = await saveAsMp3(uri, AUDIO_DIR, id);
    } catch (e) {
        const file = path.join(AUDIO_DIR, `${id}.mp3`);
        if (fs.existsSync(file)) fs.unlinkSync(file);

        const tracks = tracksStore.get('tracks');
        if (tracks.findIndex(t => t.id === id) !== -1) tracksStore.set('tracks', tracks.filter(t => t.id !== id));

        throw new Error(e.message || 'download_error');
    }

    if (source.type === 'youtube') {
        if (cover) {
            await downloadImageFromUrl(cover, IMAGES_DIR, id);
        }
    } else {
        try {
            await extractCoverImage(uri, IMAGES_DIR, id);
        } catch {
            const file = path.join(IMAGES_DIR, `${id}.jpg`);
            if (fs.existsSync(file)) {
                try {
                    fs.unlinkSync(file);
                } catch {
                    // Ignore
                }
            }
        }
    }

    if (!title) {
        try {
            title = await fetchTitle(uri);
            if (!title) throw new Error();
        } catch {
            title = 'Unknown Title';
        }
    }

    const track = {
        id: id,
        source: source,
        title: title,
        duration: duration
    }

    const tracks = tracksStore.get('tracks');
    tracks.push(track);
    tracksStore.set('tracks', tracks);

    return track;
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

// TODO Broadcast profiles if tracks are changed

