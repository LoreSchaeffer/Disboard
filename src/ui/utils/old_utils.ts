import {YouTubeVideo} from "play-dl";

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
