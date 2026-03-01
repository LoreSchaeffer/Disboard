import Store from "electron-store";
import {z} from "zod";
import {CONFIG_DATA} from "../constants";
import fs from "node:fs";

export const createValidatedStore = <T extends Record<string, unknown>>(
    name: string,
    schema: z.Schema<T>,
    onExternalChange?: (newValue: T) => void,
    def?: T
): Store<T> => {
    let defaults: T;

    if (def) {
        defaults = def;
    } else {
        try {
            defaults = schema.parse({});
        } catch (e) {
            console.error(`[Store: ${name}] CRITICAL: Failed to generate defaults from schema. Ensure schema supports empty object parsing or provide 'def' parameter.`, e);
            throw e;
        }
    }

    const store = new Store<T>({
        name,
        cwd: CONFIG_DATA,
        watch: true,
        defaults
    });

    let lastKnownGoodState: T = store.store;
    let isInternalWrite = false;

    const executeAsInternalWrite = <R>(action: () => R): R => {
        isInternalWrite = true;

        try {
            return action();
        } finally {
            isInternalWrite = false;
        }
    };

    const originalSet = store.set.bind(store);
    store.set = (...args: Parameters<typeof originalSet>) => {
        return executeAsInternalWrite(() => originalSet(...args));
    };

    const originalReset = store.reset.bind(store);
    store.reset = (...args: Parameters<typeof originalReset>) => {
        return executeAsInternalWrite(() => originalReset(...args));
    };

    const validate = (source: 'startup' | 'external-change') => {
        try {
            const data = store.store;
            const result = schema.safeParse(data);
            if (!result.success) throw new Error(`Schema mismatch: ${result.error.message}`);

            lastKnownGoodState = result.data;

            if (source === 'startup') {
                executeAsInternalWrite(() => {
                    store.store = result.data;
                });
            }
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            console.warn(`[Store: ${name}] Validation failed during '${source}': ${errorMessage}`);

            if (source === 'startup') {
                try {
                    const backupPath = `${store.path}.corrupted-${Date.now()}.json`;
                    fs.copyFileSync(store.path, backupPath);
                    console.error(`[Store: ${name}] CRITICAL: Config corrupted. Backup created at: ${backupPath}`);
                } catch (backupErr) {
                    console.error(`[Store: ${name}] Failed to create corruption backup.`, backupErr);
                }

                executeAsInternalWrite(() => {
                    store.store = defaults;
                });
                lastKnownGoodState = defaults;

            } else {
                console.warn(`[Store: ${name}] Ignoring invalid external change. Reverting to last known good state.`);
                executeAsInternalWrite(() => {
                    store.store = lastKnownGoodState;
                });
            }
        }
    };

    validate('startup');

    store.onDidAnyChange(() => {
        if (isInternalWrite) return;

        console.log(`[Store: ${name}] External file change detected.`);
        validate('external-change');

        if (onExternalChange) onExternalChange(lastKnownGoodState);
    });

    return store;
}