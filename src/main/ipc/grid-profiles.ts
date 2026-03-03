import {app, dialog, ipcMain} from "electron";
import {clamp} from "../../shared/utils";
import path from "path";
import fs from "node:fs/promises";
import {BoardType, GridBtn, GridProfile, IpcResponse, SbGridBtn, SbGridProfile, SbGridProfileSchema} from "../../types";
import {getGridProfilesStore} from "../storage/profiles-store";
import {convertGridBtn2SbGridBtn, convertGridProfile2SbGridProfile, convertSbGridBtns2GridBtns} from "../utils/data-converters";
import {removeNameInvalidChars, validateName} from "../../shared/validation";
import {fixActiveProfile, generateUUID, generateValidFileName} from "../utils/misc";
import {settingsStore} from "../storage/settings-store";
import {broadcastData} from "../utils/broadcast";
import {cacheStore} from "../storage/cache-store";
import {getPosFromButtonId} from "../../ui/utils/utils";
import {deepMerge, pruneNulls} from "../utils/objects";

export const setupGridProfilesHandlers = () => {
    ipcMain.handle('grid_profiles:get_all', (_, boardType: Exclude<BoardType, 'ambient'>): SbGridProfile[] => {
        return getGridProfilesStore(boardType).get('profiles').map(convertGridProfile2SbGridProfile);
    });

    ipcMain.handle('grid_profiles:get', (_, boardType: Exclude<BoardType, 'ambient'>, id: string): SbGridProfile => {
        const profile = getGridProfilesStore(boardType).get('profiles').find(p => p.id === id) || null;
        if (!profile) return null;

        return convertGridProfile2SbGridProfile(profile);
    });

    ipcMain.handle('grid_profiles:create', (_, boardType: Exclude<BoardType, 'ambient'>, profile: Partial<GridProfile>): IpcResponse<void> => {
        if (!profile.name) return {success: false, error: 'name_required'};
        if (!validateName(profile.name)) return {success: false, error: 'name_invalid'};

        const profilesStore = getGridProfilesStore(boardType);

        const profiles = profilesStore.get('profiles');
        if (profiles.some(p => p.name.toLowerCase() === profile.name!.toLowerCase())) return {success: false, error: 'name_exists'};

        const newProfile: GridProfile = {
            id: generateUUID(),
            name: profile.name,
            type: 'music',
            rows: clamp(Math.floor(profile.rows) || 8, 1, 50),
            cols: clamp(Math.floor(profile.cols) || 10, 1, 50),
            buttons: [] as GridBtn[]
        };

        profiles.push(newProfile);
        profilesStore.set('profiles', profiles);
        settingsStore.set(`${boardType}.activeProfile`, newProfile.id);

        broadcastData(`grid_profiles:${boardType}:changed`, profiles.map(convertGridProfile2SbGridProfile));
        broadcastData('settings:changed', settingsStore.store);

        return {success: true};
    });

    ipcMain.handle('grid_profiles:update', (_, boardType: Exclude<BoardType, 'ambient'>, id: string, profile: Partial<GridProfile>): IpcResponse<void> => {
        if (!id) return {success: false, error: 'id_required'};

        const profilesStore = getGridProfilesStore(boardType);

        const profiles = profilesStore.get('profiles');
        const idx = profiles.findIndex(p => p.id === id);
        if (idx === -1) return {success: false, error: 'id_not_found'};

        const existingProfile = profiles[idx];
        const newValues: Partial<GridProfile> = {};

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
        broadcastData(`grid_profiles:${boardType}:changed`, profiles.map(convertGridProfile2SbGridProfile));
        return {success: true};
    });

    ipcMain.handle('grid_profiles:delete', (_, boardType: Exclude<BoardType, 'ambient'>, id: string): IpcResponse<void> => {
        if (!id) return {success: false, error: 'id_required'};

        const profilesStore = getGridProfilesStore(boardType);

        const profiles = profilesStore.get('profiles');
        const idx = profiles.findIndex(p => p.id === id);
        if (idx === -1) return {success: false, error: 'id_not_found'};

        profiles.splice(idx, 1);
        profilesStore.set('profiles', profiles);

        fixActiveProfile(boardType);

        broadcastData('settings:changed', settingsStore.store);
        broadcastData(`grid_profiles:${boardType}:changed`, profiles.map(convertGridProfile2SbGridProfile));
        return {success: true};
    });

    ipcMain.on('grid_profiles:import', async (_, boardType: Exclude<BoardType, 'ambient'>) => {
        const defaultPath: string = cacheStore.get('profilesDir') || app.getPath('documents');

        const {canceled, filePaths} = await dialog.showOpenDialog({
            title: 'Import Profile(s)',
            defaultPath: defaultPath,
            properties: ['openFile', 'multiSelections'],
            filters: [
                {name: 'JSON Profile', extensions: ['json']},
            ]
        });

        if (canceled || !filePaths || filePaths.length === 0) return;
        cacheStore.set('profilesDir', path.dirname(filePaths[0]));

        const profilesStore = getGridProfilesStore(boardType);
        const profiles = profilesStore.get('profiles');

        const importedProfiles = [];
        for (const filePath of filePaths) {
            let json: unknown;
            try {
                const fileContent = await fs.readFile(filePath, 'utf-8');
                json = JSON.parse(fileContent);
            } catch (e) {
                console.error('[Main] JSON Parse Exception:', e);
                continue;
            }

            const result = SbGridProfileSchema.safeParse(json);
            if (!result.success) {
                console.error(`[Main] Profile '${path.basename(filePath)}' validation failed:`, result.error);
                continue;
            }

            const importedProfile: SbGridProfile = result.data;
            if (importedProfile.type !== boardType) {
                console.error(`[Main] Profile '${path.basename(filePath)}' has mismatching type '${importedProfile.type}' (expected '${boardType}')`);
                continue;
            }

            let newName = removeNameInvalidChars(importedProfile.name);
            let counter = 1;

            while (profiles.some(p => p.name.toLowerCase() === newName.toLowerCase())) {
                newName = `${removeNameInvalidChars(importedProfile.name)} (${counter})`;
                counter++;
            }

            const newProfile: GridProfile = {
                id: generateUUID(),
                name: newName,
                type: boardType,
                rows: importedProfile.rows,
                cols: importedProfile.cols,
                buttons: convertSbGridBtns2GridBtns(importedProfile.buttons)
            }

            // TODO Submit download of missing tracks

            profiles.push(newProfile);
            importedProfiles.push(newProfile);
        }

        if (importedProfiles.length > 0) {
            profilesStore.set('profiles', profiles);
            broadcastData(`grid_profiles:${boardType}:changed`, profiles.map(convertGridProfile2SbGridProfile));

            settingsStore.set(`${boardType}.activeProfile`, importedProfiles[0].id);
            broadcastData('settings:changed', settingsStore.store);
        }
    });

    ipcMain.on('grid_profiles:export', async (_, boardType: Exclude<BoardType, 'ambient'>, id: string) => {
        const profile = getGridProfilesStore(boardType).get('profiles').find(p => p.id === id);
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
            await fs.writeFile(filePath, JSON.stringify(convertGridProfile2SbGridProfile(profile), null, 2));
        } catch (e) {
            console.error('[Main] Error exporting profile:', e.message);
        }
    });

    ipcMain.on('grid_profiles:export_all', async (_, boardType: Exclude<BoardType, 'ambient'>) => {
        const profiles = getGridProfilesStore(boardType).get('profiles');
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

                let fileExists = true;
                while (fileExists) {
                    try {
                        await fs.access(path.join(exportDir, finalFileName));
                        finalFileName = generateValidFileName(`${profile.name} (${counter})`, profile.id);
                        counter++;
                    } catch {
                        fileExists = false;
                    }
                }

                await fs.writeFile(path.join(exportDir, finalFileName), JSON.stringify(convertGridProfile2SbGridProfile(profile), null, 2));
            } catch (e) {
                console.error(`[Main] Error during profile ${profile.name} export:`, e);
            }
        });

        await Promise.all(exportPromises);
        console.log(`[Main] Exported ${profiles.length} profiles.`);
    });


    ipcMain.handle('grid_profiles:buttons:get', (_, boardType: Exclude<BoardType, 'ambient'>, profileId: string, buttonId: string): SbGridBtn | null => {
        const profile = getGridProfilesStore(boardType).get('profiles').find(p => p.id === profileId);
        if (!profile) return null;

        const buttonPos = getPosFromButtonId(buttonId);
        if (!buttonPos) return null;

        const btn = profile.buttons.find(b => b.row === buttonPos.row && b.col === buttonPos.col);
        if (!btn) return null;

        return convertGridBtn2SbGridBtn(btn);
    });

    ipcMain.handle('grid_profiles:buttons:update', (_, boardType: Exclude<BoardType, 'ambient'>, profileId: string, buttonId: string, updates: Partial<GridBtn>): IpcResponse<void> => {
        const profilesStore = getGridProfilesStore(boardType);
        const profiles = profilesStore.get('profiles');

        const profileIdx = profiles.findIndex(p => p.id === profileId);
        if (profileIdx === -1) return {success: false, error: 'profile_not_found'};

        const profile = profiles[profileIdx];
        const buttonPos = getPosFromButtonId(buttonId);
        if (!buttonPos) return {success: false, error: 'invalid_button_id'};

        const existingButtonIdx = profile.buttons.findIndex(b => b.row === buttonPos.row && b.col === buttonPos.col);
        const targetButton: GridBtn = existingButtonIdx !== -1
            ? profile.buttons[existingButtonIdx]
            : {row: buttonPos.row, col: buttonPos.col, track: ''};

        if (updates.title) updates.title = removeNameInvalidChars(updates.title);
        if (updates.title === '') delete updates.title;
        if (typeof updates.row === 'number') updates.row = clamp(updates.row, 0, 49);
        if (typeof updates.col === 'number') updates.col = clamp(updates.col, 0, 49);

        const finalButton: GridBtn = pruneNulls(deepMerge(targetButton, updates));

        if (existingButtonIdx !== -1) {
            profile.buttons[existingButtonIdx] = finalButton;
        } else {
            if (finalButton.track && finalButton.track.length > 0) profile.buttons.push(finalButton);
        }

        profilesStore.set('profiles', profiles);
        broadcastData(`grid_profiles:${boardType}:changed`, profiles.map(convertGridProfile2SbGridProfile));

        return {success: true};
    });

    ipcMain.handle('grid_profiles:buttons:delete', (_, boardType: Exclude<BoardType, 'ambient'>, profileId: string, buttonId: string): IpcResponse<void> => {
        const profilesStore = getGridProfilesStore(boardType);
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
        broadcastData(`grid_profiles:${boardType}:changed`, profiles.map(convertGridProfile2SbGridProfile));

        return {success: true};
    });
}