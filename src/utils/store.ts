import Store from 'electron-store';
import {generateUUID} from "./utils";
import {Settings} from "../types/settings";
import {Profiles} from "../types/profiles";
import {Tracks} from "../types/track";

const settingsStore = new Store<Settings>({
    name: 'settings',
    watch: true,
    defaults: {
        width: 1366,
        height: 768,
        volume: 50,
        previewVolume: 50,
        outputDevice: 'default',
        previewOutputDevice: 'default',
        repeat: 'none',
        zoom: 1,
        showImages: true,
        activeProfile: null,
        musicApi: 'https://ma.lycoris.it',
        musicApiCredentials: undefined,
        debug: false
    },
    // migrations: {
    //     '1.0.1': store => {
    //         store.set('debug', false);
    //     }
    // }
});

const profilesStore = new Store<Profiles>({
    name: 'profiles',
    watch: true,
    defaults: {
        profiles: [
            {
                id: generateUUID(),
                name: 'Default',
                rows: 8,
                cols: 10,
                buttons: []
            }
        ]
    }
});

const cacheStore = new Store<Cache>({
    name: 'cache',
    watch: true,
});

const tracksStore = new Store<Tracks>({
    name: 'tracks',
    watch: true,
    defaults: {
        tracks: []
    }
});

export {settingsStore, profilesStore, cacheStore, tracksStore};