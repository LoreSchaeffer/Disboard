import Store from "electron-store";
import {createValidatedStore} from "./store";
import {Cache, CacheSchema} from "../../types/cache";

export const cacheStore: Store<Cache> = createValidatedStore<Cache>(
    'cache',
    CacheSchema
);