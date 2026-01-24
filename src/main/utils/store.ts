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

    let lastKnownGoodState: T = defaults;

    const validate = (source: 'startup' | 'external-change') => {
        try {
            const data = store.store;

            const result = schema.safeParse(data);
            if (!result.success) throw new Error(`Schema mismatch: ${result.error.message}`);

            lastKnownGoodState = result.data;

            if (source === 'startup') store.store = result.data;
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            console.warn(`[Store: ${name}] Validation failed during '${source}': ${errorMessage}`);

            if (source === 'startup') {
                try {
                    const backupPath = `${store.path}.corrupted-${Date.now()}.json`;
                    fs.copyFileSync(store.path, backupPath);
                    console.error(`[Store: ${name}] CRITICAL: Config corrupted on startup. Backup created at: ${backupPath}`);
                } catch (backupErr) {
                    console.error(`[Store: ${name}] Backup creation failed:`, backupErr);
                }

                store.store = defaults;
                lastKnownGoodState = defaults;
                console.info(`[Store: ${name}] Recovered default value.`);

            } else {
                console.warn(`[Store: ${name}] Ignoring invalid external change. Reverting in-memory store to last known good state.`);
                store.store = lastKnownGoodState;
            }
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
        discord: {
            enabled: false,
            joinAutomatically: false,
        },
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