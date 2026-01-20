import ffmpeg from 'fluent-ffmpeg';
import * as fs from "node:fs";
import path from "path";

export const saveAsMp3 = async (inputSource: string, outputDir: string, trackId: string): Promise<number> => {
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, {recursive: true});

    const outputPath = path.join(outputDir, `${trackId}.mp3`);

    return new Promise((resolve, reject) => {
        ffmpeg(inputSource)
            .noVideo()
            .audioCodec('libmp3lame')
            .format('mp3')
            .audioBitrate(256)
            .on('start', (commandLine) => console.log('FFmpeg start:', commandLine))
            .on('error', (err) => {
                console.error('FFmpeg error:', err);
                reject(err);
            })
            .on('end', () => {
                ffmpeg.ffprobe(outputPath, (err, metadata) => {
                    if (err) {
                        resolve(0);
                        return;
                    }

                    const durationSec = metadata.format?.duration || 0;
                    const durationMs = Math.round(durationSec * 1000);

                    resolve(durationMs);
                });
            })
            .save(outputPath);
    })
}

export const fetchTitle = (inputSource: string): Promise<string | null> => {
    return new Promise((resolve) => {
        ffmpeg.ffprobe(inputSource, (err, data) => {
            if (err) {
                resolve(null);
            } else {
                const tags = data?.format?.tags || {};
                const title = tags.title || tags.TITLE || null;
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
            .outputOptions([
                '-an',
                '-vcodec copy',
                '-vframes 1',
                '-y'
            ])
            .format('image2')
            .on('error', () => resolve(false))
            .on('end', () => resolve(true))
            .save(outputPath);
    });
};