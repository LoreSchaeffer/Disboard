import {remoteMain} from "../remote-main";
import {Readable} from "node:stream";
import {net} from "electron";
import {state} from "../../../state";
import {settingsStore} from "../../../storage/settings-store";

export const setupThumbnailHandler = () => {

    remoteMain.handleHttp('thumbnail/', async (req, res, resId) => {
        const abortController = new AbortController();
        req.on('close', () => {
            if (!res.writableEnded) abortController.abort();
        });

        try {
            const fetchHeaders = new Headers();
            if (req.headers.range) {
                fetchHeaders.set('Range', req.headers.range);
            }

            const fetchOptions: RequestInit = {
                method: req.method,
                headers: fetchHeaders,
                signal: abortController.signal
            };

            let url;

            const currentTrack = state.currentMusicTrack;
            if (currentTrack?.id === resId) {
                if (!currentTrack.directStream) {
                    url = `disboard://thumbnail/${currentTrack.id}`;
                } else {
                    if (currentTrack.source.type === 'music_api') url = `${settingsStore.get('musicApi')}/api/tracks/cover/${currentTrack.id}`;
                    else if (currentTrack.source.type === 'youtube') url = currentTrack.source.thumbnail || `disboard://thumbnail/${resId}`;
                    else url = `disboard://thumbnail/${resId}`;
                }
            } else {
                url = `disboard://thumbnail/${resId}`;
            }

            const intRes = await net.fetch(url, fetchOptions);
            res.statusCode = intRes.status;

            intRes.headers.forEach((value, key) => res.setHeader(key, value));

            if (intRes.body) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const nodeStream = Readable.fromWeb(intRes.body as any);
                nodeStream.pipe(res);
            } else {
                res.end();
            }
        } catch (error: any) {
            if (error?.name === 'AbortError') return;

            console.error('[HttpApi] Thumbnail Proxy Handler Error:', error);
            if (!res.headersSent) {
                res.writeHead(500);
                res.end('Internal Server Error');
            }
        }
    });
}