import {app, net, protocol} from "electron";
import path from "path";
import {pathToFileURL} from "url";
import fs from "node:fs";
import {THUMBNAILS_DIR, TRACKS_DIR} from "./constants";

const getFallbackImagePath = (): string => {
    if (app.isPackaged) return path.join(__dirname, '../renderer/images/track.png');
    return path.join(process.cwd(), 'public', 'images', 'track.png');
};

export const registerProtocols = () => {
    protocol.registerSchemesAsPrivileged([
        {
            scheme: 'disboard',
            privileges: {
                secure: true,
                standard: true,
                supportFetchAPI: true,
                stream: true,
                bypassCSP: false,
                corsEnabled: true
            }
        }
    ]);
}

// TODO Change path names
export const setupProtocolHandlers = () => {
    protocol.handle('disboard', async (request: Request): Promise<Response> => {
        try {
            const parsedUrl = new URL(request.url);
            const type = parsedUrl.hostname;
            const resName = decodeURIComponent(parsedUrl.pathname.slice(1));

            let targetPath = '';

            if (type === 'audio') {
                targetPath = path.join(TRACKS_DIR, `${resName}.mp3`);
            } else if (type === 'images') {
                targetPath = path.join(THUMBNAILS_DIR, `${resName}.jpg`);

                try {
                    await fs.promises.access(targetPath);
                } catch {
                    return net.fetch(`file://${getFallbackImagePath()}`);
                }
            } else if (type === 'file') {
                targetPath = resName;
            } else {
                console.warn(`[Protocol] 400 Bad Request: Unknown resource type ${type}`);
                return new Response('Invalid resource type', { status: 400 });
            }

            if (!fs.existsSync(targetPath)) {
                return new Response('File not found', { status: 404 });
            }

            return net.fetch(pathToFileURL(targetPath).toString());
        } catch (error) {
            console.error('[Protocol] Error handling request:', error);
            return new Response('Internal Server Error', { status: 500 });
        }
    });
};