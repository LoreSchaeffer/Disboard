import {TrackSource} from "./common";
import {CropOptions} from "./profiles";

export type Tracks = {
    tracks: Track[];
}

export type Track = {
    id: string;
    source: Source;
    title: string;
    duration: number;
}

export type Source = {
    type: Exclude<TrackSource, 'list'>;
    src?: string;
}

export type PlayerTrack = Track & {
    cropOptions?: CropOptions;
}