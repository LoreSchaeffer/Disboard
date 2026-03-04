import {BoardType, SbGridProfile} from "../../types/";
import {createContext, PropsWithChildren, useContext, useEffect, useMemo, useState} from "react";
import {useWindow} from "./WindowContext";

type ProfilesContextType = {
    ready: boolean;
    profiles: SbGridProfile[];
    activeProfile: SbGridProfile | null;
    boardType: Exclude<BoardType, 'ambient'>;
}

const GridProfilesContext = createContext<ProfilesContextType | undefined>(undefined);

export default function GridProfilesProvider({children}: PropsWithChildren) {
    const {settings, data} = useWindow();
    const [ready, setReady] = useState<boolean>(false);
    const [profiles, setProfiles] = useState<SbGridProfile[] | null>(null);
    const boardType = data?.boardType as Exclude<BoardType, 'ambient'> | undefined;

    useEffect(() => {
        if (!boardType || (boardType as BoardType) === 'ambient') return;

        window.electron.gridProfiles.getAll(boardType).then(setProfiles);

        const unsubProfiles = boardType === 'music'
            ? window.electron.gridProfiles.onMusicChanged((profiles) => setProfiles(profiles))
            : window.electron.gridProfiles.onSfxChanged((profiles) => setProfiles(profiles));

        return () => {
            if (unsubProfiles) unsubProfiles();
        }
    }, [boardType]);

    const activeProfile: SbGridProfile | null = useMemo(() => {
        if (!settings || profiles === null || !boardType) return null;

        const boardSettings = settings[boardType];
        if (!boardSettings) return null;

        return profiles.find(p => p.id === boardSettings.activeProfile) || null;
    }, [settings, profiles, boardType]);

    useEffect(() => {
        if (profiles !== null && settings) setReady(true);
    }, [profiles, settings]);

    if (!boardType) return null;

    return (
        <GridProfilesContext.Provider value={{
            ready,
            profiles: profiles || [],
            activeProfile,
            boardType
        }}>
            {children}
        </GridProfilesContext.Provider>
    )
}

export function useGridProfiles() {
    const context = useContext(GridProfilesContext);
    if (context === undefined) throw new Error('useGridProfiles must be used within a GridProfilesProvider');
    return context;
}