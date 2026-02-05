import {SbProfile} from "../../types/data";
import {createContext, PropsWithChildren, useContext, useEffect, useMemo, useState} from "react";
import {useWindow} from "./WindowContext";
import {getSettingsForRoute} from "../utils/utils";

type ProfilesContextType = {
    ready: boolean;
    profiles: SbProfile[];
    activeProfile: SbProfile | null;
}

const ProfilesContext = createContext<ProfilesContextType | undefined>(undefined);

export default function ProfilesProvider({children}: PropsWithChildren) {
    const {route, settings} = useWindow();
    const [ready, setReady] = useState<boolean>(false);
    const [profiles, setProfiles] = useState<SbProfile[]>([]);


    useEffect(() => {
        window.electron.getProfiles(route).then(setProfiles);

        // TODO This should listen only for profiles related to this window's route
        const unsubProfiles = window.electron.onProfilesChanged((profiles) => {
            setProfiles(profiles);
        });

        return () => {
            unsubProfiles();
        }
    }, []);

    const activeProfile: SbProfile = useMemo(() => {
        if (!settings || !profiles) return null;

        const routeSettings = getSettingsForRoute(settings, route);
        if (!routeSettings) return null;

        return profiles.find(p => p.id === routeSettings.activeProfile) || null;
    }, [route, settings, profiles]);

    useEffect(() => {
        if (profiles && activeProfile) setReady(true);
    }, [profiles, activeProfile]);

    return (
        <ProfilesContext.Provider value={{
            ready,
            profiles,
            activeProfile,
        }}>
            {children}
        </ProfilesContext.Provider>
    )
}

export function useProfiles() {
    const context = useContext(ProfilesContext);
    if (context === undefined) throw new Error('useProfiles must be used within a ProfilesProvider');
    return context;
}