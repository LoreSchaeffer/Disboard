import React, {useEffect, useRef, useState} from "react";
import {useWindow} from "../context/WindowContext";
import {useTitlebar} from "../context/TitlebarContext";
import GridSoundboard from "../components/soundboard/grid/GridSoundboard";
import GridProfileSettings from "../components/soundboard/grid/GridProfileSettings";
import {usePlayer} from "../context/PlayerContext";
import {useProfiles} from "../context/ProfilesProvider";
import ProfileSelector from "../components/misc/ProfileSelector";
import SfxControls from "../components/soundboard/grid/sfx/SfxControls";

const SfxBoardWin = () => {
    const {settings, updateSettingsAsync} = useWindow();
    const {boardType, gridProfiles, activeGridProfile} = useProfiles();
    const {player} = usePlayer();
    const {setTitlebarContent} = useTitlebar();

    const [profileSettingsOpen, setProfileSettingsOpen] = useState<boolean>(false);

    const zoomRef = useRef<number>(settings.zoom || 1);

    useEffect(() => {
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
            boardType={boardType}
            gridProfiles={gridProfiles}
            activeGridProfile={activeGridProfile}
        />);
    }, [gridProfiles, activeGridProfile]);

    return (
        <>
            <GridSoundboard gridHeight={'calc(100vh - var(--titlebar-height) - var(--sfx-controls-height) - 10px)'}/>
            <SfxControls showProfileSettings={() => setProfileSettingsOpen(true)}/>

            <GridProfileSettings
                show={profileSettingsOpen}
                onClose={() => setProfileSettingsOpen(false)}
                mb={'calc(var(--sfx-controls-height) + 10px)'}
            />
        </>
    )
}

export default SfxBoardWin;