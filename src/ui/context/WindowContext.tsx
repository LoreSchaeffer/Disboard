import {Profile, Settings} from "../../types/storage";
import {createContext, Dispatch, PropsWithChildren, SetStateAction, useContext, useEffect, useState} from "react";
import {ContextMenuProps} from "../components/menu/ContextMenu";
import {TitlebarRef} from "../components/titlebar/Titlebar";

type WindowContextType = {
    ready: boolean;
    parent: number | null;
    resizable: boolean;
    page: string | null;
    settings: Settings;
    setSettings: (settings: Settings) => void;
    profiles: Profile[];
    setProfiles: (profiles: Profile[]) => void;
    activeProfile: Profile;
    contextMenu: ContextMenuProps | null;
    setContextMenu: (menu: ContextMenuProps | null) => void;
    titlebar: TitlebarRef | null;
    setTitlebar: Dispatch<SetStateAction<TitlebarRef | null>>;
}

const WindowContext = createContext<WindowContextType | undefined>(undefined);

export default function WindowContextProvider({children}: PropsWithChildren) {
    const [ready, setReady] = useState<boolean>(false);
    const [parent, setParent] = useState<number | null>(null);
    const [resizable, setResizable] = useState<boolean>(false);
    const [page, setPage] = useState<string>(null);
    const [settings, setSettings] = useState<Settings>(null);
    const [profiles, setProfiles] = useState<Profile[]>(null);
    const [activeProfile, setActiveProfile] = useState<Profile>(null);
    const [contextMenu, setContextMenu] = useState<ContextMenuProps | null>(null);
    const [titlebar, setTitlebar] = useState<TitlebarRef | null>(null);

    useEffect(() => {
        window.electron.getWindow().then((data: { parent: number | null, resizable: boolean, page: string }) => {
            setParent(data.parent);
            setResizable(data.resizable);
            setPage(data.page);
        });

        window.electron.getSettings().then((settings: Settings) => setSettings(settings));
        window.electron.getProfiles().then((profiles: Profile[]) => setProfiles(profiles));

        window.electron.onSettings((settings: Settings) => setSettings(settings));
        window.electron.onProfiles((profiles: Profile[]) => setProfiles(profiles));
    }, []);

    useEffect(() => {
        if (settings && profiles) setActiveProfile(profiles.find(p => p.id === settings.active_profile));
    }, [settings, profiles]);

    useEffect(() => {
        if (settings && profiles && activeProfile && page) setReady(true);
    }, [settings, profiles, activeProfile, page]);

    useEffect(() => {
        const onResize = () => {
            setContextMenu(null);
        }

        window.addEventListener('resize', onResize);

        return () => {
            window.removeEventListener('resize', onResize);
        }
    }, [contextMenu]);

    const updateSettings = (settings: Settings) => {
        setSettings(settings);
        window.electron.saveSettings(settings);
    }

    const updateProfiles = (profiles: Profile[]) => {
        setProfiles(profiles);
    }

    const updateContextMenu = (menu: ContextMenuProps | null) => {
        setContextMenu(() => {
            if (menu) menu.show = true;
            return menu;
        });
    }

    return (
        <WindowContext.Provider value={{
            ready,
            parent,
            resizable,
            page,
            settings,
            setSettings: updateSettings,
            profiles,
            setProfiles: updateProfiles,
            activeProfile,
            contextMenu,
            setContextMenu: updateContextMenu,
            titlebar,
            setTitlebar
        }}>
            {children}
        </WindowContext.Provider>
    )
}

export function useWindow() {
    const context = useContext(WindowContext);
    if (context === undefined) throw new Error('useWindowContext must be used within a WindowContextProvider');
    return context;
}