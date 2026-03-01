import Store from "electron-store";
import {AmbientProfile, AmbientProfiles, AmbientProfilesSchema, GridProfile, GridProfiles, GridProfilesSchema, SbAmbientProfile, SbGridProfile} from "../../types";
import {createValidatedStore} from "./store";
import {broadcastData} from "../utils/broadcast";
import {convertAmbientProfile2SbAmbientProfile, convertGridProfile2SbGridProfile} from "../utils/data-converters";

const broadcastGridProfiles = (channel: 'music_profiles:change' | 'sfx_profiles:change', profiles: GridProfile[]) => {
    const sbGridProfiles: SbGridProfile[] = profiles.map(convertGridProfile2SbGridProfile);
    broadcastData(channel, sbGridProfiles);
}

const broadcastAmbientProfiles = (profiles: AmbientProfile[]) => {
    const sbAmbientProfiles: SbAmbientProfile[] = profiles.map(convertAmbientProfile2SbAmbientProfile);
    broadcastData('ambient_profiles:change', sbAmbientProfiles);
}

export const musicBoardStore: Store<GridProfiles> = createValidatedStore<GridProfiles>(
    'music_board',
    GridProfilesSchema,
    (profiles: GridProfiles) => broadcastGridProfiles('music_profiles:change', profiles.profiles)
);

export const sfxBoardStore: Store<GridProfiles> = createValidatedStore<GridProfiles>(
    'sfx_board',
    GridProfilesSchema,
    (profiles: GridProfiles) => broadcastGridProfiles('sfx_profiles:change', profiles.profiles)
);

export const ambientBoardStore: Store<AmbientProfiles> = createValidatedStore<AmbientProfiles>(
    'ambient_board',
    AmbientProfilesSchema,
    (profiles: AmbientProfiles) => broadcastAmbientProfiles(profiles.profiles)
);