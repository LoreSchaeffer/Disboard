import {RepeatMode} from "./common";

export type Settings = {
    width: number;
    height: number;
    volume: number;
    previewVolume: number;
    outputDevice: string;
    previewOutputDevice: string;
    repeat: RepeatMode;
    activeProfile: string | null;
    zoom: number;
    showImages: boolean;
    musicApi: string;
    musicApiCredentials: ApiCredentials;
    debug: boolean;
}

export type ApiCredentials = {
    clientId: string;
    clientSecret: string;
}