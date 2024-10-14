import './SoundboardWin.css';
import Window from "../Window";
import Soundboard from "../soundboard/Soundboard";
import {PlayerContextProvider} from "../../ui/playerContext";
import Player from "../player/Player";
import React, {useRef} from "react";
import SvgIcon from "../generic/SvgIcon";
import {useData} from "../../ui/context";
import {MenuItemProps} from "../context/MenuItem";
import {Submenu} from "../context/ContextMenu";

const SoundboardWin = () => {
    const {settings, profiles, activeProfile, setContextMenu, setActiveProfile} = useData();

    const profilesRef = useRef<HTMLSpanElement>(null);

    const defItems = [
        {
            type: 'separator'
        },
        {
            text: 'New profile',
            icon: 'add',
            onClick: () => console.log('New profile')
        },
        {
            type: 'separator'
        },
        {
            text: 'Import profile',
            icon: 'input',
            onClick: () => console.log('Import profile')
        },
        {
            text: 'Export all',
            icon: 'output',
            onClick: () => console.log('Export all profiles'),
        }
    ];

    const handleProfilesClick = (e: React.MouseEvent) => {
        if (!profilesRef.current) return;

        const rect = profilesRef.current.getBoundingClientRect();
        const x = rect.left;
        const y = rect.bottom;

        const items = profiles.map(profile => ({
            text: profile.name,
            type: activeProfile.id === profile.id ? 'primary' : 'normal',
            icon: activeProfile.id === profile.id ? 'radio_button_checked' : 'radio_button',
            submenu: profile.id,
            onClick: () => {
                setActiveProfile(profile);
                settings.active_profile = profile.id;
                (window as any).electron.saveSettings(settings);
            }
        }));

        const submenus = profiles.map(profile => ({
            id: profile.id,
            items: [
                {
                    text: 'Rename',
                    icon: 'edit',
                    onClick: () => console.log('Rename profile')
                },
                {
                    text: 'Export',
                    icon: 'output',
                    onClick: () => console.log('Export profile')
                },
                {
                    text: 'Delete',
                    icon: 'delete',
                    type: 'danger',
                    onClick: () => console.log('Delete profile')
                }
            ]
        }));

        setContextMenu({
            x: x,
            y: y,
            items: [...items, ...defItems] as MenuItemProps[],
            submenus: submenus as Submenu[]
        });
    }

    const titlebar = (
        <>
        <span ref={profilesRef} className={"profiles"} onClick={handleProfilesClick}>
            {activeProfile?.name}
            <SvgIcon icon={"chevron_down"} size={"15px"} color={"var(--text-disabled)"}/>
        </span>
        </>
    );

    return (
        <Window titlebar={titlebar}>
            <Soundboard/>
            <PlayerContextProvider>
                <Player/>
            </PlayerContextProvider>
        </Window>
    );
}

export default SoundboardWin;