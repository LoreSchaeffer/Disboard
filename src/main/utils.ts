import {BrowserWindow, net} from "electron";
import {state} from "./state";
import path from "path";
import fs from "node:fs";
import {AUDIO_DIR, IMAGES_DIR} from "./constants";
import {Settings} from "../types/settings";
import {Profile, Source, Track} from "../types/data";
import {generateUUID} from "./utils/utils";
import {extractCoverImage, fetchTitle, saveAsMp3} from "./utils/ffmpeg";
import {tracksStore} from "./utils/store";

const ytStreamCache = new Map<string, string>();

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

export const downloadTrack = async (uri: string, source: Source, title?: string): Promise<Track> => {
    const id = generateUUID();
    let duration = 0;

    try {
        duration = await saveAsMp3(uri, AUDIO_DIR, id);
    } catch (e) {
        const file = path.join(AUDIO_DIR, `${id}.mp3`);
        if (fs.existsSync(file)) fs.unlinkSync(file);
        throw new Error(e.message || 'download_error');
    }

    try {
        await extractCoverImage(uri, IMAGES_DIR, id);
    } catch {
        const file = path.join(IMAGES_DIR, `${id}.jpg`);
        if (fs.existsSync(file)) fs.unlinkSync(file);
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

// TODO Convert Profile to SbProfile before broadcasting
export const broadcastProfiles = (profiles: Profile[]) => {
    BrowserWindow.getAllWindows().forEach(win => {
        if (!win.isDestroyed()) win.webContents.send('profiles', profiles);
    });
}

// TODO Broadcast profiles if tracks are changed

