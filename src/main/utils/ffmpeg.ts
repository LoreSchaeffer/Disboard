import ffmpeg from 'fluent-ffmpeg';
import fs from 'node:fs/promises';
import path from "path";
import {USER_AGENT} from "../constants";
import {ProbeResult, Track} from "../../types";
import {removeNameInvalidChars} from "../../shared/validation";

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

                const audioStream = data.streams?.find(s => s.codec_type === 'audio');

                resolve({
                    format: data.format?.format_name || '',
                    codec: audioStream?.codec_name || 'unknown',
                    // Forza SEMPRE la conversione a numero per evitare 'NaN' successivi
                    duration: Number(data.format?.duration) || 0,
                    tags: data.format?.tags || {}
                });
            });
    });
};

export const downloadAudio = async (inputSource: string, outputDir: string, trackId: string): Promise<number> => {
    await fs.mkdir(outputDir, {recursive: true});

    const tempPath = path.join(outputDir, `${trackId}.tmp`);
    const finalPath = path.join(outputDir, `${trackId}.mp3`);

    let probe: ProbeResult;
    try {
        probe = await probeMedia(inputSource);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        throw new Error(`[FFmpeg] Error processing source: ${errorMessage}`);
    }

    const isSourceMp3 = probe.codec === 'mp3';

    console.log(`[FFmpeg] Processing ${trackId}. Source Codec: ${probe.codec}. Strategy: ${isSourceMp3 ? 'DIRECT COPY' : 'TRANSCODE'}`);

    return new Promise((resolve, reject) => {
        const command = ffmpeg(inputSource).inputOptions(getInputOptions(inputSource));

        if (isSourceMp3) {
            command
                .outputOptions(['-c:a copy', '-map 0:a:0'])
                .format('mp3');
        } else {
            command
                .noVideo()
                .audioCodec('libmp3lame')
                .audioBitrate(256)
                .outputOptions([
                    '-threads 0'
                ])
                .format('mp3');
        }

        command
            .on('error', async (err) => {
                console.error(`[FFmpeg] Error processing ${trackId}:`, err);
                try {
                    await fs.unlink(tempPath);
                } catch {
                    // Ignored
                }
                reject(err);
            })
            .on('end', async () => {
                try {
                    await fs.rename(tempPath, finalPath);
                    resolve(Math.round(probe.duration * 1000));
                } catch (renameErr) {
                    reject(renameErr);
                }
            })
            .save(tempPath);
    });
};

export const extractCoverImage = async (inputSource: string, outputDir: string, trackId: string): Promise<void> => {
    const dstFile = path.join(outputDir, `${trackId}.jpg`);

    try {
        await fs.mkdir(outputDir, {recursive: true});
    } catch (e) {
        return Promise.reject(e);
    }

    return new Promise((resolve, reject) => {
        ffmpeg(inputSource)
            .inputOptions(getInputOptions(inputSource))
            .outputOptions([
                '-an',
                '-vframes 1',
                '-q:v 2',
                '-y'
            ])
            .format('image2')
            .on('error', async (e) => {
                let cleanError = e.message;

                if (e.message.includes('does not contain any stream')) cleanError = 'No embedded cover art found.';
                else if (e.message.includes('No such file or directory')) cleanError = 'Source audio file not found on disk.';
                else cleanError = e.message.split('\n')[0];
                console.info(`[FFmpeg] Skipped thumbnail for ${trackId}: ${cleanError}`);

                try {
                    await fs.unlink(dstFile);
                } catch {
                    // Ignored
                }

                // Rigettiamo un nuovo errore pulito
                reject(new Error(cleanError));
            })
            .on('end', () => resolve())
            .save(dstFile);
    });
};

export const determineTitle = async (track: Track): Promise<string> => {
    try {
        const probe = await probeMedia(track.source.src);
        const tagTitle = probe.tags?.title || probe.tags?.TITLE || probe.tags?.Title;

        if (tagTitle && typeof tagTitle === 'string' && tagTitle.trim().length > 0) return tagTitle.trim();
    } catch {
        // Ignored
    }

    try {
        const isUrl = track.source.src.startsWith('http');
        let cleanPath: string;

        if (isUrl) {
            const urlObj = new URL(track.source.src);
            cleanPath = decodeURIComponent(urlObj.pathname);
        } else {
            cleanPath = track.source.src;
        }

        const nameWithoutExt = path.parse(cleanPath).name;
        return removeNameInvalidChars(nameWithoutExt) || 'Unknown Title';
    } catch {
        return 'Unknown Title';
    }
};