export type Track = {
    id: string;
    source: Source;
    title: string;
    duration: number;
    volume?: number;
}

export type Source = {
    source: 'file' | 'url' | 'youtube'
    originalPath?: string;
    url?: string;
    videoId?: string;
}