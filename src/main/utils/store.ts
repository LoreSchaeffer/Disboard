import Store from 'electron-store';
import { z } from 'zod';
import * as fs from 'node:fs';
import { generateUUID } from "./utils";
import { Profiles, ProfilesSchema, Tracks, TracksSchema } from "../../types/data";
import { Settings, SettingsSchema } from "../../types/settings";
import { Cache, CacheSchema } from "../../types/cache";
import {broadcastProfiles, broadcastSettings} from "../utils";

function createValidatedStore<T>(
    name: string,
    schema: z.Schema<T>,
    defaults: T,
    onExternalChange?: (newValue: T) => void
): Store<T> {
    const store = new Store<T>({
        name,
        watch: true,
        defaults
    });

    let lastKnownGoodState: T = defaults;
    let isInternalWrite = false;
    const originalSet = store.set;
    
    store.set = function (...args: never[]) {
        isInternalWrite = true;
        try {
            originalSet.apply(this, args);
        } finally {
            isInternalWrite = false;
        }
    };
    
    const originalReset = store.reset;
    store.reset = function (...args: never[]) {
        isInternalWrite = true;
        try { originalReset.apply(this, args); } finally { isInternalWrite = false; }
    };

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
                    console.error(`[Store: ${name}] CRITICAL: Config corrupted. Backup: ${backupPath}`);
                } catch {
                    // Ignored
                }

                store.store = defaults;
                lastKnownGoodState = defaults;
            } else {
                console.warn(`[Store: ${name}] Ignoring invalid external change. Reverting.`);

                isInternalWrite = true;
                store.store = lastKnownGoodState;
                isInternalWrite = false;
            }
        }
    };

    validate('startup');

    store.onDidAnyChange((newValue) => {
        if (isInternalWrite) return;

        console.log(`[Store: ${name}] External file change detected.`);
        
        validate('external-change');
        
        if (onExternalChange) onExternalChange(newValue as T);
    });

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
        confirmButtonDeletion: true,
        musicApi: 'https://ma.lycoris.it',
        musicApiCredentials: null,
        discord: {
            enabled: false,
            restPort: 24454,
            udpPort: 24455,
        },
        debug: false
    },
    (newValue) => {
        console.log('[Store: settings] Broadcasting settings change...');
        broadcastSettings(newValue);
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
    },
    (newValue) => {
        console.log('[Store: profiles] Broadcasting profiles change...');
        broadcastProfiles(newValue.profiles);
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