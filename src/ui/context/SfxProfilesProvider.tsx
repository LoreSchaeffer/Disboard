import {SbProfile} from "../../types/data";
import {createContext, PropsWithChildren, useContext, useEffect, useMemo, useState} from "react";
import {useWindow} from "./WindowContext";

type SfxProfilesContextType = {
    ready: boolean;
    profiles: SbProfile[];
    activeProfile: SbProfile | null;
}

const SfxProfilesContext = createContext<SfxProfilesContextType | undefined>(undefined);

export default function SfxProfilesProvider({children}: PropsWithChildren) {
    const {route, settings} = useWindow();
    const [ready, setReady] = useState<boolean>(false);
    const [profiles, setProfiles] = useState<SbProfile[]>([]);


    useEffect(() => {
        window.electron.getProfiles(route).then(setProfiles);

        // TODO This should listen only for sfx profiles related to this window's route
        const unsubProfiles = window.electron.onProfilesChanged((profiles) => {
            setProfiles(profiles);
        });

        return () => {
            unsubProfiles();
        }
    }, []);

    const activeProfile: SbProfile = useMemo(() => {
        if (!settings || !profiles) return null;

        return profiles.find(p => p.id === settings.sfxSoundboard.activeProfile) || null;
    }, [route, settings, profiles]);

    useEffect(() => {
        if (profiles && activeProfile) setReady(true);
    }, [profiles, activeProfile]);

    return (
        <SfxProfilesContext.Provider value={{
            ready,
            profiles,
            activeProfile,
        }}>
            {children}
        </SfxProfilesContext.Provider>
    )
}

export function useSfxProfiles() {
    const context = useContext(SfxProfilesContext);
    if (context === undefined) throw new Error('useSfxProfiles must be used within a SfxProfilesProvider');
    return context;
}