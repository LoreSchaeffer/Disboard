import {createContext, Dispatch, FC, ReactNode, SetStateAction, useContext, useEffect, useState} from "react";
import {SettingsData} from "../utils/store/settings";
import {Profile} from "../utils/store/profiles";
import {ContextMenuProps} from "../components/context/ContextMenu";
import {Player} from "./player";

interface ContextData {
    winId: number;
    setWinId: Dispatch<SetStateAction<number>>
    parent: number;
    setParent: Dispatch<SetStateAction<number>>;
    resizable: boolean;
    setResizable: Dispatch<SetStateAction<boolean>>;
    settings: SettingsData;
    setSettings: Dispatch<SetStateAction<SettingsData>>;
    profiles: Profile[];
    setProfiles: Dispatch<SetStateAction<Profile[]>>;
    activeProfile: Profile;
    setActiveProfile: Dispatch<SetStateAction<Profile>>;
    contextMenu: ContextMenuProps | null;
    setContextMenu: Dispatch<SetStateAction<ContextMenuProps>>;
    player: Player;
}

export const DataContext = createContext<ContextData | undefined>(undefined);

export const WindowContextProvider: FC<{ children: ReactNode }> = ({children}) => {
    const [winId, setWinId] = useState<number>(0);
    const [parent, setParent] = useState<number>(0);
    const [resizable, setResizable] = useState<boolean>(false);
    const [settings, setSettings] = useState<SettingsData>();
    const [profiles, setProfiles] = useState<Profile[]>();
    const [activeProfile, setActiveProfile] = useState<Profile>();
    const [contextMenu, setContextMenu] = useState<ContextMenuProps>();
    const [player, setPlayer] = useState<Player>(new Player());

    useEffect(() => {
        setPlayer(new Player());
    }, []);

    return (
        <DataContext.Provider value={{
            winId, setWinId,
            parent, setParent,
            resizable, setResizable,
            settings, setSettings,
            profiles, setProfiles,
            activeProfile, setActiveProfile,
            contextMenu, setContextMenu,
            player
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