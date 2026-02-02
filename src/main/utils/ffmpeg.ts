import ffmpeg from 'fluent-ffmpeg';
import * as fs from "node:fs";
import path from "path";
import {removeNameInvalidChars} from "./validation";
import {USER_AGENT} from "../utils";

type ProbeResult = {
    format: string;
    codec: string;
    duration: number;
    tags: Record<string, string | number>;
}

const getInputOptions = (inputSource: string): string[] => {
    const isUrl = inputSource.startsWith('http');
    if (!isUrl) return [];

    return [
        '-headers', `User-Agent: ${USER_AGENT}`,
        '-reconnect', '1',
        '-reconnect_streamed', '1',
        '-reconnect_delay_max', '5'
    ];
};

export const probeMedia = (inputSource: string): Promise<ProbeResult> => {
    return new Promise((resolve, reject) => {
        ffmpeg(inputSource)
            .inputOptions(getInputOptions(inputSource))
            .ffprobe((err, data) => {
                if (err) {
                    console.warn(`[FFmpeg] Probe error for ${inputSource}:`, err.message);
                    return reject(err);
                }

                const audioStream = data.streams.find(s => s.codec_type === 'audio');

                resolve({
                    format: data.format.format_name || '',
                    codec: audioStream?.codec_name || 'unknown',
                    duration: data.format.duration || 0,
                    tags: data.format.tags || {}
                });
            });
    });
};

export const processAudio = async (inputSource: string, outputDir: string, trackId: string): Promise<number> => {
    fs.mkdirSync(outputDir, {recursive: true});

    const tempPath = path.join(outputDir, `${trackId}.tmp`);
    const finalPath = path.join(outputDir, `${trackId}.mp3`);

    let probe: ProbeResult;
    try {
        probe = await probeMedia(inputSource);
    } catch (e) {
        throw new Error(`[FFmpeg] Error processing source: ${e.message}`);
    }

    const isSourceMp3 = probe.codec === 'mp3';

    console.log(`[FFmpeg] Processing ${trackId}. Source Codec: ${probe.codec}. Strategy: ${isSourceMp3 ? 'DIRECT COPY' : 'TRANSCODE'}`);

    return new Promise((resolve, reject) => {
        const command = ffmpeg(inputSource).inputOptions(getInputOptions(inputSource));

        if (isSourceMp3) {
            command
                .outputOptions(['-c:a copy', '-map a'])
                .format('mp3');
        } else {
            command
                .noVideo()
                .audioCodec('libmp3lame')
                .audioBitrate(256)
                .outputOptions([
                    '-threads 0',
                    '-compression_level 2'
                ])
                .format('mp3');
        }

        command
            .on('error', async (err) => {
                console.error(`[FFmpeg] Error processing ${trackId}:`, err);

                try {
                    fs.unlinkSync(tempPath);
                } catch {
                    // Ignored
                }

                reject(err);
            })
            .on('end', async () => {
                try {
                    fs.renameSync(tempPath, finalPath);
                    resolve(Math.round(probe.duration * 1000));
                } catch (renameErr) {
                    reject(renameErr);
                }
            })
            .save(tempPath);
    });
};

export const extractCoverImage = async (inputSource: string, outputDir: string, trackId: string): Promise<boolean> => {
    fs.mkdirSync(outputDir, {recursive: true});
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

export const determineTitle = async (uri: string, providedTitle?: string): Promise<string> => {
    if (providedTitle) return providedTitle;

    try {
        const probe = await probeMedia(uri);
        const tagTitle = probe.tags?.title || probe.tags?.TITLE || probe.tags?.Title;
        if (tagTitle && typeof tagTitle === 'string' && tagTitle.trim().length > 0) {
            return tagTitle;
        }
    } catch {
        // Ignored
    }

    try {
        const isUrl = uri.startsWith('http');
        const baseName = path.basename(uri);

        if (isUrl) {

            const decodedName = decodeURIComponent(baseName).split('?')[0];
            const nameWithoutExt = decodedName.replace(/\.[^/.]+$/, "");
            return removeNameInvalidChars(nameWithoutExt) || 'Unknown Title';
        } else {

            const nameWithoutExt = path.parse(uri).name;
            return removeNameInvalidChars(nameWithoutExt) || 'Unknown Title';
        }
    } catch {
        return 'Unknown Title';
    }
};