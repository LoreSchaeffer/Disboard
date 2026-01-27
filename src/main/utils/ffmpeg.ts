import ffmpeg from 'fluent-ffmpeg';
import * as fs from "node:fs";
import path from "path";

const getInputOptions = (inputSource: string): string[] => {
    const isUrl = inputSource.startsWith('http');
    if (!isUrl) return [];

    return [
        '-headers', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
        '-reconnect', '1',
        '-reconnect_streamed', '1',
        '-reconnect_delay_max', '5'
    ];
};

export const saveAsMp3 = async (inputSource: string, outputDir: string, trackId: string): Promise<number> => {
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, {recursive: true});
    const outputPath = path.join(outputDir, `${trackId}.mp3`);

    return new Promise((resolve, reject) => {
        ffmpeg(inputSource)
            .inputOptions(getInputOptions(inputSource))
            .noVideo()
            .audioCodec('libmp3lame')
            .format('mp3')
            .audioBitrate(256)
            .on('start', () => console.log(`[FFmpeg] Starting download of track ${trackId}...`))
            .on('error', (err) => {
                console.error(`[FFmpeg] Download of track ${trackId} failed...`, err);
                reject(err);
            })
            .on('end', () => {
                ffmpeg.ffprobe(outputPath, (err, metadata) => {
                    if (err) {
                        resolve(0);
                        return;
                    }
                    const durationSec = metadata.format?.duration || 0;
                    resolve(Math.round(durationSec * 1000));
                });
            })
            .save(outputPath);
    });
}

export const fetchTitle = (inputSource: string): Promise<string | null> => {
    return new Promise((resolve) => {
        ffmpeg.ffprobe(inputSource, (err, data) => {
            if (err) {
                console.warn(`[FFmpeg] An error occurred fetching ${inputSource} title:`, err.message);
                resolve(null);
            } else {
                const tags = data?.format?.tags || {};
                const title = tags.title || tags.TITLE || tags.Title || null;
                resolve(typeof title === 'number' ? title.toString() : title);
            }
        });
    });
};

export const extractCoverImage = (inputSource: string, outputDir: string, trackId: string): Promise<boolean> => {
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, {recursive: true});
    const outputPath = path.join(outputDir, `${trackId}.jpg`);

    return new Promise((resolve) => {
        ffmpeg(inputSource)
            .inputOptions(getInputOptions(inputSource))
            .outputOptions([
                '-an',
                '-vframes 1',
                '-q:v 2',
                '-y'
            ])
            .format('image2')
            .on('error', (err) => {
                console.log(`[FFmpeg] No cover found or extraction error for track ${trackId}:`, err.message);
                resolve(false);
            })
            .on('end', () => resolve(true))
            .save(outputPath);
    });
};