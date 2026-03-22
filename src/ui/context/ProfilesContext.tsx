import {BoardType, SbAmbientProfile, SbGridProfile} from "../../types/";
import {createContext, PropsWithChildren, useContext, useEffect, useMemo, useState} from "react";
import {useWindow} from "./WindowContext";

type ProfilesContextType = {
    ready: boolean;
    boardType: BoardType;
    gridProfiles: SbGridProfile[];
    activeGridProfile: SbGridProfile | null;
    ambientProfiles: SbAmbientProfile[];
    activeAmbientProfile: SbAmbientProfile | null;
}

const ProfilesContext = createContext<ProfilesContextType | undefined>(undefined);

export default function ProfilesProvider({children}: PropsWithChildren) {
    const {settings, data} = useWindow();
    const [ready, setReady] = useState<boolean>(false);
    const [gridProfiles, setGridProfiles] = useState<SbGridProfile[] | null>(null);
    const [ambientProfiles, setAmbientProfiles] = useState<SbAmbientProfile[] | null>(null);
    const boardType: BoardType | undefined = data?.boardType;

    useEffect(() => {
        let unsubProfiles;

        if (boardType === 'music' || boardType === 'sfx') {
            window.electron.gridProfiles.getAll(boardType).then(setGridProfiles);
            unsubProfiles = boardType === 'music'
                ? window.electron.gridProfiles.onMusicChanged((profiles) => setGridProfiles(profiles))
                : window.electron.gridProfiles.onSfxChanged((profiles) => setGridProfiles(profiles));
        } else {
            window.electron.ambientProfiles.getAll().then(setAmbientProfiles);
            unsubProfiles = window.electron.ambientProfiles.onChanged((profiles) => setAmbientProfiles(profiles));
        }

        return () => {
            if (unsubProfiles) unsubProfiles();
        }
    }, [boardType]);

    const activeGridProfile: SbGridProfile | null = useMemo(() => {
        if (!settings || gridProfiles === null || !boardType) return null;

        const boardSettings = settings[boardType];
        if (!boardSettings) return null;

        return gridProfiles.find(p => p.id === boardSettings.activeProfile) || null;
    }, [settings, gridProfiles, boardType]);

    const activeAmbientProfile: SbAmbientProfile | null = useMemo(() => {
        if (!settings || ambientProfiles === null || !boardType) return null;

        const boardSettings = settings[boardType];
        if (!boardSettings) return null;

        return ambientProfiles.find(p => p.id === boardSettings.activeProfile) || null;
    }, [settings, ambientProfiles, boardType]);

    useEffect(() => {
        if (!boardType) return;

        if (boardType === 'music' || boardType === 'sfx') {
            if (gridProfiles !== null && settings) setReady(true);
        } else {
            if (ambientProfiles !== null && settings) setReady(true);
        }
    }, [boardType, gridProfiles, ambientProfiles, settings]);

    if (!boardType) return null;

    return (
        <ProfilesContext.Provider value={{
            ready,
            boardType,
            gridProfiles: gridProfiles || [],
            activeGridProfile: activeGridProfile,
            ambientProfiles: ambientProfiles || [],
            activeAmbientProfile: activeAmbientProfile,
        }}>
            {children}
        </ProfilesContext.Provider>
    )
}

export function useProfiles() {
    const context = useContext(ProfilesContext);
    if (context === undefined) throw new Error('useProfiles must be used within a ProfilesContext');
    return context;
}