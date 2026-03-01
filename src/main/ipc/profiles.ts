import {app, dialog, ipcMain} from "electron";
import {Btn, Profile, SbBtn, SbProfile, SbProfileSchema} from "../../types/data";
import {cacheStore, getProfileStore, settingsStore, tracksStore} from "../utils/store";
import {convertBtnToSbBtn, convertProfileToSbProfile, convertSbBtnsToBtns, getPosFromButtonId} from "../utils/data-converters";
import {IpcResponse, SoundboardWithProfile} from "../../types/common";
import {generateValidFileName, removeNameInvalidChars, validateName} from "../utils/validation";
import {clamp} from "../../common/utils";
import path from "path";
import fs from "node:fs";
import {deepMerge, fixActiveProfile, generateUUID, getDefProfile, pruneNulls} from "../utils/misc";
import {broadcastProfiles, broadcastSettings} from "../utils/broadcast";

export const setupProfilesHandlers = () => {
    ipcMain.handle('profiles:get_all', (_, soundboardType: SoundboardWithProfile): SbProfile[] => {
        return getProfileStore(soundboardType).get('profiles').map(convertProfileToSbProfile);
    });

    ipcMain.handle('profiles:get', (_, soundboardType: SoundboardWithProfile, id: string): SbProfile => {
        const profile = getProfileStore(soundboardType).get('profiles').find(p => p.id === id) || null
        if (!profile) return null;

        return convertProfileToSbProfile(profile);
    });

    ipcMain.handle('profiles:create', (_, soundboardType: SoundboardWithProfile, profile: Partial<Profile>): IpcResponse<void> => {
        if (!profile.name) return {success: false, error: 'name_required'};
        if (!validateName(profile.name)) return {success: false, error: 'name_invalid'};

        const profilesStore = getProfileStore(soundboardType);

        const profiles = profilesStore.get('profiles');
        if (profiles.some(p => p.name.toLowerCase() === profile.name!.toLowerCase())) return {success: false, error: 'name_exists'};

        const newProfile = {
            id: generateUUID(),
            name: profile.name,
            rows: clamp(Math.floor(profile.rows) || 8, 1, 50),
            cols: clamp(Math.floor(profile.cols) || 10, 1, 50),
            buttons: [] as Btn[]
        }

        profiles.push(newProfile);
        profilesStore.set('profiles', profiles);
        settingsStore.set(`${soundboardType}Soundboard.activeProfile`, newProfile.id);

        broadcastProfiles(soundboardType, profiles);
        broadcastSettings(settingsStore.store);
        return {success: true};
    });

    ipcMain.handle('profiles:update', (_, soundboardType: SoundboardWithProfile, id: string, profile: Partial<Profile>): IpcResponse<void> => {
        if (!id) return {success: false, error: 'id_required'};

        const profilesStore = getProfileStore(soundboardType);

        const profiles = profilesStore.get('profiles');
        const idx = profiles.findIndex(p => p.id === id);
        if (idx === -1) return {success: false, error: 'id_not_found'};

        const existingProfile = profiles[idx];
        const newValues: Partial<Profile> = {};

        if (profile.name) {
            if (!validateName(profile.name)) return {success: false, error: 'name_invalid'};
            if (profiles.some(p => p.id !== id && p.name.toLowerCase() === profile.name!.toLowerCase())) return {success: false, error: 'name_exists'};
            newValues.name = profile.name;
        }

        if (profile.rows !== undefined) newValues.rows = clamp(Math.floor(profile.rows), 1, 50);
        if (profile.cols !== undefined) newValues.cols = clamp(Math.floor(profile.cols), 1, 50);

        profiles[idx] = {
            ...existingProfile,
            ...newValues
        };

        profilesStore.set('profiles', profiles);
        broadcastProfiles(soundboardType, profiles);
        return {success: true};
    });

    ipcMain.handle('profiles:delete', (_, soundboardType: SoundboardWithProfile, id: string): IpcResponse<void> => {
        if (!id) return {success: false, error: 'id_required'};

        const profilesStore = getProfileStore(soundboardType);

        const profiles = profilesStore.get('profiles');
        const idx = profiles.findIndex(p => p.id === id);
        if (idx === -1) return {success: false, error: 'id_not_found'};

        profiles.splice(idx, 1);
        if (profiles.length === 0) profiles.push(getDefProfile());

        profilesStore.set('profiles', profiles);

        fixActiveProfile(soundboardType);

        broadcastSettings(settingsStore.store);
        broadcastProfiles(soundboardType, profiles);

        return {success: true};
    });

    ipcMain.on('profiles:import', async (_, soundboardType: SoundboardWithProfile) => {
        const defaultPath: string = cacheStore.get('profilesDir') || app.getPath('documents');

        const {canceled, filePaths} = await dialog.showOpenDialog({
            title: 'Import Profile',
            defaultPath: defaultPath,
            properties: ['openFile'],
            filters: [
                {name: 'JSON Profile', extensions: ['json']},
            ]
        });

        if (canceled || !filePaths || filePaths.length === 0) {
            console.info('Import canceled');
            return;
        }

        const filePath = filePaths[0];
        cacheStore.set('profilesDir', path.dirname(filePath));


        let jsonContent: unknown;
        try {
            jsonContent = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        } catch (e) {
            console.error('[Main] JSON Parse Exception:', e);
            return;
        }

        const result = SbProfileSchema.safeParse(jsonContent);
        if (!result.success) {
            console.error('[Main] Profile validation failed:', result.error);
            return;
        }

        const importedData: SbProfile = result.data;

        const profilesStore = getProfileStore(soundboardType);
        const profiles = profilesStore.get('profiles');

        let newName = removeNameInvalidChars(importedData.name);
        let counter = 1;

        while (profiles.some(p => p.name.toLowerCase() === newName.toLowerCase())) {
            newName = `${removeNameInvalidChars(importedData.name)} (${counter})`;
            counter++;
        }

        const newProfile: Profile = {
            id: generateUUID(),
            name: newName,
            rows: importedData.rows,
            cols: importedData.cols,
            buttons: convertSbBtnsToBtns(importedData.buttons)
        }

        // TODO Download all media files associated with the profile buttons

        profiles.push(newProfile);
        profilesStore.set('profiles', profiles);
        broadcastProfiles(soundboardType, profiles);
    });

    ipcMain.on('profiles:export', async (_, soundboardType: SoundboardWithProfile, id: string) => {
        const profile = getProfileStore(soundboardType).get('profiles').find(p => p.id === id);
        if (!profile) {
            console.error('[Main] Profile not found');
            return;
        }

        const safeFileName = generateValidFileName(profile.name, 'profile');

        const {canceled, filePath} = await dialog.showSaveDialog({
            title: `Export profile ${profile.name}`,
            defaultPath: path.join(cacheStore.get('profilesDir') || app.getPath('documents'), safeFileName),
            filters: [
                {name: 'JSON', extensions: ['json']},
            ]
        });

        if (canceled || !filePath) {
            console.info('Export canceled');
            return;
        }

        cacheStore.set('profilesDir', path.dirname(filePath));

        try {
            fs.writeFileSync(filePath, JSON.stringify(convertProfileToSbProfile(profile), null, 2));
        } catch (e) {
            console.error('[Main] Error exporting profile:', e.message);
        }
    });

    ipcMain.on('profiles:export_all', async (_, soundboardType: SoundboardWithProfile) => {
        const profiles = getProfileStore(soundboardType).get('profiles');
        if (!profiles || profiles.length === 0) return;

        const {canceled, filePaths} = await dialog.showOpenDialog({
            title: 'Select Export Directory',
            defaultPath: cacheStore.get('profilesDir') || app.getPath('documents'),
            properties: ['openDirectory', 'createDirectory']
        });

        if (canceled || !filePaths || filePaths.length === 0) {
            console.info('Export canceled');
            return;
        }

        const exportDir = filePaths[0];

        cacheStore.set('profilesDir', exportDir);

        const exportPromises = profiles.map(async (profile) => {
            try {
                let finalFileName = generateValidFileName(profile.name, profile.id);
                let counter = 1;

                while (fs.existsSync(path.join(exportDir, finalFileName))) {
                    finalFileName = generateValidFileName(`${profile.name} (${counter})`, profile.id);
                    counter++;
                }

                await fs.promises.writeFile(path.join(exportDir, finalFileName), JSON.stringify(convertProfileToSbProfile(profile), null, 2));
            } catch (e) {
                console.error(`[Main] Error during profile ${profile.name} export:`, e);
            }
        });

        await Promise.all(exportPromises);

        console.log(`[Main] Esportati ${profiles.length} profili.`);
    });

    ipcMain.handle('profiles:buttons:get', (_, soundboardType: SoundboardWithProfile, profileId: string, buttonId: string): SbBtn | null => {
        const profile = getProfileStore(soundboardType).get('profiles').find(p => p.id === profileId);
        if (!profile) return null;

        const buttonPos = getPosFromButtonId(buttonId);
        if (!buttonPos) return null;

        const btn = profile.buttons.find(b => b.row === buttonPos.row && b.col === buttonPos.col);
        if (!btn) return null;

        return convertBtnToSbBtn(btn, tracksStore.get('tracks'));
    });

    ipcMain.handle('profiles:buttons:update', (_, soundboardType: SoundboardWithProfile, profileId: string, buttonId: string, updates: Partial<Btn>): IpcResponse<void> => {
        const profilesStore = getProfileStore(soundboardType);
        const profiles = profilesStore.get('profiles');

        const profileIdx = profiles.findIndex(p => p.id === profileId);
        if (profileIdx === -1) return {success: false, error: 'profile_not_found'};

        const profile = profiles[profileIdx];
        const buttonPos = getPosFromButtonId(buttonId);
        if (!buttonPos) return {success: false, error: 'invalid_button_id'};

        const existingButtonIdx = profile.buttons.findIndex(b => b.row === buttonPos.row && b.col === buttonPos.col);
        const targetButton: Btn = existingButtonIdx !== -1
            ? profile.buttons[existingButtonIdx]
            : {row: buttonPos.row, col: buttonPos.col, track: ''} as Btn;

        if (updates.title) updates.title = removeNameInvalidChars(updates.title);
        if (typeof updates.row === 'number') updates.row = clamp(updates.row, 0, 49);
        if (typeof updates.col === 'number') updates.col = clamp(updates.col, 0, 49);

        const finalButton: Btn = pruneNulls(deepMerge(targetButton, updates));

        if (existingButtonIdx !== -1) {
            profile.buttons[existingButtonIdx] = finalButton;
        } else {
            if (finalButton.track && finalButton.track.length > 0) profile.buttons.push(finalButton as Btn);
        }

        profilesStore.set('profiles', profiles);
        broadcastProfiles(soundboardType, profiles);

        return {success: true};
    });

    ipcMain.handle('profiles:buttons:delete', (_, soundboardType: SoundboardWithProfile, profileId: string, buttonId: string): IpcResponse<void> => {
        const profilesStore = getProfileStore(soundboardType);
        const profiles = profilesStore.get('profiles');

        const profileIdx = profiles.findIndex(p => p.id === profileId);
        if (profileIdx === -1) return {success: false, error: 'profile_not_found'};

        const profile = profiles[profileIdx];
        const buttonPos = getPosFromButtonId(buttonId);
        if (!buttonPos) return {success: false, error: 'invalid_button_id'};

        const existingButtonIdx = profile.buttons.findIndex(b => b.row === buttonPos.row && b.col === buttonPos.col);
        if (existingButtonIdx === -1) return {success: false, error: 'button_not_found'};

        profile.buttons.splice(existingButtonIdx, 1);

        profiles[profileIdx] = profile;
        profilesStore.set('profiles', profiles);
        broadcastProfiles(soundboardType, profiles);

        return {success: true};
    });
}