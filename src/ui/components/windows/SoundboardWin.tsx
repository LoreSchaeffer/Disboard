import styles from './SoundboardWin.module.css';
import PlayerContextProvider from "../../context/PlayerContext";
import {useWindowContext} from "../../context/WindowContext";
import {useEffect, useRef} from "react";
import SvgIcon from "../SvgIcon";
import {MenuItemProps} from "../menu/ContextMenuItem";
import Soundboard from "../soundboard/Soundboard";

const defProfileSelectorItems: MenuItemProps[] = [
    {
        type: 'separator'
    },
    {
        text: 'New profile',
        icon: 'add',
        onClick: () => window.electron.openNewProfileWin(),
    },
    {
        type: 'separator'
    },
    {
        text: 'Import profile',
        icon: 'input',
        onClick: () => window.electron.importProfile(),
    },
    {
        text: 'Export all',
        icon: 'output',
        onClick: () => window.electron.exportProfiles(),
    }
];

const SoundboardWin = () => {
    const {settings, setSettings, profiles, activeProfile, titlebar, setContextMenu} = useWindowContext();

    const profileSelectorRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const handleMouseWheel = (e: WheelEvent) => {
            if (!e.ctrlKey) return;

            e.preventDefault();
            e.stopPropagation();

            const delta = e.deltaY;
            const newFontSize = settings.font_size + (delta > 0 ? -1 : 1);

            if (newFontSize < 1 || newFontSize > 24) return;

            setSettings({...settings, font_size: newFontSize});
        }

        window.addEventListener('wheel', handleMouseWheel);

        return () => {
            window.removeEventListener('wheel', handleMouseWheel);
        }
    }, []);

    useEffect(() => {
        titlebar?.setChildren(
            <span ref={profileSelectorRef} className={styles.profileSelector} onClick={handleProfileSelectorClick}>
                     {activeProfile?.name}
                <SvgIcon icon={"chevron_down"} size={"15px"} color={"var(--text-disabled)"}/>
                 </span>
        );
    }, [profiles, activeProfile, titlebar]);

    const handleProfileSelectorClick = () => {
        if (!profileSelectorRef.current) return;

        const items = profiles.map(p => ({
            text: p.name,
            type: activeProfile.id === p.id ? 'primary' : 'normal',
            icon: activeProfile.id === p.id ? 'radio_button_checked' : 'radio_button',
            submenu: {
                items: [
                    {
                        text: 'Export',
                        icon: 'output',
                        onClick: () => window.electron.exportProfile(p.id),
                    },
                    {
                        text: 'Delete',
                        icon: 'delete',
                        type: 'danger',
                        onClick: () => window.electron.deleteProfile(p.id),
                    }
                ]
            },
            onClick: () => {
                setSettings({...settings, active_profile: p.id});
            }
        }));

        const rect = profileSelectorRef.current.getBoundingClientRect();
        setContextMenu({
            x: rect.left,
            y: rect.bottom + 3,
            items: [...items, ...defProfileSelectorItems] as MenuItemProps[],
        });
    }

    // return (
    //     <PlayerContextProvider>
    //         <Soundboard/>
    //         <Player/>
    //     </PlayerContextProvider>
    // );

    return (
        <PlayerContextProvider>
            <Soundboard/>
        </PlayerContextProvider>
    )
}

export default SoundboardWin;