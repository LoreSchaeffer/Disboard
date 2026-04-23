export type YTSearchResult = {
    id: string;
    name: string;
    uploaderName: string;
    url: string;
    thumbnails: {url: string; width: number; height: number}[];
    duration: number;
}

export type YTStream = {
    bitrate: number;
    codec: string;
    content: string;
}

export type Playlist = {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
    has_cover: boolean;
    size: number;
}

export type PlaylistTrack = {
    track: MATrack;
    track_order: number;
}

export type MATrack = {
    id: string;
    title: string;
    artists: string[];
    album: string;
    year: number;
    track_number: number;
    total_tracks: number
    duration: number;
    added_at: string;
}