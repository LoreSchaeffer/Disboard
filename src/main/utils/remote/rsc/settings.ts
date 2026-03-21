import {remoteMain} from "../remote-main";
import {settingsStore} from "../../../storage/settings-store";
import {BoardType, RepeatMode, Settings} from "../../../../types";
import {broadcastData} from "../../broadcast";
import {clamp} from "../../../../shared/utils";

export const setupSettingsRSHandlers = () => {
    remoteMain.handle('settings:get', (): Settings => {
        return settingsStore.store;
    });

    remoteMain.on('settings:set_volume', (_, boardType: BoardType, volume: number) => {
        settingsStore.set(`${boardType}.volume`, clamp(volume, 0, 100));
        broadcastData('settings:changed', settingsStore.store);
    });

    remoteMain.on('settings:set_active_profile', (_, boardType: BoardType, profileId: string) => {
        settingsStore.set(`${boardType}.activeProfile`, profileId);
        broadcastData('settings:changed', settingsStore.store);
    });

    remoteMain.on('settings:set_zoom', (_, boardType: BoardType, zoom: number) => {
        settingsStore.set(`${boardType}.zoom`, clamp(zoom, 0.5, 3));
        broadcastData('settings:changed', settingsStore.store);
    });

    remoteMain.on('settings:set_repeat_mode', (_, mode: RepeatMode) => {
        settingsStore.set('music.repeat', mode);
        broadcastData('settings:changed', settingsStore.store);
    });

    remoteMain.on('settings:set_show_images', (_, showImages: boolean) => {
        settingsStore.set('settings.showImages', showImages);
        broadcastData('settings:changed', settingsStore.store);
    });
}