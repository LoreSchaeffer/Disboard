import {createContext, PropsWithChildren, useContext, useEffect, useMemo, useRef, useState} from "react";
import {Settings} from "../../types/settings";
import {SbProfile} from "../../types/data";
import {WindowData} from "../../types/window";

type WindowContextType = {
    ready: boolean;
    parent: number | null;
    resizable: boolean;
    page: string | null;
    settings: Settings | null;
    updateSettings?: (settings: Partial<Settings>) => void;
    profiles: SbProfile[] | null;
    activeProfile: SbProfile | null;
    data: WindowData<unknown> | null;
}

const WindowContext = createContext<WindowContextType | undefined>(undefined);

export default function WindowProvider({children}: PropsWithChildren) {
    const [ready, setReady] = useState<boolean>(false);
    const [parent, setParent] = useState<number | null>(null);
    const [resizable, setResizable] = useState<boolean>(false);
    const [page, setPage] = useState<string | null>(null);
    const [settings, setSettings] = useState<Settings | null>(null);
    const [profiles, setProfiles] = useState<SbProfile[] | null>(null);
    const [data, setData] = useState<WindowData<unknown> | null>(null);

    const saveSettingsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const loadInitialData = async () => {
            const winData = await window.electron.getWindow();
            setParent(winData.parent);
            setResizable(winData.resizable);
            setPage(winData.page);
            setData(winData.data || null);

            const initialSettings = await window.electron.getSettings();
            setSettings(initialSettings);

            const initialProfiles = await window.electron.getProfiles();
            setProfiles(initialProfiles);
        };

        loadInitialData();

        const unsubSettings = window.electron.onSettingsChanged(setSettings);
        const unsubProfiles = window.electron.onProfilesChanged(setProfiles);

        return () => {
            unsubSettings();
            unsubProfiles();

            if (saveSettingsTimeoutRef.current) {
                clearTimeout(saveSettingsTimeoutRef.current);
                saveSettingsTimeoutRef.current = null;
            }
        };
    }, []);

    const activeProfile = useMemo(() => {
        if (!settings || !profiles) return null;
        return profiles.find(p => p.id === settings.activeProfile) || null;
    }, [settings, profiles]);

    useEffect(() => {
        if (settings && profiles && page) setReady(true);
    }, [settings, profiles, page]);

    const updateSettings = (newSettings: Partial<Settings>) => {
        if (!settings) return;

        const updatedSettings = {...settings, ...newSettings};
        setSettings(updatedSettings);

        if (saveSettingsTimeoutRef.current) clearTimeout(saveSettingsTimeoutRef.current);
        saveSettingsTimeoutRef.current = setTimeout(() => {
            window.electron.updateSettings(newSettings);
            saveSettingsTimeoutRef.current = null;
        }, 500);
    }

    return (
        <WindowContext.Provider value={{
            ready,
            parent,
            resizable,
            page,
            settings,
            updateSettings,
            profiles,
            activeProfile,
            data,
        }}>
            {children}
        </WindowContext.Provider>
    )
}

export function useWindow() {
    const context = useContext(WindowContext);
    if (context === undefined) throw new Error('useWindow must be used within a WindowProvider');
    return context;
}