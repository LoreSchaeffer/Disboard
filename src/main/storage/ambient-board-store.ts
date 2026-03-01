import Store from "electron-store";
import {Profile, Profiles, ProfilesSchema, SbProfile} from "../../types/data";
import {createValidatedStore} from "./store";
import {broadcastData} from "../utils/broadcast";
import {convertProfileToSbProfile} from "../utils/data-converters";

const broadcastProfiles = (profiles: Profile[]) => {
    const sbProfiles: SbProfile[] = profiles.map(p => convertProfileToSbProfile(p));
    broadcastData('profiles:change', sbProfiles);
}

export const ambientBoardStore: Store<Profiles> = createValidatedStore<Profiles>(
    'ambient_board',
    ProfilesSchema,
    (profiles: Profiles) => broadcastProfiles(profiles.profiles)
);