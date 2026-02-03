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
import ProfileSettings from "../components/soundboard/ProfileSettings";
import {useNavigation} from "../context/NavigationContext";
import {usePlayer} from "../context/PlayerContext";
import Playlist from "../components/player/Playlist";

const SoundboardWin = () => {
    const {settings, updateSettings, profiles, activeProfile} = useWindow();
    const {player} = usePlayer();
    const {setTitlebarContent} = useTitlebar();
    const {showContextMenu} = useContextMenu();
    const {navigate} = useNavigation();

    const [profileSelectorOpen, setProfileSelectorOpen] = useState<boolean>(false);
    const [profileSettingsOpen, setProfileSettingsOpen] = useState<boolean>(false);
    const [playlistOpen, setPlaylistOpen] = useState<boolean>(false);

    const zoomRef = useRef<number>(settings.zoom || 1);

    // TODO only for development, remove later
    useEffect(() => {
        // navigate('settings', false);
        // navigate('new_profile', false);
    }, []);

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
        if (settings && settings.discord) player.setBotMode(settings.discord.enabled);
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

        const defProfileSelectorItems: ContextMenuItemData[] = [
            {separator: true},
            {
                label: 'New profile',
                icon: <PiPlusBold/>,
                onClick: () => navigate('new_profile', false),
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
            <Player
                showProfileSettings={() => setProfileSettingsOpen(true)}
                showPlaylist={() => setPlaylistOpen(true)}
            />

            <ProfileSettings
                show={profileSettingsOpen}
                onClose={() => setProfileSettingsOpen(false)}
            />

            <Playlist
                show={playlistOpen}
                onClose={() => setPlaylistOpen(false)}
            />
        </>
    )
}

export default SoundboardWin;