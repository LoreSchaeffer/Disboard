import Store from 'electron-store';
import {z} from 'zod';
import * as fs from 'node:fs';
import {generateUUID} from "./utils";
import {Profiles, ProfilesSchema, Tracks, TracksSchema} from "../../types/data";
import {Settings, SettingsSchema} from "../../types/settings";
import {Cache, CacheSchema} from "../../types/cache";

function createValidatedStore<T>(name: string, schema: z.Schema<T>, defaults: T): Store<T> {
    const store = new Store<T>({
        name,
        watch: true,
        defaults
    });

    const validate = (source: string) => {
        const data = store.store;
        const result = schema.safeParse(data);

        if (!result.success) {
            console.error(`[Store: ${name}] Detected corruption (${source}):`, result.error);

            try {
                const backupPath = `${store.path}.corrupted-${Date.now()}.json`;
                fs.copyFileSync(store.path, backupPath);
                console.warn(`[Store: ${name}] Backup created at: ${backupPath}`);
            } catch (e) {
                console.error(`[Store: ${name}] Backup creation failed:`, e);
            }

            store.store = defaults;
            console.info(`[Store: ${name}] Recovered default value.`);
        } else {
            store.store = result.data;
        }
    };

    validate('startup');

    store.onDidAnyChange(() => validate('external-change'));

    return store;
}

export const settingsStore = createValidatedStore<Settings>(
    'settings',
    SettingsSchema,
    {
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
        musicApiCredentials: null,
        debug: false
    }
);

export const profilesStore = createValidatedStore<Profiles>(
    'profiles',
    ProfilesSchema,
    {
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
);

export const tracksStore = createValidatedStore<Tracks>(
    'tracks',
    TracksSchema,
    {
        tracks: []
    }
);

export const cacheStore = createValidatedStore<Cache>(
    'cache',
    CacheSchema,
    {
        profilesDir: null,
        audioDir: null
    }
);