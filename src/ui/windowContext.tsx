import {createContext, Dispatch, FC, ReactNode, SetStateAction, useContext, useEffect, useState} from "react";
import {SettingsData} from "../utils/store/settings";
import {Profile, SbButton, Style} from "../utils/store/profiles";
import {ContextMenuProps} from "../components/context/ContextMenu";
import {Player} from "./player";

interface ContextData {
    ready: boolean;
    winId: number;
    winParent: number;
    resizable: boolean;
    settings: SettingsData;
    setSettings: Dispatch<SetStateAction<SettingsData>>;
    profiles: Profile[];
    setProfiles: Dispatch<SetStateAction<Profile[]>>;
    activeProfile: Profile;
    setActiveProfile: Dispatch<SetStateAction<Profile>>;
    contextMenu: ContextMenuProps | null;
    setContextMenu: Dispatch<SetStateAction<ContextMenuProps>>;
    mainPlayer: Player;
    previewPlayer: Player;
    copiedButton: SbButton;
    setCopiedButton: Dispatch<SetStateAction<SbButton>>;
    copiedStyle: Style;
    setCopiedStyle: Dispatch<SetStateAction<Style>>;
}

export const DataContext = createContext<ContextData | undefined>(undefined);

export const WindowContextProvider: FC<{ children: ReactNode }> = ({children}) => {
    const [ready, setReady] = useState<boolean>(false);
    const [winId, setWinId] = useState<number | undefined>(undefined);
    const [winParent, setWinParent] = useState<number | null>(null);
    const [resizable, setResizable] = useState<boolean>(false);
    const [settings, setSettings] = useState<SettingsData>(undefined);
    const [profiles, setProfiles] = useState<Profile[]>(undefined);
    const [activeProfile, setActiveProfile] = useState<Profile>(undefined);
    const [contextMenu, setContextMenu] = useState<ContextMenuProps>();
    const [mainPlayer] = useState<Player>(new Player());
    const [previewPlayer] = useState<Player>(new Player());
    const [copiedButton, setCopiedButton] = useState<SbButton>(undefined);
    const [copiedStyle, setCopiedStyle] = useState<Style>(undefined);

    useEffect(() => {
        (window as any).electron.handleReady('ready', (winId: number, parent: number, resizable: boolean) => {
            setWinId(winId);
            setWinParent(parent);
            setResizable(resizable);
        });

        (window as any).electron.handleSettings('settings', (settings: SettingsData) => setSettings(settings));
        (window as any).electron.handleProfiles('profiles', (profiles: Profile[]) => setProfiles(profiles));
    }, []);

    useEffect(() => {
        mainPlayer.setVolume(settings?.volume || 50);
        mainPlayer.setOutputDevice(settings?.output_device || 'default');
        mainPlayer.loop(settings?.loop || 'none');
        previewPlayer.setVolume(settings?.volume || 50);
        previewPlayer.setOutputDevice(settings?.preview_output_device || 'default');
    }, [settings]);

    useEffect(() => {
        if (!settings || !profiles) return;
        const activeProfile = settings.active_profile;
        setActiveProfile(profiles.find(p => p.id === activeProfile));
    }, [settings, profiles]);

    useEffect(() => {
        if (winId && settings && profiles && activeProfile) setReady(true);
    }, [winId, settings, profiles, activeProfile]);

    return (
        <DataContext.Provider value={{
            ready,
            winId,
            winParent,
            resizable,
            settings, setSettings,
            profiles, setProfiles,
            activeProfile, setActiveProfile,
            contextMenu, setContextMenu,
            mainPlayer,
            previewPlayer,
            copiedButton, setCopiedButton,
            copiedStyle, setCopiedStyle
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) throw new Error('useData must be used within a WindowContextProvider');
    return context;
};