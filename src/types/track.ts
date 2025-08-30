export type Track = {
    title: string;
    source: TrackSource;
    id?: string;
    original_url?: string;
    uri: string;
    duration: number;
    thumbnail: string;
    start_time?: number;
    start_time_unit?: TimeUnit;
    end_time_type?: EndTimeType;
    end_time?: number;
    end_time_unit?: TimeUnit;
    volume_override?: number;
}

export type TrackSource = 'local' | 'youtube' | 'remote' | 'epidemic';

export type TimeUnit = 'ms' | 's' | 'm';

export type EndTimeType = 'at' | 'after';