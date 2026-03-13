import ffmpeg from 'fluent-ffmpeg';
import fs from 'node:fs/promises';
import path from "path";
import {USER_AGENT} from "../constants";
import {ProbeResult, Track} from "../../types";
import {removeNameInvalidChars} from "../../shared/validation";
import axios, {isAxiosError} from "axios";
import {cacheStore} from "../storage/cache-store";
import {settingsStore} from "../storage/settings-store";
import {clamp} from "../../shared/utils";

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
                    duration: Number(data.format?.duration) || 0,
                    tags: data.format?.tags || {}
                });
            });
    });
};

const downloadChunkedAudio = async (url: string, destPath: string, trackId: string): Promise<void> => {
    const initRes = await axios.get(url, {
        headers: {Range: 'bytes=0-0', 'User-Agent': USER_AGENT}
    });

    const contentRange = initRes.headers['content-range'];
    if (!contentRange) throw new Error("Server does not support chunked downloading");

    const totalBytes = parseInt(contentRange.split('/')[1], 10);
    const chunkSize = 5 * 1024 * 1024;

    const fileHandle = await fs.open(destPath, 'w');

    try {
        for (let start = 0; start < totalBytes; start += chunkSize) {
            const end = Math.min(start + chunkSize - 1, totalBytes - 1);

            const res = await axios.get(url, {
                headers: {
                    Range: `bytes=${start}-${end}`,
                    'User-Agent': USER_AGENT
                },
                responseType: 'arraybuffer',
                timeout: 15000
            });

            await fileHandle.write(res.data);

            const netPercent = Math.round(((end + 1) / totalBytes) * 100);
            console.log(`[Network] progress ${trackId}: ${netPercent}%`);
        }
    } finally {
        await fileHandle.close();
    }
};

export const downloadAudio = async (inputSource: string, outputDir: string, trackId: string): Promise<number> => {
    await fs.mkdir(outputDir, {recursive: true});

    const isUrl = inputSource.startsWith('http');
    const rawTempPath = path.join(outputDir, `${trackId}.raw`);
    const ffmpegTempPath = path.join(outputDir, `${trackId}.tmp`);
    const finalPath = path.join(outputDir, `${trackId}.mp3`);
    let ffmpegSource = inputSource;

    if (isUrl) {
        console.log(`[Network] Starting high-speed chunked download for ${trackId}...`);
        try {
            await downloadChunkedAudio(inputSource, rawTempPath, trackId);
            ffmpegSource = rawTempPath;
            console.log(`[Network] Download complete. Handing over to FFmpeg.`);
        } catch (e) {
            console.error(`[Network] Chunked download failed, falling back to FFmpeg streaming:`, e.message);
            ffmpegSource = inputSource;
        }
    }

    let probe: ProbeResult;
    try {
        probe = await probeMedia(ffmpegSource);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        throw new Error(`[FFmpeg] Error processing source: ${errorMessage}`);
    }

    const isSourceMp3 = probe.codec === 'mp3';

    console.log(`[FFmpeg] Processing ${trackId}. Source Codec: ${probe.codec}. Strategy: ${isSourceMp3 ? 'DIRECT COPY' : 'TRANSCODE'}`);

    return new Promise((resolve, reject) => {
        const command = ffmpeg(ffmpegSource).inputOptions(getInputOptions(ffmpegSource));

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
                    '-threads 0',
                    '-q:a 2'
                ])
                .format('mp3');
        }

        const showProgress = settingsStore.get('debug') || false;
        let prevProgress: number = null;

        command
            .on('progress', (progress) => {
                if (!showProgress) return;

                if (progress.percent !== undefined) {
                    const currentProgress = clamp(Math.round(progress.percent), 0, 100);

                    if (currentProgress !== prevProgress) {
                        console.log(`[FFmpeg] Progress for ${trackId}: ${currentProgress}%`);
                        prevProgress = currentProgress;
                    }
                } else if (progress.timemark && probe.duration) {
                    const parts = progress.timemark.split(':');
                    if (parts.length === 3) {
                        const currentSeconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
                        const calculatedPercent = (currentSeconds / probe.duration) * 100;
                        const currentProgress = clamp(Math.round(calculatedPercent), 0, 100);

                        if (currentProgress !== prevProgress) {
                            console.log(`[FFmpeg] Progress for ${trackId}: ${currentProgress}%`);
                            prevProgress = currentProgress;
                        }
                    }
                }
            })
            .on('error', async (err) => {
                console.error(`[FFmpeg] Error processing ${trackId}:`, err);
                try {
                    await fs.unlink(ffmpegTempPath).catch(() => {
                        // Ignored
                    });
                    if (ffmpegSource === rawTempPath) await fs.unlink(rawTempPath).catch(() => {
                        // Ignored
                    });
                } catch {
                    // Ignored
                }
                reject(err);
            })
            .on('end', async () => {
                try {
                    await fs.rename(ffmpegTempPath, finalPath);
                    if (ffmpegSource === rawTempPath) {
                        await fs.unlink(rawTempPath).catch(() => {
                            // Ignored
                        });
                    }
                    resolve(Math.round(probe.duration * 1000));
                } catch (renameErr) {
                    reject(renameErr);
                }
            })
            .save(ffmpegTempPath);
    });
};

export const extractCoverImage = async (inputSource: string, outputDir: string, trackId: string): Promise<void> => {
    if (inputSource.startsWith('http')) {
        try {
            await axios.head(inputSource, {timeout: 5000});
        } catch (error) {
            let errorMessage = 'Unknown network error';
            if (isAxiosError(error)) {
                errorMessage = error.response
                    ? `HTTP ${error.response.status}`
                    : error.message;
            }

            const unreachableUrls = cacheStore.get('unreachableUrls') || [];
            if (!unreachableUrls.includes(inputSource)) {
                const unreachableUrls = cacheStore.get('unreachableUrls') || [];
                if (!unreachableUrls.includes(inputSource)) cacheStore.set('unreachableUrls', [...unreachableUrls, inputSource]);
            }

            return Promise.reject(new Error(`Source URL is unreachable: ${errorMessage}`));
        }
    }

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