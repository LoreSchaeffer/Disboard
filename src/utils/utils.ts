import * as crypto from 'crypto';

export const generateUUID = (): string => {
    return crypto.randomUUID();
}

export const clamp = (num: number, min: number, max: number): number => {
    return Math.min(Math.max(num, min), max);
}

export const isRemoteUrl = (uri: string): boolean => {
    return uri.startsWith('https://') || uri.startsWith('http://');
}

export const isYouTubeUrl = (uri: string): boolean => {
    return isRemoteUrl(uri) && yt_validate(uri);
}

// Included from play-dl (GPL-3.0 license) because the default
// implementation doesn't work inside the renderer process.

const video_id_pattern = /^[a-zA-Z\d_-]{11,12}$/;
const playlist_id_pattern = /^(PL|UU|LL|RD|OL)[a-zA-Z\d_-]{10,}$/;
const video_pattern = /^((?:https?:)?\/\/)?(?:(?:www|m|music)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|shorts\/|embed\/|live\/|v\/)?)([\w\-]+)(\S+)?$/;
const playlist_pattern = /^((?:https?:)?\/\/)?(?:(?:www|m|music)\.)?((?:youtube\.com|youtu.be))\/(?:(playlist|watch))?(.*)?((\?|\&)list=)(PL|UU|LL|RD|OL)[a-zA-Z\d_-]{10,}(&.*)?$/;

function yt_validate(url: string): 'playlist' | 'video' | 'search' | false {
    const url_ = url.trim();
    if (url_.indexOf('list=') === -1) {
        if (url_.startsWith('https')) {
            if (url_.match(video_pattern)) {
                let id: string;
                if (url_.includes('youtu.be/')) id = url_.split('youtu.be/')[1].split(/(\?|\/|&)/)[0];
                else if (url_.includes('youtube.com/embed/'))
                    id = url_.split('youtube.com/embed/')[1].split(/(\?|\/|&)/)[0];
                else if (url_.includes('youtube.com/shorts/'))
                    id = url_.split('youtube.com/shorts/')[1].split(/(\?|\/|&)/)[0];
                else id = url_.split('watch?v=')[1]?.split(/(\?|\/|&)/)[0];
                if (id?.match(video_id_pattern)) return 'video';
                else return false;
            } else return false;
        } else {
            if (url_.match(video_id_pattern)) return 'video';
            else if (url_.match(playlist_id_pattern)) return 'playlist';
            else return 'search';
        }
    } else {
        if (!url_.match(playlist_pattern)) return yt_validate(url_.replace(/(\?|\&)list=[^&]*/, ''));
        else return 'playlist';
    }
}