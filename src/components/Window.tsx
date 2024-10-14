import Titlebar from "./titlebar/Titlebar";
import React, {useEffect, useState} from "react";
import {useData} from "../ui/context";
import {SettingsData} from "../utils/store/settings";
import {Profile} from "../utils/store/profiles";
import ContextMenu from "./context/ContextMenu";

type WindowProps = {
    children?: React.ReactNode;
    titlebar?: React.ReactNode;
};

const Window = ({children, titlebar}: WindowProps) => {
    const {setWinId, setParent, setResizable, settings, setSettings, profiles, setProfiles, setActiveProfile, contextMenu} = useData();
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

    useEffect(() => {
        if (!settings || !profiles) return;
        const activeProfile = settings.active_profile;
        setActiveProfile(profiles.find(p => p.id === activeProfile));
    }, [settings, profiles]);

    if (loading < 2 || !settings || !profiles) {
        return <Titlebar/>;
    } else {
        return (
            <>
                <Titlebar>
                    {titlebar}
                </Titlebar>
                <div className="app">
                    {contextMenu && <ContextMenu {...contextMenu}/>}
                    {children}
                </div>
            </>
        );
    }
};

export default Window;