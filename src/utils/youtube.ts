import play, {YouTubeVideo} from "play-dl";
import ytdl from "@distube/ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import {app} from "electron";

export function initYouTube() {
    const media = path.join(app.getPath('userData'), 'media');
    if (!fs.existsSync(media)) fs.mkdirSync(media);
}

export async function search(query: string): Promise<YouTubeVideo[]> {
    return new Promise<YouTubeVideo[]>((resolve, reject) => {
        if (query == null || query.trim() === '') resolve([]);
        play.search(query, {limit: 20}).then((results) => {
            resolve(results);
        });
    });
}

export async function download(title: string, id: string, url: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        if (url == null || url.trim() === '') reject('invalid_url');

        const stream = ytdl(url, {filter: 'audioonly', quality: 'highestaudio'});

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
                resolve(id);
            })
            .on('error', (err: any) => {
                console.error(`Error downloading '${title}': ${err.message}`);
                reject(err.message);
            })
            .save(path.join(app.getPath('userData'), 'media', `${id}.mp3`));
    });
}