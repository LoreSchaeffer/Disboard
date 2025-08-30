import play, {setToken, stream, video_info, YouTubeVideo} from "play-dl";
import ytdl from "@distube/ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import {media} from "../main";

export const initYouTube = (cookie: string) => {
    if (!fs.existsSync(media)) fs.mkdirSync(media);

    if (cookie != null && cookie.trim()) {
        setToken({youtube: {cookie: cookie}}).then(() => console.log('YouTube cookie set'));
    }
}

export const search = async (query: string): Promise<YouTubeVideo[]> => {
    if (query == null || query.trim() === '') return [];

    try {
        // eslint-disable-next-line import/no-named-as-default-member
        return await play.search(query, {limit: 20});
    } catch (e) {
        console.error(e.message);
        return [];
    }
}

export const getInfo = async (url: string): Promise<YouTubeVideo | null> => {
    if (url == null || url.trim() === '') return null;

    try {
        return (await video_info(url)).video_details;
    } catch (e) {
        console.error(e.message);
        return null;
    }
}

export const getStream = async (url: string): Promise<string | null> => {
    if (url == null || url.trim() === '') return null;

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (await stream(url, {discordPlayerCompatibility: true}) as any).url
    } catch (e) {
        console.error(e.message);
        return null;
    }
}

export const download = async (title: string, id: string, url: string): Promise<string> => {
    if (url == null || url.trim() === '') throw new Error("invalid_url");

    const stream = ytdl(url, {filter: 'audioonly', quality: 'highestaudio'});
    const filePath = path.join(media, `${id} - ${title}.mp3`);

    if (fs.existsSync(filePath)) return filePath;

    return new Promise((resolve, reject) => {
        ffmpeg(stream)
            .audioCodec('libmp3lame')
            .toFormat('mp3')
            .on('progress', (progress: { percent?: number }) => {
                if (progress.percent !== undefined) {
                    const percent = progress.percent.toFixed(2);
                    console.log(`Downloading '${title}': ${percent}%`);
                }
            })
            .on('end', () => {
                console.log(`Downloaded '${title}'`);
                resolve(filePath);
            })
            .on('error', (e: Error) => {
                console.error(`Error downloading '${title}': ${e.message}`);
                reject(new Error(e.message));
            })
            .save(filePath);
    });
}