import styles from './SoundboardWin.module.css';
import React, {useEffect, useRef, useState} from "react";
import {FaChevronDown} from "react-icons/fa6";
import {PiArrowSquareInBold, PiArrowSquareOutBold, PiPlusBold, PiTrashBold} from "react-icons/pi";
import {IoMdRadioButtonOff, IoMdRadioButtonOn} from "react-icons/io";
import {FaChevronUp} from "react-icons/fa";
import {ContextMenuItemData} from "../components/context_menu/ContextMenuItem";
import {useWindow} from "../context/WindowContext";
import {useTitlebar} from "../context/TitlebarContext";
import {useContextMenu} from "../context/ContextMenuContext";
import Soundboard from "../components/soundboard/Soundboard";
import Player from "../components/player/Player";

const defProfileSelectorItems: ContextMenuItemData[] = [
    {separator: true},
    {
        label: 'New profile',
        icon: <PiPlusBold/>,
        onClick: () => console.log('Create new profile'), // TODO create new profile logic (use modal)
    },
    {separator: true},
    {
        label: 'Import profile',
        icon: <PiArrowSquareInBold/>,
        onClick: () => window.electron.importProfile(),
    },
    {
        label: 'Export all',
        icon: <PiArrowSquareOutBold/>,
        onClick: () => window.electron.exportProfiles(),
    }
];

const SoundboardWin = () => {
    const {settings, updateSettings, profiles, activeProfile} = useWindow();
    const {setTitlebarContent} = useTitlebar();
    const {showContextMenu} = useContextMenu();

    const [profileSelectorOpen, setProfileSelectorOpen] = useState<boolean>(false);

    const zoomRef = useRef<number>(settings.zoom || 1);

    useEffect(() => {
        const handleMouseWheel = (e: WheelEvent) => {
            if (!e.ctrlKey) return;
            e.preventDefault();

            const delta = e.deltaY;
            const newZoom = zoomRef.current + (delta > 0 ? -0.02 : 0.02);

            if (newZoom < 0.1 || newZoom > 2) return;

            updateSettings({zoom: Math.round(newZoom * 100) / 100});
        }

        window.addEventListener('wheel', handleMouseWheel, {passive: false});

        return () => {
            window.removeEventListener('wheel', handleMouseWheel);
        }
    }, []);

    useEffect(() => {
        if (settings) zoomRef.current = settings.zoom || 1;
    }, [settings]);

    useEffect(() => {
        setTitlebarContent(
            <span className={styles.profileSelector} onClick={handleProfileSelectorClick}>
                {activeProfile?.name}
                {profileSelectorOpen ? <FaChevronUp/> : <FaChevronDown/>}
            </span>
        )
    }, [profiles, activeProfile]);

    const handleProfileSelectorClick = (event: React.MouseEvent) => {
        const items: ContextMenuItemData[] = profiles.map(p => ({
            label: p.name,
            icon: activeProfile.id === p.id ? <IoMdRadioButtonOn/> : <IoMdRadioButtonOff/>,
            variant: activeProfile.id === p.id ? 'primary' : undefined,
            children: [
                {
                    label: 'Export',
                    icon: <PiArrowSquareOutBold/>,
                    onClick: () => window.electron.exportProfile(p.id),
                },
                {separator: true},
                {
                    label: 'Delete',
                    icon: <PiTrashBold/>,
                    variant: 'danger',
                    onClick: () => window.electron.deleteProfile(p.id),
                }
            ],
            onClick: () => updateSettings({activeProfile: p.id}),
        }));

        const rect = (event.target as HTMLElement).getBoundingClientRect();

        showContextMenu({
            items: [...items, ...defProfileSelectorItems],
            customPos: {x: rect.left, y: rect.bottom + 5},
            onShow: () => setProfileSelectorOpen(true),
            onHide: () => setProfileSelectorOpen(false),
        });
    }

    return (
        <>
            <Soundboard/>
            <Player/>
        </>
    )
}

export default SoundboardWin;