import {Tracks, TracksSchema} from "../../types/data";
import {createValidatedStore} from "./store";
import Store from "electron-store";

export const tracksStore: Store<Tracks> = createValidatedStore<Tracks>(
    'tracks',
    TracksSchema
);