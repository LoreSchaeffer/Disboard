import React, {useEffect, useRef, useState} from "react";
import {useWindow} from "../context/WindowContext";
import {useTitlebar} from "../context/TitlebarContext";
import GridSoundboard from "../components/soundboard/grid/GridSoundboard";
import Player from "../components/player/Player";
import GridProfileSettings from "../components/soundboard/grid/GridProfileSettings";
import {usePlayer} from "../context/PlayerContext";
import Playlist from "../components/player/Playlist";
import {useProfiles} from "../context/ProfilesProvider";
import ProfileSelector from "../components/misc/ProfileSelector";

const MusicBoardWin = () => {
    const {settings, updateSettingsAsync} = useWindow();
    const {gridProfiles, activeGridProfile} = useProfiles();
    const {player} = usePlayer();
    const {setTitlebarContent} = useTitlebar();

    const [profileSettingsOpen, setProfileSettingsOpen] = useState<boolean>(false);
    const [playlistOpen, setPlaylistOpen] = useState<boolean>(false);

    const zoomRef = useRef<number>(settings.zoom || 1);

    useEffect(() => {
        player.setCaptureMediaKeys(true);

        const handleMouseWheel = (e: WheelEvent) => {
            if (!e.ctrlKey) return;
            e.preventDefault();

            const delta = e.deltaY;
            const newZoom = zoomRef.current + (delta > 0 ? -0.02 : 0.02);

            if (newZoom < 0.1 || newZoom > 2) return;

            updateSettingsAsync({zoom: Math.round(newZoom * 100) / 100});
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
        setTitlebarContent(<ProfileSelector
            boardType={'music'}
            gridProfiles={gridProfiles}
            activeGridProfile={activeGridProfile}
        />);
    }, [gridProfiles, activeGridProfile]);

    return (
        <>
            <GridSoundboard/>
            <Player
                showProfileSettings={() => setProfileSettingsOpen(true)}
                showPlaylist={() => setPlaylistOpen(true)}
            />

            <GridProfileSettings
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

export default MusicBoardWin;