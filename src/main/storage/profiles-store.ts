import Store from "electron-store";
import {AmbientProfile, AmbientProfiles, AmbientProfilesSchema, BoardType, GridProfile, GridProfiles, GridProfilesSchema, SbAmbientProfile, SbGridProfile} from "../../types";
import {createValidatedStore} from "./store";
import {broadcastData} from "../utils/broadcast";
import {convertAmbientProfile2SbAmbientProfile, convertGridProfile2SbGridProfile} from "../utils/data-converters";

const broadcastGridProfiles = (boardType: Exclude<BoardType, 'ambient'>, profiles: GridProfile[]) => {
    const sbGridProfiles: SbGridProfile[] = profiles.map(convertGridProfile2SbGridProfile);
    broadcastData(`grid_profiles:${boardType}:changed`, sbGridProfiles);
}

const broadcastAmbientProfiles = (profiles: AmbientProfile[]) => {
    const sbAmbientProfiles: SbAmbientProfile[] = profiles.map(convertAmbientProfile2SbAmbientProfile);
    broadcastData('ambient_profiles:changed', sbAmbientProfiles);
}

export const musicBoardStore: Store<GridProfiles> = createValidatedStore<GridProfiles>(
    'music_board_profiles',
    GridProfilesSchema,
    (profiles: GridProfiles) => broadcastGridProfiles('music', profiles.profiles)
);

export const sfxBoardStore: Store<GridProfiles> = createValidatedStore<GridProfiles>(
    'sfx_board_profiles',
    GridProfilesSchema,
    (profiles: GridProfiles) => broadcastGridProfiles('sfx', profiles.profiles)
);

export const ambientBoardStore: Store<AmbientProfiles> = createValidatedStore<AmbientProfiles>(
    'ambient_board_profiles',
    AmbientProfilesSchema,
    (profiles: AmbientProfiles) => broadcastAmbientProfiles(profiles.profiles)
);

export const getProfilesStore = (boardType: BoardType): Store<GridProfiles> | Store<AmbientProfiles> => {
    switch (boardType) {
        case 'music':
            return musicBoardStore;
        case 'sfx':
            return sfxBoardStore;
        case 'ambient':
            return ambientBoardStore;
        default:
            throw new Error(`Invalid board type: ${boardType}`);
    }
}

export const getGridProfilesStore = (boardType: Exclude<BoardType, 'ambient'>): Store<GridProfiles> => {
    return getProfilesStore(boardType) as Store<GridProfiles>;
}