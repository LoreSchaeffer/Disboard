export type Track = {
    id: string;
    source: Source;
    title: string;
    duration: number;
    cropOptions?: CropOptions;
    volume?: number;
}

export type Source = {
    source: 'file' | 'url' | 'youtube'
    originalPath?: string;
    url?: string;
    videoId?: string;
}

export type CropOptions = {
    startTime?: number;
    startTimeUnit?: TimeUnit;
    endTimeType?: EndTimeType;
    endTime?: number;
    endTimeUnit?: TimeUnit;
}

export type TimeUnit = 'ms' | 's' | 'm';

export type EndTimeType = 'at' | 'after';