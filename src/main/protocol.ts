import {net, protocol} from "electron";
import {AUDIO_DIR, IMAGES_DIR} from "./constants";
import path from "path";
import {pathToFileURL} from "url";

export const registerProtocols = () => {
    protocol.registerSchemesAsPrivileged([
        {
            scheme: 'music',
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
    protocol.handle('music', async (request: Request): Promise<Response> => {
        try {
            const parsedUrl = new URL(request.url);
            const type = parsedUrl.hostname;
            const resName = decodeURIComponent(parsedUrl.pathname.slice(1));

            let targetPath = '';
            if (type === 'audio') {
                targetPath = path.join(AUDIO_DIR, `${resName}.mp3`);
            } else if (type === 'images') {
                targetPath = path.join(IMAGES_DIR, `${resName}.jpg`);
            } else if (type === 'file') {
                targetPath = resName;
            } else {
                return new Response('Invalid resource type', {status: 400});
            }

            return net.fetch(pathToFileURL(targetPath).toString());
        } catch {
            return new Response('File not found', {status: 404});
        }
    });
};