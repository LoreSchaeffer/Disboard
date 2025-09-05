import {YouTubeVideo} from "play-dl";

export function getBiggestThumbnail(video: YouTubeVideo) {
    const thumbnails = video.thumbnails;
    let biggest = thumbnails[0];

    for (const thumbnail of thumbnails) {
        if (thumbnail.width > biggest.width) biggest = thumbnail;
    }

    return biggest;
}
