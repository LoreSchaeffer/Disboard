import {Tracks, TracksSchema} from "../../types";
import {createValidatedStore} from "./store";
import Store from "electron-store";
import {broadcastData} from "../utils/broadcast";

export const tracksStore: Store<Tracks> = createValidatedStore<Tracks>(
    'tracks',
    TracksSchema,
    (tracks: Tracks) => broadcastData('tracks:changed', tracks.tracks)
);