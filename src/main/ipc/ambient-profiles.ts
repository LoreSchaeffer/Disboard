import {ipcMain} from "electron";
import {AmbientBtn, AmbientProfile, BoardType, DeepPartial, IpcResponse, SbAmbientBtn, SbAmbientProfile} from "../../types";
import {ambientBoardStore} from "../storage/profiles-store";
import {convertAmbientBtn2SbAmbientBtn, convertAmbientProfile2SbAmbientProfile} from "../utils/data-converters";
import {removeNameInvalidChars, validateName} from "../../shared/validation";
import {fixActiveProfile, generateUUID} from "../utils/misc";
import {getBoardSettings, settingsStore} from "../storage/settings-store";
import {broadcastData} from "../utils/broadcast";
import {deepMerge, pruneNulls} from "../utils/objects";

export const setupAmbientProfilesHandlers = () => {
    ipcMain.handle('ambient_profiles:get_all', (): SbAmbientProfile[] => {
        return ambientBoardStore.get('profiles').map(convertAmbientProfile2SbAmbientProfile);
    });

    ipcMain.handle('ambient_profiles:get', (_, id: string): SbAmbientProfile => {
        const profile = ambientBoardStore.get('profiles').find(p => p.id === id) || null;
        if (!profile) return null;

        return convertAmbientProfile2SbAmbientProfile(profile);
    });

    ipcMain.handle('ambient_profiles:get_active', (): SbAmbientProfile => {
        const activeProfile = getBoardSettings('ambient').activeProfile;
        if (!activeProfile) return null;

        const profile = ambientBoardStore.get('profiles').find(p => p.id === activeProfile) || null;
        if (!profile) return null;

        return convertAmbientProfile2SbAmbientProfile(profile);
    });

    ipcMain.handle('ambient_profiles:create', (_, profile: Partial<AmbientProfile>): IpcResponse<void> => {
        if (!profile.name) return {success: false, error: 'name_required'};
        if (!validateName(profile.name)) return {success: false, error: 'name_invalid'};

        const profiles = ambientBoardStore.get('profiles');
        if (profiles.some(p => p.name.toLowerCase() === profile.name!.toLowerCase())) return {success: false, error: 'name_exists'};

        const newProfile: AmbientProfile = {
            id: generateUUID(),
            name: profile.name,
            buttons: [] as AmbientBtn[]
        };

        profiles.push(newProfile);
        ambientBoardStore.set('profiles', profiles);
        settingsStore.set(`ambient.activeProfile`, newProfile.id);

        broadcastData('ambient_profiles:changed', profiles.map(convertAmbientProfile2SbAmbientProfile));
        broadcastData('settings:changed', settingsStore.store);

        return {success: true};
    });

    ipcMain.handle('ambient_profiles:update', (_, id: string, profile: Partial<AmbientProfile>): IpcResponse<void> => {
        if (!id) return {success: false, error: 'id_required'};

        const profiles = ambientBoardStore.get('profiles');
        const idx = profiles.findIndex(p => p.id === id);
        if (idx === -1) return {success: false, error: 'id_not_found'};

        const existingProfile = profiles[idx];
        const newValues: Partial<AmbientProfile> = {};

        if (profile.name) {
            if (!validateName(profile.name)) return {success: false, error: 'name_invalid'};
            if (profiles.some(p => p.id !== id && p.name.toLowerCase() === profile.name!.toLowerCase())) return {success: false, error: 'name_exists'};
            newValues.name = profile.name;
        }

        profiles[idx] = {
            ...existingProfile,
            ...newValues
        };

        ambientBoardStore.set('profiles', profiles);
        broadcastData('ambient_profiles:changed', profiles.map(convertAmbientProfile2SbAmbientProfile));
        return {success: true};
    });

    ipcMain.handle('ambient_profiles:delete', (_, id: string): IpcResponse<void> => {
        if (!id) return {success: false, error: 'id_required'};

        const profiles = ambientBoardStore.get('profiles');
        const idx = profiles.findIndex(p => p.id === id);
        if (idx === -1) return {success: false, error: 'id_not_found'};

        profiles.splice(idx, 1);
        ambientBoardStore.set('profiles', profiles);

        fixActiveProfile('ambient');

        broadcastData('settings:changed', settingsStore.store);
        broadcastData('ambient_profiles:changed', profiles.map(convertAmbientProfile2SbAmbientProfile));
        return {success: true};
    });

    ipcMain.on('ambient_profiles:import', async () => {

    });

    ipcMain.on('ambient_profiles:export', async (_, id: string) => {

    });

    ipcMain.on('ambient_profiles:export_all', async () => {

    });


    ipcMain.handle('ambient_profiles:buttons:get', (_, profileId: string, buttonId: string): SbAmbientBtn | null => {
        const profile = ambientBoardStore.get('profiles').find(p => p.id === profileId);
        if (!profile) return null;

        const btn = profile.buttons.find(b => b.id === buttonId);
        if (!btn) return null;

        return convertAmbientBtn2SbAmbientBtn(btn);
    });

    ipcMain.handle('ambient_profiles:buttons:update', (_, profileId: string, buttonId: string, updates: DeepPartial<AmbientBtn>): IpcResponse<void> => {
        const profiles = ambientBoardStore.get('profiles');

        const profileIdx = profiles.findIndex(p => p.id === profileId);
        if (profileIdx === -1) return {success: false, error: 'profile_not_found'};
        const profile = profiles[profileIdx];

        const btnIdx = profile.buttons.findIndex(b => b.id === buttonId);
        if (btnIdx === -1) return {success: false, error: 'button_not_found'};
        const existingButton = profile.buttons[btnIdx];


        if (updates.title) updates.title = removeNameInvalidChars(updates.title);
        if (updates.title === '') delete updates.title;

        const finalButton: AmbientBtn = pruneNulls(deepMerge(existingButton, updates));
        // if (!finalButton.track || finalButton.track.length === 0) profile.buttons.splice(btnIdx, 1);
        // else profile.buttons[btnIdx] = finalButton;

        ambientBoardStore.set('profiles', profiles);
        broadcastData('ambient_profiles:changed', profiles.map(convertAmbientProfile2SbAmbientProfile));

        return {success: true};
    });

    ipcMain.handle('ambient_profiles:buttons:delete', (_, boardType: Exclude<BoardType, 'ambient'>, profileId: string, buttonId: string): IpcResponse<void> => {
        const profiles = ambientBoardStore.get('profiles');

        const profileIdx = profiles.findIndex(p => p.id === profileId);
        if (profileIdx === -1) return {success: false, error: 'profile_not_found'};
        const profile = profiles[profileIdx];

        const existingButtonIdx = profile.buttons.findIndex(b => b.id === buttonId);
        if (existingButtonIdx === -1) return {success: false, error: 'button_not_found'};

        profile.buttons.splice(existingButtonIdx, 1);

        ambientBoardStore.set('profiles', profiles);
        broadcastData('ambient_profiles:changed', profiles.map(convertAmbientProfile2SbAmbientProfile));

        return {success: true};
    });
}