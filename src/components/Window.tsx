import Titlebar from "./titlebar/Titlebar";
import Soundboard from "./soundboard/Soundboard";

import {useEffect, useState} from "react";
import {useData} from "../ui/context";
import Player from "./player/Player";
import {SettingsData} from "../utils/store/settings";
import {Profile} from "../utils/store/profiles";
import {PlayerContextProvider} from "../ui/playerContext";
import ContextMenu from "./context/ContextMenu";

const Window = () => {
    const {setWinId, setParent, setResizable, settings, setSettings, profiles, setProfiles, contextMenu} = useData();
    const [loading, setLoading] = useState<number>(0);

    useEffect(() => {
        const fetchData = async () => {
            const settings = await (window as any).electron.getSettings();
            const profiles = await (window as any).electron.getProfiles();

            setSettings(settings);
            setProfiles(profiles);
            setLoading(prev => prev + 1);
        };

        fetchData();

        (window as any).electron.handleReady('ready', (winId: number, parent: number, resizable: boolean) => {
            setWinId(winId);
            setParent(parent);
            setResizable(resizable);
            setLoading(prev => prev + 1);
        });

        (window as any).electron.handleSettings('settings', (settings: SettingsData) => setSettings(settings));
        (window as any).electron.handleProfiles('profiles', (profiles: Profile[]) => setProfiles(profiles));
    }, []);

    if (loading < 2 || !settings || !profiles) {
        return <Titlebar/>;
    } else {
        return (
            <>
                <Titlebar/>
                <div className="app">
                    {contextMenu && <ContextMenu {...contextMenu}/>}
                    <Soundboard/>
                    <PlayerContextProvider>
                        <Player/>
                    </PlayerContextProvider>
                </div>
            </>
        );
    }
};

export default Window;