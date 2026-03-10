import {useProfiles} from "../context/ProfilesProvider";
import {PropsWithChildren, useEffect, useRef} from "react";
import {useWindow} from "../context/WindowContext";
import {useTitlebar} from "../context/TitlebarContext";
import ProfileSelector from "../components/misc/ProfileSelector";
import {usePlayer} from "../context/PlayerContext";

const BoardWin = ({children}: PropsWithChildren) => {
    const {settings, updateSettingsAsync} = useWindow();
    const {boardType, gridProfiles, activeGridProfile, ambientProfiles, activeAmbientProfile} = useProfiles();
    const {player} = usePlayer();
    const {setTitlebarContent} = useTitlebar();

    const zoomRef = useRef<number>(1);

    useEffect(() => {
        const handleMouseWheel = (e: WheelEvent) => {
            if (!e.ctrlKey) return;
            e.preventDefault();

            const delta = e.deltaY;
            const newZoom = zoomRef.current + (delta > 0 ? -0.02 : 0.02);

            if (newZoom < 0.1 || newZoom > 2) return;

            updateSettingsAsync({[boardType]: {zoom: Math.round(newZoom * 100) / 100}});
        }

        window.addEventListener('wheel', handleMouseWheel, {passive: false});

        return () => {
            window.removeEventListener('wheel', handleMouseWheel);
        }
    }, []);

    useEffect(() => {
        if (settings && settings[boardType] && settings[boardType].zoom) zoomRef.current = settings[boardType].zoom;
        if (settings && settings.discord) player.setBotMode(settings.discord.enabled);
    }, [settings]);

    useEffect(() => {
        if (boardType === 'ambient') setTitlebarContent(<ProfileSelector boardType={boardType} ambientProfiles={ambientProfiles} activeAmbientProfile={activeAmbientProfile}/>);
        else setTitlebarContent(<ProfileSelector boardType={boardType} gridProfiles={gridProfiles} activeGridProfile={activeGridProfile}/>);
    }, [gridProfiles, activeGridProfile, ambientProfiles, activeAmbientProfile]);

    return children;
}

export default BoardWin;