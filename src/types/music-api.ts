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