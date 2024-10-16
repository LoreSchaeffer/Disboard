import './SoundboardWin.css';
import Window from "./Window";
import Soundboard from "../soundboard/Soundboard";
import {PlayerContextProvider} from "../../ui/playerContext";
import Player from "../player/Player";
import React, {useEffect, useRef} from "react";
import SvgIcon from "../generic/SvgIcon";
import {useData} from "../../ui/windowContext";
import {MenuItemProps} from "../context/MenuItem";
import {Submenu} from "../context/ContextMenu";

const SoundboardWin = () => {
    const {settings, setSettings, profiles, activeProfile, setContextMenu, setActiveProfile} = useData();

    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (!e.ctrlKey) return;

            e.preventDefault();
            e.stopPropagation();

            const delta = e.deltaY;
            const newFontSize = settings.font_size + (delta > 0 ? -1 : 1);

            if (newFontSize < 1 || newFontSize > 24) return;

            setSettings({...settings, font_size: newFontSize});
            setTimeout(() => (window as any).electron.saveSettings(settings), 50);
        }

        window.addEventListener('wheel', handleWheel);

        return () => {
            window.removeEventListener('wheel', handleWheel);
        }
    }, [settings, setSettings]);

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
            onClick: () => (window as any).electron.importProfile(),
        },
        {
            text: 'Export all',
            icon: 'output',
            onClick: () => (window as any).electron.exportAllProfiles(),
        }
    ];

    const handleProfilesClick = () => {
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
                setSettings({...settings, active_profile: profile.id});

                setTimeout(() => (window as any).electron.saveSettings(settings), 50);
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
                    onClick: () => (window as any).electron.exportProfile(profile.id),
                },
                {
                    text: 'Delete',
                    icon: 'delete',
                    type: 'danger',
                    onClick: () => (window as any).electron.deleteProfile(profile.id),
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
        <span ref={profilesRef} className={"profiles"} onClick={handleProfilesClick}>
            {activeProfile?.name}
            <SvgIcon icon={"chevron_down"} size={"15px"} color={"var(--text-disabled)"}/>
        </span>
    );

    return (
        <Window titlebar={titlebar}>
            <PlayerContextProvider>
                <Soundboard/>
                <Player/>
            </PlayerContextProvider>
        </Window>
    );
}

export default SoundboardWin;