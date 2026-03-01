import path from "path";
import fs from "node:fs";
import axios from "axios";
import {AUDIO_DIR, IMAGES_DIR, USER_AGENT} from "../constants";
import sharp from "sharp";
import {Source, Track} from "../../types/data";
import {determineTitle, extractCoverImage, processAudio} from "./ffmpeg";
import {tracksStore} from "./store";

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