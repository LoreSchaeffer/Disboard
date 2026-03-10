import {app, net, protocol} from "electron";
import path from "path";
import {pathToFileURL} from "url";
import fs from "node:fs/promises";
import {ALL_MEDIA_FILES, THUMBNAILS_DIR, TRACKS_DIR} from "./constants";
import {isValidUUID} from "../shared/utils";

const isAllowedMediaFile = (filePath: string): boolean => {
    const ext = path.extname(filePath).toLowerCase().replace(/^\./, '');
    return ALL_MEDIA_FILES.includes(ext);
}

const getFallbackImagePath = (): string => {
    if (app.isPackaged) return path.join(__dirname, '../renderer/images/track.png');
    return path.join(process.cwd(), 'public', 'images', 'track.png');
};

const fileExistsAsync = async (filePath: string): Promise<boolean> => {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

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

export const setupProtocolHandlers = () => {
    protocol.handle('disboard', async (request: Request): Promise<Response> => {
        try {
            const parsedUrl = new URL(request.url);
            const urlPath = parsedUrl.hostname;
            const resource = decodeURIComponent(parsedUrl.pathname.slice(1));

            let localPath: string | null = null;

            switch (urlPath) {
                case 'track':
                    if (!isValidUUID(resource)) return new Response('Bad Request: Invalid ID format', {status: 400});

                    localPath = path.join(TRACKS_DIR, `${resource}.mp3`);
                    break;
                case 'thumbnail':
                    if (!isValidUUID(resource)) return new Response('Bad Request: Invalid ID format', {status: 400});

                    localPath = path.join(THUMBNAILS_DIR, `${resource}.jpg`);

                    if (!(await fileExistsAsync(localPath))) localPath = getFallbackImagePath();
                    break;
                case 'file':
                    if (!isAllowedMediaFile(resource)) {
                        console.warn(`[Protocol] Security block: Attempted to load non-media file -> ${resource}`);
                        return new Response('Forbidden: Invalid file type', {status: 403});
                    }

                    localPath = resource;
                    break;
                default:
                    console.warn(`[Protocol] 400 Bad Request: Unknown resource type ${urlPath}`);
                    return new Response('Invalid resource type', {status: 400});
            }

            if (!localPath || !(await fileExistsAsync(localPath))) return new Response('File not found', {status: 404});

            return net.fetch(pathToFileURL(localPath).toString());
        } catch (error) {
            console.error('[Protocol] Error handling request:', error);
            return new Response('Internal Server Error', {status: 500});
        }
    });
};