import * as crypto from 'crypto';
import os from "node:os";
import {AmbientProfile, AmbientProfiles, BoardType, GridProfile, GridProfiles} from "../../types";
import {getBoardSettings, settingsStore} from "../storage/settings-store";
import {getProfilesStore} from "../storage/profiles-store";
import Store from "electron-store";

export const generateUUID = (): string => {
    return crypto.randomUUID();
}

export const setAppPriority = () => {
    try {
        os.setPriority(process.pid, os.constants.priority.PRIORITY_HIGH);
        console.log(`[Main] Priority set to HIGH for main process (PID: ${process.pid}).`);
    } catch (e) {
        console.warn(`[Main] Failed to set priority for main process (PID: ${process.pid}):`, e);
    }
}

export const getDefGridProfile = (boardType: Exclude<BoardType, 'ambient'>): GridProfile => ({
    id: generateUUID(),
    name: 'Default',
    rows: 8,
    cols: 10,
    type: boardType,
    buttons: []
});

export const getDefAmbientProfile = (): AmbientProfile => ({
    id: generateUUID(),
    name: 'Default',
    buttons: []
});

export const fixActiveProfile = (boardType: BoardType) => {
    const boardSettings = getBoardSettings(boardType);
    const profilesStore = getProfilesStore(boardType);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let profiles: { id: string; name: string }[] = (profilesStore as any).get('profiles') || [];

    if (profiles.length === 0) {
        console.log(`[Main] No profiles found for ${boardType} board, creating default profile...`);

        if (boardType === 'ambient') {
            const defProfile = getDefAmbientProfile();
            profiles = [defProfile];
            (profilesStore as Store<AmbientProfiles>).set('profiles', [defProfile]);
        } else {
            const defProfile = getDefGridProfile(boardType);
            profiles = [defProfile];
            (profilesStore as Store<GridProfiles>).set('profiles', [defProfile]);
        }
    }

    const activeProfileId = boardSettings.activeProfile;
    if (!activeProfileId || !profiles.find(p => p.id === activeProfileId)) {
        console.log(`[Main] Active profile for ${boardType} board not set or invalid, setting to first profile...`);
        settingsStore.set(`${boardType}.activeProfile`, profiles[0].id);
        console.log(`[Main] Active profile for ${boardType} board set to: ${profiles[0].name}`);
    }
}

// eslint-disable-next-line no-control-regex
const fileNameInvalidCharsRegex = /[<>:"/\\|?*\x00-\x1F]/g;
export const generateValidFileName = (name: string, def?: string, ext: string = '.json') => {
    if (name.toLowerCase().endsWith(ext.toLowerCase())) name = name.substring(0, name.length - ext.length);

    let validName = name.replace(fileNameInvalidCharsRegex, '_').trim();
    if (validName.length === 0) validName = def || 'Untitled';
    if (validName.length > 64) validName = validName.substring(0, 64);
    return validName + ext;
}