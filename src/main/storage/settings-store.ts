import Store from "electron-store";
import {Settings, SettingsSchema} from "../../types";
import {createValidatedStore} from "./store";
import {broadcastData} from "../utils/broadcast";

export const settingsStore: Store<Settings> = createValidatedStore<Settings>(
    'settings',
    SettingsSchema,
    (settings) => broadcastData('settings:change', settings)
);