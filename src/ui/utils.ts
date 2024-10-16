import {Profile, SbButton} from "../utils/store/profiles";
import {YouTubeVideo} from "play-dl";

export function getButton(profile: Profile, row: number, col: number): SbButton | null {
    if (!profile) return null;
    return profile.buttons.find(b => b.row === row && b.col === col);
}

export function isRemoteUrl(uri: string): boolean {
    return uri.startsWith('https://');
}

export function isYouTubeUrl(uri: string): boolean {
    return isRemoteUrl(uri) && yt_validate(uri) === 'video';
}

export function formatTime(time: number): string {
    time = Math.floor(time / 1000);

    const hours = Math.floor(time / 3600);
    const minutes = Math.floor(time / 60) % 60;
    const seconds = time % 60;

    let formatted = '';
    if (hours > 0) formatted += hours + ':';
    formatted += minutes.toString().padStart(2, '0') + ':';
    formatted += seconds.toString().padStart(2, '0');

    return formatted;
}

export function validateHexColor(color: string): boolean {
    return /^#[0-9A-F]{6}$/i.test(color) || /^#[0-9A-F]{3}$/i.test(color);
}

export function getBiggestThumbnail(video: YouTubeVideo) {
    const thumbnails = video.thumbnails;
    let biggest = thumbnails[0];

    for (const thumbnail of thumbnails) {
        if (thumbnail.width > biggest.width) biggest = thumbnail;
    }

    return biggest;
}

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