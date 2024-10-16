import play, {setToken, stream, video_info, YouTubeVideo} from "play-dl";
import ytdl from "@distube/ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import {app} from "electron";

export function initYouTube(cookie: string) {
    const media = path.join(app.getPath('userData'), 'media');
    if (!fs.existsSync(media)) fs.mkdirSync(media);
    setToken({
        youtube: {
            cookie: cookie
        }
    });
}

export async function search(query: string): Promise<YouTubeVideo[]> {
    return new Promise<YouTubeVideo[]>((resolve) => {
        if (query == null || query.trim() === '') resolve([]);
        play.search(query, {limit: 20}).then((results) => {
            resolve(results);
        });
    });
}

export async function getInfo(url: string): Promise<YouTubeVideo> {
    return new Promise<YouTubeVideo>((resolve) => {
        video_info(url).then((info) => resolve(info.video_details));
    });
}

export function getStream(url: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        try {
            stream(url, {
                discordPlayerCompatibility: true
            }).then((stream) => resolve((stream as any).url));
        } catch (e) {
            reject(e);
        }
    });
}

export async function download(title: string, id: string, url: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        if (url == null || url.trim() === '') reject('invalid_url');

        const stream = ytdl(url, {filter: 'audioonly', quality: 'highestaudio'});
        const filePath = path.join(app.getPath('userData'), 'media', `${id}.mp3`);

        ffmpeg(stream)
            .audioCodec('libmp3lame')
            .toFormat('mp3')
            .on('progress', (progress: any) => {
                if (progress.percent !== undefined) {
                    const percent = progress.percent.toFixed(2);
                    console.log(`Downloading '${title}': ${percent}%`);
                }
            })
            .on('end', () => {
                console.log(`Downloaded '${title}'`);
                resolve(filePath);
            })
            .on('error', (err: any) => {
                console.error(`Error downloading '${title}': ${err.message}`);
                reject(err.message);
            })
            .save(filePath);
    });
}