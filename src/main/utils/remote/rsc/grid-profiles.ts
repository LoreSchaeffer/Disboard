import {BoardType, SbGridBtn, SbGridProfile} from "../../../../types";
import {remoteMain} from "../remote-main";
import {convertGridBtn2SbGridBtn, convertGridProfile2SbGridProfile} from "../../data-converters";
import {getGridProfilesStore} from "../../../storage/profiles-store";
import {getBoardSettings} from "../../../storage/settings-store";

export const setupGridProfilesRSHandlers = () => {
    remoteMain.handle('grid_profiles:get_all', (_, boardType: Exclude<BoardType, 'ambient'>): SbGridProfile[] => {
        return getGridProfilesStore(boardType).get('profiles').map(convertGridProfile2SbGridProfile);
    });

    remoteMain.handle('grid_profiles:get', (_, boardType: Exclude<BoardType, 'ambient'>, id: string): SbGridProfile => {
        const profile = getGridProfilesStore(boardType).get('profiles').find(p => p.id === id) || null;
        if (!profile) return null;

        return convertGridProfile2SbGridProfile(profile);
    });

    remoteMain.handle('grid_profiles:get_active', (_, boardType: Exclude<BoardType, 'ambient'>): SbGridProfile => {
        const activeProfile = getBoardSettings(boardType).activeProfile;
        if (!activeProfile) return null;

        const profile = getGridProfilesStore(boardType).get('profiles').find(p => p.id === activeProfile) || null;
        if (!profile) return null;

        return convertGridProfile2SbGridProfile(profile);
    });

    remoteMain.handle('grid_profiles:buttons:get', (_, boardType: Exclude<BoardType, 'ambient'>, profileId: string, buttonId: string): SbGridBtn | null => {
        const profile = getGridProfilesStore(boardType).get('profiles').find(p => p.id === profileId);
        if (!profile) return null;

        const btn = profile.buttons.find(b => b.id === buttonId);
        if (!btn) return null;

        return convertGridBtn2SbGridBtn(btn);
    });
}