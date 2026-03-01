import {Tracks, TracksSchema} from "../../types";
import {createValidatedStore} from "./store";
import Store from "electron-store";

export const tracksStore: Store<Tracks> = createValidatedStore<Tracks>(
    'tracks',
    TracksSchema
);