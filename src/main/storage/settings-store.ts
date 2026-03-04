import Store from "electron-store";
import {BoardSettings, BoardType, Settings, SettingsSchema} from "../../types";
import {createValidatedStore} from "./store";
import {broadcastData} from "../utils/broadcast";

export const settingsStore: Store<Settings> = createValidatedStore<Settings>(
    'settings',
    SettingsSchema,
    (settings) => broadcastData('settings:changed', settings)
);

export const getBoardSettings = (boardType: BoardType): BoardSettings => {
    const settings = settingsStore.get(boardType);
    if (!settings) throw new Error(`Settings for ${boardType} board not found`);
    return settings;
}