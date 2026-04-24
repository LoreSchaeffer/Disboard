import {useProfiles} from "../context/ProfilesContext";
import {PropsWithChildren, useEffect, useRef} from "react";
import {useShortcut, useWindow} from "../context/WindowContext";
import {useTitlebar} from "../context/TitlebarContext";
import ProfileSelector from "../components/misc/ProfileSelector";
import {usePlayer} from "../context/PlayerContext";
import {useNavigation} from "../context/NavigationContext";
import {GridMediaSelectorWin} from "../../types";

const BoardWin = ({children}: PropsWithChildren) => {
    const {settings, updateSettingsAsync} = useWindow();
    const {boardType, gridProfiles, activeGridProfile, ambientProfiles, activeAmbientProfile} = useProfiles();
    const {player} = usePlayer();
    const {setTitle, setMainContent} = useTitlebar();
    const {navigate, isInStack} = useNavigation();

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

        setTitle(`Disboard ${boardType.charAt(0).toUpperCase() + boardType.slice(1)}`);

        return () => {
            window.removeEventListener('wheel', handleMouseWheel);
        }
    }, []);

    useEffect(() => {
        if (settings && settings[boardType] && settings[boardType].zoom) zoomRef.current = settings[boardType].zoom;
        if (settings && settings.discord) player.setBotMode(settings.discord.enabled);
    }, [settings]);

    useEffect(() => {
        if (boardType === 'ambient') setMainContent(<ProfileSelector boardType={boardType} ambientProfiles={ambientProfiles} activeAmbientProfile={activeAmbientProfile}/>);
        else setMainContent(<ProfileSelector boardType={boardType} gridProfiles={gridProfiles} activeGridProfile={activeGridProfile}/>);
    }, [gridProfiles, activeGridProfile, ambientProfiles, activeAmbientProfile]);

    useShortcut('ctrl+s', () => {
        if (!isInStack('settings')) navigate('settings', {replace: false});
    });

    useShortcut('ctrl+d', () => window.electron.settings.set({discord: {enabled: !settings.discord.enabled}}));

    useShortcut('ctrl+shift+m', () => {
        if (boardType === 'music') return;

        window.electron.window.isBoardOpen('music').then(open => {
            if (!open) window.electron.window.open('music_board')
        });
    });

    useShortcut('ctrl+shift+s', () => {
        if (boardType === 'sfx') return;

        window.electron.window.isBoardOpen('sfx').then(open => {
            if (!open) window.electron.window.open('sfx_board')
        });
    });

    useShortcut('ctrl+shift+a', () => {
        if (boardType === 'ambient') return;

        window.electron.window.isBoardOpen('ambient').then(open => {
            if (!open) window.electron.window.open('ambient_board')
        });
    });

    useShortcut('ctrl+shift+:', () => window.electron.settings.set({[boardType]: {volume: settings[boardType].volume + 1}}));

    useShortcut('ctrl+shift+;', () => window.electron.settings.set({[boardType]: {volume: settings[boardType].volume - 1}}));

    useShortcut('ctrl+shift+l', () => window.electron.system.openFile('./logs/main.log'));

    useShortcut('ctrl+n', () => window.electron.window.open('grid_media_selector', {boardType: boardType, action: 'play_now'} as GridMediaSelectorWin));

    return children;
}

export default BoardWin;