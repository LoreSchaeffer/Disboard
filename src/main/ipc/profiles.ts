import {app, dialog, ipcMain} from "electron";
import {Btn, BtnStyle, CropOptions, Profile, SbBtn, SbProfile, SbProfileSchema} from "../../types/data";
import {cacheStore, profilesStore, settingsStore, tracksStore} from "../utils/store";
import {convertBtnToSbBtn, convertProfileToSbProfile, convertSbBtnsToBtns, getPosFromButtonId} from "../utils/data";
import {IpcResponse} from "../../types/common";
import {generateValidFileName, removeNameInvalidChars, validateName} from "../utils/validation";
import {clamp} from "../../common/utils";
import {broadcastProfiles, broadcastSettings} from "../utils";
import path from "path";
import fs from "node:fs";
import {generateUUID} from "../utils/utils";

const updateButton = (target: Btn, updates: Partial<SbBtn>) => {
    if (updates.row !== undefined) target.row = clamp(Math.floor(updates.row), 0, 49);
    if (updates.col !== undefined) target.col = clamp(Math.floor(updates.col), 0, 49);

    if ((updates.title) === null) delete target.title;
    else if (updates.title !== undefined) target.title = removeNameInvalidChars(updates.title);

    const applyNestedUpdates = <T extends object>(currentTarget: T | undefined, nestedUpdates: any): T | undefined => {
        if (nestedUpdates === null) return undefined;
        if (!nestedUpdates) return currentTarget;

        const nextObj: any = currentTarget ? {...currentTarget} : {};

        Object.keys(nestedUpdates).forEach(key => {
            const val = nestedUpdates[key];

            if (val === null) delete nextObj[key];
            else if (val !== undefined) nextObj[key] = val;
        });

        if (Object.keys(nextObj).length === 0) return undefined;

        return nextObj as T;
    };

    if (updates.style !== undefined || (updates as any).style === null) {
        const newStyle = applyNestedUpdates<BtnStyle>(target.style, updates.style);
        if (newStyle) target.style = newStyle;
        else delete target.style;
    }

    if (updates.cropOptions !== undefined || (updates as any).cropOptions === null) {
        const newCrop = applyNestedUpdates<CropOptions>(target.cropOptions, updates.cropOptions);
        if (newCrop) target.cropOptions = newCrop;
        else delete target.cropOptions;
    }
};

export const setupProfilesHandlers = () => {
    ipcMain.handle('get_profiles', (): SbProfile[] => {
        return profilesStore.get('profiles').map(convertProfileToSbProfile);
    });

    ipcMain.handle('get_profile', (_, id: string): SbProfile => {
        const profile = profilesStore.get('profiles').find(p => p.id === id) || null
        if (!profile) return null;

        return convertProfileToSbProfile(profile);
    });

    ipcMain.handle('create_profile', (_, profile: Partial<Profile>): IpcResponse<void> => {
        if (!profile.name) return {success: false, error: 'name_required'};
        if (!validateName(profile.name)) return {success: false, error: 'name_invalid'};

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
        settingsStore.set('activeProfile', newProfile.id);

        broadcastProfiles(profiles);
        broadcastSettings(settingsStore.store);
        return {success: true};
    });

    ipcMain.handle('update_profile', (_, id: string, profile: Partial<Profile>): IpcResponse<void> => {
        if (!id) return {success: false, error: 'id_required'};

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
        broadcastProfiles(profiles);
        return {success: true};
    });

    ipcMain.handle('delete_profile', (_, id: string): IpcResponse<void> => {
        if (!id) return {success: false, error: 'id_required'};

        const profiles = profilesStore.get('profiles');
        const idx = profiles.findIndex(p => p.id === id);
        if (idx === -1) return {success: false, error: 'id_not_found'};

        profiles.splice(idx, 1);
        if (profiles.length === 0) {
            profiles.push({
                id: generateUUID(),
                name: 'Default',
                rows: 8,
                cols: 10,
                buttons: []
            });
        }

        profilesStore.set('profiles', profiles);
        broadcastProfiles(profiles);

        const activeProfile = settingsStore.get('activeProfile');
        if (activeProfile === id || !profiles.find(p => p.id === activeProfile)) {
            settingsStore.set('activeProfile', profiles[0].id);
            broadcastSettings(settingsStore.store);
        }

        return {success: true};
    });

    ipcMain.on('import_profile', async () => {
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
            console.error('JSON Parse Exception:', e);
            return;
        }

        const result = SbProfileSchema.safeParse(jsonContent);
        if (!result.success) {
            console.error('Profile validation failed:', result.error);
            return;
        }

        const importedData: SbProfile = result.data;

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
        broadcastProfiles(profiles);
    });

    ipcMain.on('export_profile', async (_, id: string) => {
        const profile = profilesStore.get('profiles').find(p => p.id === id);
        if (!profile) {
            console.error('Profile not found');
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
            console.error('Error exporting profile:', e.message);
        }
    });

    ipcMain.on('export_profiles', async () => {
        const profiles = profilesStore.get('profiles');
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
                console.error(`Error during profile ${profile.name} export:`, e);
            }
        });

        await Promise.all(exportPromises);

        console.log(`Esportati ${profiles.length} profili.`);
    });

    ipcMain.handle('get_button', (_, profileId: string, buttonId: string): SbBtn | null => {
        const profile = profilesStore.get('profiles').find(p => p.id === profileId);
        if (!profile) return null;

        const buttonPos = getPosFromButtonId(buttonId);
        if (!buttonPos) return null;

        const btn = profile.buttons.find(b => b.row === buttonPos.row && b.col === buttonPos.col);
        if (!btn) return null;

        return convertBtnToSbBtn(btn, tracksStore.get('tracks'));
    });

    ipcMain.handle('update_button', (_, profileId: string, buttonId: string, updates: Partial<SbBtn>): IpcResponse<void> => {
        const profiles = profilesStore.get('profiles');

        const profileIdx = profiles.findIndex(p => p.id === profileId);
        if (profileIdx === -1) return {success: false, error: 'profile_not_found'};

        const profile = profiles[profileIdx];
        const buttonPos = getPosFromButtonId(buttonId);
        if (!buttonPos) return {success: false, error: 'invalid_button_id'};

        const existingButtonIdx = profile.buttons.findIndex(b => b.row === buttonPos.row && b.col === buttonPos.col);
        if (existingButtonIdx === -1) return {success: false, error: 'button_not_found'};

        const existingButton: Btn = {...profile.buttons[existingButtonIdx]};

        updateButton(existingButton, updates);

        // TODO If the track is changed, we might need to handle downloading

        profile.buttons[existingButtonIdx] = existingButton;
        profiles[profileIdx] = profile;
        profilesStore.set('profiles', profiles);
        broadcastProfiles(profiles);

        return {success: true};
    });

    ipcMain.handle('delete_button', (_, profileId: string, buttonId: string): IpcResponse<void> => {
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
        broadcastProfiles(profiles);

        return {success: true};
    });
}